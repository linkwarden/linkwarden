# Stage: monolith-builder
# Purpose: Uses the Rust image to build monolith
# Notes:
#  - Fine to leave extra here, as only the resulting binary is copied out
FROM docker.io/rust:1.86-bullseye AS monolith-builder

RUN set -eux && cargo install --locked monolith

# Stage: main-app
# Purpose: Compiles the frontend and
# Notes:
#  - Nothing extra should be left here.  All commands should cleanup
FROM node:20.19.6-bullseye-slim AS main-app

ENV YARN_HTTP_TIMEOUT=10000000

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0

ENV PRISMA_HIDE_UPDATE_MESSAGE=1

ARG DEBIAN_FRONTEND=noninteractive

RUN mkdir /data

WORKDIR /data

RUN corepack enable

COPY ./.yarnrc.yml ./

COPY ./apps/web/package.json ./apps/web/playwright.config.ts ./apps/web/

COPY ./apps/worker/package.json ./apps/worker/

COPY ./packages ./packages

COPY ./yarn.lock ./package.json ./

RUN --mount=type=cache,sharing=locked,target=/usr/local/share/.cache/yarn \
    set -eux && \
    yarn workspaces focus linkwarden @linkwarden/web @linkwarden/worker && \
    # Install curl for healthcheck, and ca-certificates to prevent monolith from failing to retrieve resources due to invalid certificates
    apt-get update && \
    apt-get install -yqq --no-install-recommends curl ca-certificates && \
    apt-get autoremove && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy the compiled monolith binary from the builder stage
COPY --from=monolith-builder /usr/local/cargo/bin/monolith /usr/local/bin/monolith

RUN set -eux && \
    apt-get clean && \
    yarn cache clean

COPY . .

ENV NODE_ENV=production

# Diagnostic: check for duplicate React instances (remove after debugging)
RUN node -e " \
  const reactFromRoot = require('react'); \
  const reactDomFromRoot = require('react-dom'); \
  const nextDir = require.resolve('next/package.json').replace('/package.json', ''); \
  const reactFromNext = require(require.resolve('react', { paths: [nextDir] })); \
  const chunkDir = process.cwd() + '/apps/web'; \
  const reactFromWeb = require(require.resolve('react', { paths: [chunkDir] })); \
  console.log('=== React Instance Diagnostic ==='); \
  console.log('react (root):', require.resolve('react')); \
  console.log('react (next):', require.resolve('react', { paths: [nextDir] })); \
  console.log('react (web) :', require.resolve('react', { paths: [chunkDir] })); \
  console.log('react-dom   :', require.resolve('react-dom')); \
  console.log('next        :', require.resolve('next')); \
  console.log('same react (root === next):', reactFromRoot === reactFromNext); \
  console.log('same react (root === web) :', reactFromRoot === reactFromWeb); \
  console.log('same react (next === web) :', reactFromNext === reactFromWeb); \
  console.log('================================='); \
"

RUN yarn prisma:generate && \
    yarn web:build; \
    BUILD_EXIT=$?; \
    echo "=== Post-Build Chunk Diagnostic ==="; \
    echo "Build exit code: $BUILD_EXIT"; \
    echo "--- Server chunks ---"; \
    ls apps/web/.next/server/chunks/ 2>/dev/null; \
    echo "--- Chunk 331 external requires ---"; \
    grep -oP 'require\("[^"]+"\)' apps/web/.next/server/chunks/331.js 2>/dev/null | sort -u || echo "chunk 331 not found"; \
    echo "--- html-context in chunks ---"; \
    grep -l 'useHtmlContext\|html.context\|HtmlContext' apps/web/.next/server/chunks/*.js 2>/dev/null || echo "not found in any chunk"; \
    echo "--- html-context as external in chunks ---"; \
    grep -o 'require("[^"]*html-context[^"]*")' apps/web/.next/server/chunks/*.js 2>/dev/null || echo "not externalized"; \
    echo "--- createContext count in document chunk ---"; \
    for f in apps/web/.next/server/chunks/*.js; do \
      count=$(grep -o 'createContext' "$f" 2>/dev/null | wc -l); \
      [ "$count" -gt 0 ] && echo "$f: $count createContext calls"; \
    done; \
    echo "==================================="; \
    if [ "$BUILD_EXIT" -ne 0 ]; then exit 1; fi; \
    rm -rf apps/web/.next/cache

HEALTHCHECK --interval=30s \
            --timeout=5s \
            --start-period=10s \
            --retries=3 \
            CMD [ "/usr/bin/curl", "--silent", "--fail", "http://127.0.0.1:3000/" ]

EXPOSE 3000

CMD ["sh", "-c", "yarn prisma:deploy && yarn concurrently:start"]
