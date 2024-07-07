# Made by Akito <the@akito.ooo>
FROM node:18.18.2-alpine3.18 AS build

WORKDIR /data

COPY ./package.json ./yarn.lock ./playwright.config.ts ./

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

ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

WORKDIR /data

COPY --from=build /data .

RUN \
  apk update && \
  apk add --no-cache \
    chromium \
    nss \
    freetype \
    ttf-freefont && \
  chown -R node:node /data

USER node

ENTRYPOINT [ "/bin/sh", "-c" ]
CMD [ "yarn prisma migrate deploy && yarn start" ]