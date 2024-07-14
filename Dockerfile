# Made by Akito <the@akito.ooo>
FROM node:18.18.2-alpine3.18 AS build

WORKDIR /data

COPY --chown=node ./package.json ./yarn.lock ./playwright.config.ts ./
COPY --chown=node docker/local.conf /etc/fonts/local.conf

RUN \
  --mount=type=cache,sharing=locked,target=/usr/local/share/.cache/yarn \
  yarn install --network-timeout 10000000

RUN \
  apk update && \
  apk add --no-cache \
    musl-dev \
    pkgconfig \
    curl \
    gcc \
    chromium \
    chromium-swiftshader \
    font-noto-emoji \
    nss \
    freetype \
    ttf-freefont \
    libressl-dev && \
  curl –proto ‘=https’ –tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y && \
  source $HOME/.cargo/env && \
  rustup target add x86_64-unknown-linux-musl && \
  export PATH="/root/.cargo/bin:${PATH}" && \
  cargo install monolith && \
  yarn playwright install

COPY . .

RUN \
  yarn prisma generate && \
  yarn build

FROM node:18.18.2-alpine3.18

WORKDIR /data

COPY --chown=node --from=build /data .
COPY --chown=node docker/local.conf /etc/fonts/local.conf

RUN \
  apk update && \
  apk add --no-cache \
    chromium \
    chromium-swiftshader \
    font-noto-emoji \
    nss \
    freetype \
    ttf-freefont && \
  rm -fr /var/cache/* && \
  fc-cache -f && \
  chown -R node:node /data

USER node

ENTRYPOINT [ "/bin/sh", "-c" ]
CMD [ "yarn prisma migrate deploy && yarn start" ]