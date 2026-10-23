# AGENTS.md

Linkwarden is an open-source, self-hosted bookmark manager that allows users to collect, organize, read, annotate, and preserve webpages. It also supports collaboration through shared collections.

This file provides an overview of the repository, its architecture, and important development conventions.

Keep this document up to date whenever the project structure, architecture, or development workflows change.

## Repository Structure

Linkwarden is a monorepo managed with **Yarn 4 workspaces**, organized into `apps/*` and `packages/*`. It does not use Turborepo.

### Applications

- **`apps/web`**: Next.js application using the Pages Router. Provides the web interface and REST API.
- **`apps/worker`**: Background worker responsible for webpage preservation, AI tagging, search indexing, RSS polling, and data migrations.
- **`apps/mobile`**: iOS and Android application built with Expo, React Native, expo-router, and NativeWind.
- **`apps/extension`**: Browser extension built with Vite and React, targeting Chrome, Firefox, and Safari.

### Shared Packages

- **`packages/prisma`**: Contains the Prisma schema, database migrations, generated client, and seed scripts. It is the source of truth for the database structure.
- **`packages/types`**: Shared TypeScript types used throughout the project, primarily defined in `global.ts`.
- **`packages/lib`**: Shared utilities, including Zod validation schemas, constants, SSRF protection, Meilisearch integration, email handling, RSS utilities, and formatting helpers.
- **`packages/filesystem`**: Provides a common interface for storing files locally or in S3-compatible object storage, depending on the configured environment variables.
- **`packages/router`**: Shared TanStack Query hooks, such as `useLinks`, `useCollections`, and `useTags`. Used by both web and mobile to manage API requests, caching, and client-side state.

## Infrastructure and External Services

Linkwarden uses the following services and tools:

- **PostgreSQL:** Primary database, accessed through Prisma.
- **Meilisearch:** Full-text search and indexing.
- **Playwright / Chromium:** Browser automation and webpage preservation.
- **Monolith:** Generates standalone HTML archives of webpages.
- **S3-compatible storage (optional):** Stores preserved files and uploaded content.
- **SMTP (optional):** Handles outgoing emails.
- **AI providers (optional):** Enable automatic AI-powered tagging.
- **Stripe and Apple/Google in-app purchases (optional):** Handle subscriptions and payments for Linkwarden Cloud.

## Branching and CI

Linkwarden uses two primary branches:

- **`dev`:** Integration branch for ongoing development.
- **`main`:** Release branch containing production-ready changes.

Pull requests targeting `main` must come from `dev`. This restriction is enforced by the GitHub Actions workflow in `check-branch.yml`.

When contributing, target `dev` unless the maintainers specify otherwise.
