FROM node:18.18-bookworm-slim

ARG DEBIAN_FRONTEND=noninteractive

ENV PATH="/root/.cargo/bin:${PATH}"
WORKDIR /data
COPY entrypoint.sh /
COPY . .

RUN --mount=type=cache,sharing=locked,target=/usr/local/share/.cache/yarn yarn install --network-timeout 10000000 \
    && chmod +x /entrypoint.sh \
    && apt-get update \
    && apt-get install -y \
    build-essential \
    curl \
    libssl-dev \
    pkg-config \
    && curl https://sh.rustup.rs -sSf | bash -s -- -y \
    && cargo install monolith \
    && npx playwright install-deps \
    && yarn playwright install \
    && yarn prisma generate \
    && yarn build \
    && apt remove --purge -y build-essential pkg-config \
    && apt-get clean \
    && apt-get autoremove --purge -y \ 
    && rm -rf \
       /tmp/* \
       /var/cache/* \
       /root/.cache \
       /root/.rustup \
       /usr/local/share/.cache/yarn/* \
       /var/lib/apt/lists/* 
ENTRYPOINT ["/entrypoint.sh"]
