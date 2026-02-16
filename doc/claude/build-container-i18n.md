# Docker Build Failure: `<Html> should not be imported outside of pages/_document`

## The Problem

`yarn web:build` (i.e. `next build`) succeeds locally (including in the devcontainer) but
fails inside Docker during `Generating static pages`:

```
Error: <Html> should not be imported outside of pages/_document.
Error occurred prerendering page "/404"
Error occurred prerendering page "/500"
```

With i18n configured, locale-prefixed variants also fail (`/it/404`, `/pt-BR/404`, etc.).

## Environment Comparison

| | Devcontainer (works) | Docker (fails) |
|---|---|---|
| Node | 20.19.2 | 20.19.6 (bullseye-slim) |
| Install | `yarn install` (full) | `yarn workspaces focus` (focused) |
| OS | Fedora (host kernel) | Debian Bullseye slim |
| react-dom location | `/workspaces/linkwarden/node_modules/react-dom/` | `/data/node_modules/react-dom/` |
| next location | `node_modules/next/` (hoisted) | `/data/apps/web/node_modules/next/` |

**Key observation from Docker error trace:**
```
at Q (/data/apps/web/node_modules/next/dist/compiled/next-server/pages.runtime.prod.js)
at I (/data/apps/web/.next/server/chunks/331.js)
at Wc (/data/node_modules/react-dom/cjs/react-dom-server.browser.production.min.js)
```

`next` resolves under `apps/web/node_modules/` while `react-dom` resolves under
the root `node_modules/`. In the devcontainer, both resolve under the same root.

## Root Cause Analysis

### What the error means

Next.js's `Html` component (from `next/document`) calls `useHtmlContext()` which reads a
React context (`HtmlContext`). This context is only provided during the **document rendering
phase** of SSR. If `Html` is rendered without the context provider, the error is thrown.

### Where it happens

During `next build`, static pages (404, 500) are prerendered. With i18n configured
(13 locales), the 404 page is prerendered for each locale. The prerendering pipeline:

1. Loads the page module (which bundles `_app`, `_document`, and the page)
2. Renders the page through `_app` (page phase)
3. Renders the document wrapper with `Html`, `Head`, etc. (document phase)

Step 3 must provide `HtmlContext` before `Html` is rendered. If it doesn't, the error fires.

### Why it works locally but not in Docker

**Most likely cause: different module resolution due to `yarn workspaces focus`.**

The `HtmlContext` is created via `React.createContext()` in a shared runtime module
(`html-context.shared-runtime.js`). For React contexts to work, the **exact same context
object** must be used by both the provider and the consumer:

- **Provider**: `pages.runtime.prod.js` (inside `next/dist/compiled/`) sets up
  `HtmlContext.Provider`
- **Consumer**: Compiled chunk 331 (Docker) / 6859 (local) contains the `Html` component
  that calls `useContext(HtmlContext)`

Both files `require("react")` externally. If they resolve to **different React instances**
(due to different `node_modules` paths), `createContext()` produces different context objects,
and the consumer sees `undefined`.

In the Docker error trace, `next` is at `/data/apps/web/node_modules/next/` while `react-dom`
is at `/data/node_modules/react-dom/`. This split suggests `yarn workspaces focus` may hoist
packages differently than a full `yarn install`, potentially creating duplicate React
installations or different resolution paths.

**Alternative cause: chunk splitting differences.**

Even with the same React, webpack's chunk splitting may differ between environments (different
Node.js patch version, different memory constraints, different CPU count). If
`html-context.shared-runtime.js` gets bundled into both `pages.runtime.prod.js` AND a server
chunk (rather than being shared), two separate `HtmlContext` objects are created.

### What we tried (and didn't work)

1. **Custom 404/500 pages with `skipAuth`** - Avoided `SessionProvider` during prerendering,
   but still triggered the `Html` error
2. **Removing custom 404/500 pages** - Default error pages still prerender and fail
3. **`ENV NODE_ENV=production` in Dockerfile** - Added before build step, didn't fix it
4. **`AuthRedirect` defensive coding** - Using `next/compat/router` with null guard, good
   practice but doesn't address the `Html` context issue

### What we confirmed

- Only `pages/_document.tsx` imports from `next/document` (no leaking imports)
- `next-i18next`'s `appWithTranslation` does NOT import from `next/document`
- The compiled chunk (6859 locally / 331 in Docker) bundles the full `next/document` module
  (`Html`, `Head`, `Main`, `NextScript`) as a shared server chunk
- `pages.runtime.prod.js` requires `react` and `react-dom/server.browser` externally
  (not bundled)
- The chunks also require `react` externally
- i18n amplifies the issue because it prerenders 404 for every configured locale

## Diagnostic Results

### Diagnostic 1: React Instance Check (in Docker)

```
react (root): /data/node_modules/react/index.js
react (next): /data/node_modules/react/index.js
react (web) : /data/node_modules/react/index.js
react-dom   : /data/node_modules/react-dom/index.js
next        : /data/node_modules/next/dist/server/next.js
same react (root === next): true
same react (root === web) : true
same react (next === web) : true
```

**Result: Duplicate React ruled out.** All resolve to the same instance at the root.
All packages (`react`, `react-dom`, `next`) are hoisted to `/data/node_modules/`.

### Diagnostic 2: Post-Build Chunk Inspection (in Docker)

```
--- Server chunks ---
2298.js 2752.js 331.js 3816.js 4175.js 4713.js 520.js 5329.js
5632.js 5670.js 6135.js 6968.js 7249.js 7578.js 9006.js 92.js
9202.js 9205.js 9257.js 9876.js   (20 chunks)

--- Chunk 331 external requires ---
require("@builder.io/partytown/integration")

--- html-context in chunks ---
apps/web/.next/server/chunks/331.js        (contains useHtmlContext/HtmlContext)

--- html-context as external in chunks ---
not externalized                            (bundled inline, NOT a runtime require)

--- createContext count in document chunk ---
apps/web/.next/server/chunks/2752.js: 1 createContext calls
apps/web/.next/server/chunks/9257.js: 6 createContext calls
```

**Key findings:**

1. `html-context.shared-runtime` is **bundled inline** into chunk 331 by webpack, NOT
   externalized as a `require()` call. This means the chunk has its OWN `HtmlContext` object.
2. `pages.runtime.prod.js` (pre-compiled Next.js runtime) also bundles its own copy of
   `html-context.shared-runtime`. It creates a SEPARATE `HtmlContext` object.
3. Chunk 331 has NO `createContext` calls itself. The `HtmlContext` is created in chunk 2752
   and shared to 331 via webpack's module system.
4. **Critically**: chunk IDs differ completely between local and Docker:
   - Local: 1163, 1201, 1386, 2477, 3061, 3573, 3664, 3937, 4125, 4175, ... (20 chunks)
   - Docker: 2298, 2752, 331, 3816, 4175, 4713, 520, 5329, ... (20 chunks)

   Webpack generates entirely different chunk splits. This means module groupings and
   potentially externalization decisions differ between environments.

**Conclusion:** The `html-context.shared-runtime` module should be **externalized** by
Next.js's webpack config (it's named `*.shared-runtime` for this exact reason). But in both
environments, it's bundled inline. This creates two `HtmlContext` objects:

- One in `pages.runtime.prod.js` (used by the Provider during document rendering)
- One in the webpack chunks (used by `Html`/`Head` components via `useContext`)

The Provider and Consumer use different context objects. The Consumer sees `undefined` and
throws. **This should theoretically fail in both environments**, but somehow locally the
prerendering code path avoids triggering the Document render. This could be due to:

- Different static generation worker behavior (Node 20.19.2 vs 20.19.6)
- Different webpack optimization (different module graph due to `yarn workspaces focus`)
- Platform-specific differences in the rendering pipeline

## Relevant Next.js Issues

- [vercel/next.js#56481](https://github.com/vercel/next.js/issues/56481) - `<Html>` error,
  linked to `NODE_ENV` issues (didn't fix our case)
- [vercel/next.js#57970](https://github.com/vercel/next.js/issues/57970) - Same error on
  Vercel deployments
- [vercel/next.js#65780](https://github.com/vercel/next.js/issues/65780) - Build fails after
  no code changes

## Options to Move Forward

### Option A: Replace `yarn workspaces focus` with `yarn install` in Dockerfile

**Effort: minimal | Risk: low | Confidence: medium-high**

The most likely cause is `yarn workspaces focus` producing a different dependency tree.
Replace it with a full `yarn install --immutable` to match the devcontainer environment.
Trade-off: slightly larger Docker image (installs all workspace dependencies, not just
the focused ones).

```dockerfile
# Instead of:
RUN yarn workspaces focus linkwarden @linkwarden/web @linkwarden/worker
# Try:
RUN yarn install --immutable
```

### Option B: Add diagnostic step to Dockerfile

**Effort: minimal | Risk: none | Confidence: confirms root cause**

Add a step before the build to dump the React/module resolution:

```dockerfile
RUN node -e "\
  console.log('react:', require.resolve('react')); \
  console.log('react-dom:', require.resolve('react-dom')); \
  console.log('next react:', require.resolve('react', \
    {paths: [require.resolve('next/package.json').replace('/package.json','')]})); \
  const r1 = require('react'); \
  const r2 = require(require.resolve('react', \
    {paths: [require.resolve('next/package.json').replace('/package.json','')]})); \
  console.log('same react instance:', r1 === r2);"
```

If `same react instance: false`, we've confirmed duplicate React. If `true`, the issue is
in chunk splitting.

### Option C: Use `output: 'standalone'` in `next.config.js`

**Effort: medium | Risk: medium | Confidence: medium**

The standalone output mode is the recommended approach for Docker. It changes how Next.js
bundles the app and may produce different (working) chunk splitting. Requires updating the
Dockerfile to use the standalone output.

### Option D: Pin identical Node.js version in both environments

**Effort: minimal | Risk: low | Confidence: low**

The devcontainer uses Node 20.19.2, Docker uses 20.19.6. While unlikely to matter, matching
versions eliminates one variable. Change `FROM node:20.19.6-bullseye-slim` to match exactly.

### Option E: Remove i18n from Next.js config (nuclear option)

**Effort: high | Risk: high | Confidence: high it fixes the build**

Move i18n to client-side only (using `i18next` without Next.js integration). This removes
the per-locale 404 prerendering entirely. Major refactor of how translations work.

### Option F: Force externalization of `html-context.shared-runtime` via webpack config

**Effort: small | Risk: low | Confidence: high (addresses root cause directly)**

Add a webpack externals rule in `next.config.js` to force `html-context.shared-runtime`
to be resolved at runtime rather than bundled inline. This ensures `pages.runtime.prod.js`
and the chunks share the exact same `HtmlContext` object.

```js
webpack(config, { isServer }) {
  if (isServer) {
    const orig = config.externals;
    config.externals = [
      (ctx, callback) => {
        if (/html-context\.shared-runtime/.test(ctx.request)) {
          return callback(null, `commonjs ${ctx.request}`);
        }
        // delegate to original externals
        if (typeof orig === 'function') return orig(ctx, callback);
        if (Array.isArray(orig)) { /* iterate */ }
        callback();
      },
    ];
  }
  return config;
}
```

## Recommended Approach

Diagnostics confirmed: React is NOT duplicated, but `html-context.shared-runtime` is
**bundled inline** instead of being externalized. This creates duplicate `HtmlContext` objects
between the Next.js runtime and the webpack chunks.

**Priority order:**
1. **Option F** (force externalize) - directly addresses the root cause
2. **Option A** (full `yarn install`) - may indirectly fix it by changing webpack's decisions
3. **Option C** (`output: 'standalone'`) - changes the entire build pipeline
