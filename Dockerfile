FROM node:18.18-bullseye-slim

ARG DEBIAN_FRONTEND=noninteractive

RUN mkdir /data

WORKDIR /data

COPY ./package.json ./yarn.lock ./playwright.config.ts ./

# Increase timeout to pass github actions arm64 build
RUN --mount=type=cache,sharing=locked,target=/usr/local/share/.cache/yarn yarn install --network-timeout 10000000

RUN npx playwright install-deps && \
    apt-get clean && \
    yarn cache clean

COPY . .

RUN yarn prisma generate && \
    yarn build

CMD yarn prisma migrate deploy && yarn start
