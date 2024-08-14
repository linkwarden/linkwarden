FROM node:18.18-bookworm-slim

ARG DEBIAN_FRONTEND=noninteractive

ENV PATH="/home/linkwarden/.cargo/bin:${PATH}"
WORKDIR /data
COPY --chown=1161 . .

RUN --mount=type=cache,sharing=locked,target=/usr/local/share/.cache/yarn yarn install --network-timeout 10000000 \
    && chmod +x /data/entrypoint.sh \
    && useradd -m -u 1161 linkwarden \  
    && apt-get update \
    && apt-get install -y build-essential curl libssl-dev pkg-config \
    && su -c "curl https://sh.rustup.rs -sSf | bash -s -- -y" linkwarden \
    && su -c "cargo install monolith" linkwarden \
    && npx playwright install --with-deps chromium \
    && chown -Rf linkwarden /data \
    && su -c "yarn playwright install" linkwarden \
    && su -c "yarn prisma generate" linkwarden \
    && su -c "yarn build" linkwarden \
    && apt remove --purge -y manpages-dev libllvm15 build-essential pkg-config \
    && apt autoremove --purge -y \ 
    && apt clean \
    && rm -rf \
       /tmp/* \
       /var/cache/* \
       /root/.cache \
       /root/.npm \
       /home/linkwarden/.rustup \
       /home/linkwarden/.cargo \
       /usr/local/share/.cache/yarn/* \
       /var/lib/apt/lists/* 

USER linkwarden
ENTRYPOINT ["/data/entrypoint.sh"]
