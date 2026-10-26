# AGENTS.md

Linkwarden is a self-hosted, collaborative bookmark manager that collects, reads, annotates and preserves webpages. This file is the orientation map for agents working in this repository: what the pieces are, how they talk to each other, which commands to run, and where the public-facing sites live.

## Repository layout

Yarn 4 workspaces monorepo (`apps/*` and `packages/*`). No Turborepo; orchestration is plain root-level scripts.

### Apps

| Path | Workspace | What it is |
| --- | --- | --- |
| `apps/web` | `@linkwarden/web` | Next.js app (Pages Router). Serves the UI and the whole REST API. |
| `apps/worker` | `@linkwarden/worker` | Long-running Node/tsx process. Preservation, AI tagging, search indexing, RSS polling, data migrations. |
| `apps/mobile` | `@linkwarden/mobile` | Expo / React Native app (expo-router, NativeWind) for iOS and Android. |
| `apps/extension` | `@linkwarden/extension` | Vite + React browser extension (Chrome, Firefox, Safari). |

### Packages

Shared code, all plain TypeScript source with `main: index.ts` (no build step; consumers transpile them).

| Path | Workspace | What it is |
| --- | --- | --- |
| `packages/prisma` | `@linkwarden/prisma` | `schema.prisma`, migrations, generated client, seed. The single source of truth for the data model. |
| `packages/types` | `@linkwarden/types` | Shared TypeScript types (`global.ts` is the big one). |
| `packages/lib` | `@linkwarden/lib` | Server and client helpers: Zod schemas (`schemaValidation.ts`), constants, SSRF guards (`ssrf.ts`, `safeFetch.ts`), Meilisearch client, mailer, RSS handling, format helpers. |
| `packages/filesystem` | `@linkwarden/filesystem` | Storage abstraction. Writes to local disk or S3-compatible object storage depending on whether S3 env vars are set. |
| `packages/router` | `@linkwarden/router` | TanStack Query hooks (`useLinks`, `useCollections`, `useTags`, ...). Shared by **web and mobile**, which is why it lives outside `apps/web`. |

Dependency direction: `prisma` → `types` → `lib`/`filesystem` → `router` → apps. Nothing in `packages/` imports from `apps/`.

## Architecture

### Request path (web)

1. `apps/web/pages/api/v1/**` (plus a small `v2/` for the new dashboard) are thin Next API route handlers. They authenticate via `verifyUser` / `getTokenFromRequest` (NextAuth session or API token), parse and coerce query params, and check demo mode.
2. Business logic lives in `apps/web/lib/api/controllers/<resource>/`. Routes stay dumb; controllers return `{ status, response }`.
3. Permissions for shared collections go through `apps/web/lib/api/getPermission.ts` and `getAccessibleCollectionIds.ts`. Any new link or collection query must respect collection membership, not just ownership.
4. Client components never call `axios` directly; they use the hooks in `packages/router`, so web and mobile share cache keys, optimistic updates and invalidation rules.

### Preservation path (worker)

The web app only records intent. The worker does the heavy lifting.

- `apps/worker/index.ts` is a supervisor that respawns `worker.ts` on exit.
- `worker.ts` runs the migration worker once, then starts the loops: `linkProcessing`, `autoTagPreservedLinks`, `linkIndexing`, `rssPolling` (interval from `ARCHIVE_SCRIPT_INTERVAL`, default 10s).
- `linkProcessing` claims a batch of unpreserved links (`lib/getLinkBatch.ts`, `getLinkBatchFairly.ts` spreads work across users), drives a headless Chromium through `lib/preservationScheme/*` to produce a screenshot, PDF, readability text, preview image and single-file HTML (Rust `monolith` binary), and optionally pushes to the Wayback Machine.
- Artifacts are written through `@linkwarden/filesystem`, so they land on disk or in S3 without the callers caring.
- AI tagging uses the Vercel AI SDK with pluggable providers (Ollama, OpenAI and compatible, Azure, Anthropic, OpenRouter, Perplexity), selected by env vars.
- `linkIndexing` pushes link text into Meilisearch; full text search in the web app reads from there.

### Infrastructure dependencies

PostgreSQL (Prisma), Meilisearch (search), Chromium via Playwright plus the `monolith` binary (preservation), optional S3-compatible storage, optional SMTP, optional Stripe and Apple/Google IAP for the Cloud offering.

## Commands

Run everything from the repo root. Root scripts wrap `dotenv --` so the root `.env` is loaded for you; running a workspace script directly usually will not see those vars.

**Setup**

```bash
yarn install            # also runs prisma generate via postinstall + patch-package
yarn prisma:deploy      # apply migrations (use prisma:dev to create one)
```

**Develop**

```bash
yarn concurrently:dev   # web + worker together (the usual one)
yarn web:dev            # web only, localhost:3000
yarn worker:dev         # worker only, tsx watch
yarn prisma:studio      # inspect the database
```

**Build and run production locally**

```bash
yarn web:build          # next build
yarn concurrently:start # web + worker in production mode
yarn docker:build       # docker compose up --build (postgres + meilisearch + app)
```

Note: `yarn web:build` writes into `apps/web/.next`, which will disturb a `yarn web:start` already serving from it.

**Prisma**

`yarn prisma:generate`, `yarn prisma:dev`, `yarn prisma:deploy`, `yarn prisma:studio`. Never hand-edit files in `packages/prisma/migrations/`.

**Test**

```bash
yarn test               # vitest (watch), unit tests colocated as *.test.ts
yarn coverage           # vitest run --coverage
yarn workspace @linkwarden/web e2e   # Playwright E2E in apps/web/e2e
```

**Mobile and extension** (from their workspaces)

```bash
yarn workspace @linkwarden/mobile ios | android | start
yarn workspace @linkwarden/extension dev:chrome | dev:firefox | build
```

**Other**: `yarn format` (Prettier across workspaces), `yarn workspace @linkwarden/worker typecheck`.

## Configuration

A single root `.env` feeds every workspace. `.env.sample` is the documented list and should be updated whenever a new variable is introduced. Groups worth knowing: core (`DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`), storage (`STORAGE_FOLDER` or the `SPACES_*` S3 vars), preservation limits and browser behaviour (`*_MAX_BUFFER`, `BROWSER_*`, `MAX_WORKERS`, `DISABLE_BROWSER`), search (`MEILI_HOST`, `MEILI_MASTER_KEY`), AI provider keys, and SSRF controls (`ALLOW_PRIVATE_NETWORK_ACCESS`, `ALLOW_INSECURE_TLS`).

## Branching and CI

`dev` is the integration branch; `main` is release. PRs into `main` are only accepted from `dev` (enforced by `check-branch.yml`). CI in `.github/workflows/`: Playwright on push and PR, release containers published to `ghcr.io/linkwarden/linkwarden` on tag, an edge container and extension builds on manual dispatch, mobile build and submit via EAS on manual dispatch, and an i18n automation job for Crowdin PRs.

Translations are managed in Crowdin (`crowdin.yml`); edit `apps/web/public/locales/en/*` only, the other locales sync from Crowdin.

## Sibling repositories

These are separate GitHub repos, not workspaces here. Two of them are checked out next to this one as additional working directories.

| Site | Repo | Stack | Hosting |
| --- | --- | --- | --- |
| **Docs**, `docs.linkwarden.app` | `linkwarden/docs` (`../docs`) | Docusaurus 3. Markdown under `docs/` (getting-started, usage, self-hosting, billing, developers), plus API reference generated from `openapi/linkwarden.yaml` by `docusaurus-plugin-openapi-docs`. Algolia search. | GitHub Pages on push to `main` (`yarn docusaurus gen-api-docs all` then `yarn build`). |
| **Landing page and blog**, `linkwarden.app` | `linkwarden/website` (`../website`) | Next.js 13 Pages Router, static export (`output: "export"`). Landing, `/pricing`, `/compare/*`, legal pages, and the blog at `/blog` rendered from Markdown in `apps/website/content/blog/` (`articles/`, `releases/`, `authors.yml`) via `next-mdx-remote`. `scripts/generate-feeds.mjs` builds the RSS feed and sitemap before each build. | GitHub Pages on push to `main`, plus a nightly cron rebuild. |

Practical consequence: changing an API route or adding an env var is usually a two-repo job. Update the code here, then update `openapi/linkwarden.yaml` or the relevant page in `../docs`. Release notes go to `../website/apps/website/content/blog/releases/`.

The browser extension lives in this monorepo (`apps/extension`); the older standalone `linkwarden/browser-extension` repo that the README links to is the predecessor.

## Conventions

- TypeScript throughout, Prettier formatted, 2-space indent.
- Validate request bodies with the Zod schemas in `packages/lib/schemaValidation.ts` rather than ad-hoc checks.
- Any outbound fetch of a user-supplied URL goes through `safeFetch` / the SSRF helpers. This is a security boundary; do not bypass it.
- Server-side data access belongs in a controller under `apps/web/lib/api/controllers/`, client-side data access in a `packages/router` hook. Logic needed by both web and mobile belongs in `packages/lib` or `packages/router`, not in `apps/web`.
- UI is Tailwind plus DaisyUI with some Radix primitives on web, NativeWind on mobile. Prefer existing components in `apps/web/components/` over new one-off ones.
- Styling and copy: plain, direct tone. When something is blocked by a site (paywalls, bot protection), describe it as that site's restriction.
