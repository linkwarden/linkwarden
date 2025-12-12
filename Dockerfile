# Stage: monolith-builder
# Purpose: Uses the Rust image to build monolith.
# Notes:
#  - Fine to leave extra here, as only the resulting binary is copied out.
FROM docker.io/rust:1.86-bullseye AS monolith-builder

RUN set -eux && cargo install --locked monolith

# Stage: app-builder
# Purpose: Compiles the frontend and backend.
# Notes:
#  - These layers will be discarded, so permission issues don't matter.
FROM node:22.14-bullseye-slim AS app-builder

ARG DEBIAN_FRONTEND=noninteractive

ENV HOME=/data/home

RUN mkdir -p /data/home

WORKDIR /data

COPY ./apps/web/package.json ./apps/web/playwright.config.ts ./apps/web/

COPY ./apps/worker/package.json ./apps/worker/

COPY ./packages ./packages

COPY ./yarn.lock ./package.json ./

RUN --mount=type=cache,sharing=locked,target=/usr/local/share/.cache/yarn \
    set -eux && \
    yarn install --network-timeout 10000000

COPY . .

RUN yarn prisma:generate && \
    yarn web:build && \
    yarn cache clean

# Stage: final
# Purpose: Copy built artifacts with world-writable permissions for
#    arbitrary UID support.
# Notes:
#  - Single COPY --chmod avoids layer duplication.
#  - 777 permissions allow any PUID/PGID to write.
FROM node:22.14-bullseye-slim AS final

ARG DEBIAN_FRONTEND=noninteractive

ENV HOME=/data/home

# Install runtime dependencies (before creating /data to avoid
# permission issues).
RUN set -eux && \
    # Install curl for healthcheck, and ca-certificates to prevent monolith from failing to retrieve resources due to invalid certificates.
    apt-get update && \
    apt-get install -yqq --no-install-recommends curl ca-certificates && \
    apt-get autoremove && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy monolith binary from the monolith-builder stage.
COPY --from=monolith-builder /usr/local/cargo/bin/monolith /usr/local/bin/monolith

# Copy all built artifacts with world-writable permissions in a single layer.
# COPY will create /data directory - we need to ensure it's writable for
# non-root users.
COPY --chmod=777 --from=app-builder /data /data

WORKDIR /data

# Make /data directory itself world-writable (only affects one directory,
# not files from COPY layer).
RUN chmod 777 /data

# Install Chromium system dependencies (browsers are already in /data from
# COPY above).
RUN yarn playwright install-deps chromium

HEALTHCHECK --interval=30s \
            --timeout=5s \
            --start-period=10s \
            --retries=3 \
            CMD [ "/usr/bin/curl", "--silent", "--fail", "http://127.0.0.1:3000/" ]

EXPOSE 3000

CMD ["sh", "-c", "yarn prisma:deploy && yarn concurrently:start"]
