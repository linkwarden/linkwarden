# ==============================================================================
# Stage 1: Monolith Builder
# ==============================================================================
FROM docker.io/rust:1.96-bullseye AS monolith-builder
RUN set -eux && cargo install --locked monolith

# ==============================================================================
# Stage 2: App Builder (Where the heavy building happens)
# ==============================================================================
FROM node:22.23-bullseye-slim AS app-builder

ENV YARN_HTTP_TIMEOUT=10000000
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
ENV PRISMA_HIDE_UPDATE_MESSAGE=1
# The web postinstall runs `playwright install`; skip it here since the browser
# is installed in the final stage. Avoids downloading a browser we then discard.
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
WORKDIR /data

RUN corepack enable

# Copy only structure first for optimized caching
COPY package.json yarn.lock .yarnrc.yml ./
COPY apps/web/package.json ./apps/web/
COPY apps/worker/package.json ./apps/worker/
COPY packages/filesystem/package.json ./packages/filesystem/
COPY packages/lib/package.json ./packages/lib/
COPY packages/prisma/package.json ./packages/prisma/
COPY packages/router/package.json ./packages/router/
COPY packages/types/package.json ./packages/types/

# Install everything needed to build
RUN --mount=type=cache,sharing=locked,target=/root/.yarn/berry/cache \
    yarn workspaces focus linkwarden @linkwarden/web @linkwarden/worker

# Copy source and build
COPY . .
RUN yarn prisma:generate && \
    yarn web:build

# Clean up dev dependencies right here before copying to the final stage
RUN yarn workspaces focus --production linkwarden @linkwarden/web @linkwarden/worker && \
    rm -rf apps/web/.next/cache && \
    yarn cache clean

# ==============================================================================
# Stage 3: Final Runtime (This stage will be ~400MB total)
# ==============================================================================
FROM node:22.23-bullseye-slim AS main-app
ENV NODE_ENV=production
ENV PRISMA_HIDE_UPDATE_MESSAGE=1
# Stable, copyable browser location shared by install and runtime
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
ARG DEBIAN_FRONTEND=noninteractive
WORKDIR /data

# Copy the Rust monolith binary
COPY --from=monolith-builder /usr/local/cargo/bin/monolith /usr/local/bin/monolith

# Install minimal runtime system utilities
# procps provides `ps`, which concurrently -k needs to manage child processes
RUN set -eux && \
    apt-get update && \
    apt-get install -yqq --no-install-recommends curl ca-certificates openssl procps && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy ONLY the clean production assets from Stage 2
COPY --from=app-builder /data/node_modules ./node_modules
COPY --from=app-builder /data/package.json /data/yarn.lock /data/.yarnrc.yml ./
COPY --from=app-builder /data/apps/web ./apps/web
COPY --from=app-builder /data/apps/worker ./apps/worker
COPY --from=app-builder /data/packages ./packages
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable && corepack install

# Install only the Chromium headless shell (Playwright's smallest browser) plus
# the shared libraries it needs at runtime. Full Chromium is not required.
RUN set -eux && \
    export PATH=/data/node_modules/.bin:$PATH && \
    apt-get update && \
    playwright install --with-deps chromium-headless-shell && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Next.js writes its image-optimizer cache here at runtime; precreate it as
# world-writable so it also works when the container runs as a non-root user
RUN mkdir -p apps/web/.next/cache && chmod 777 apps/web/.next/cache

HEALTHCHECK --interval=30s \
            --timeout=5s \
            --start-period=10s \
            --retries=3 \
            CMD [ "/usr/bin/curl", "--silent", "--fail", "http://127.0.0.1:3000/" ]

EXPOSE 3000

CMD ["sh", "-c", "export PATH=/data/node_modules/.bin:$PATH && prisma migrate deploy --schema=/data/packages/prisma/schema.prisma && exec concurrently -k -n web,worker \"cd /data/apps/web && exec next start\" \"cd /data/apps/worker && exec tsx worker.ts\""]