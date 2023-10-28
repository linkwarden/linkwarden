FROM node:18.18-bullseye-slim

ARG DEBIAN_FRONTEND=noninteractive
ARG DATABASE_PROVIDER

RUN mkdir /data

WORKDIR /data

COPY ./package.json ./yarn.lock ./playwright.config.ts ./

# Increase timeout to pass github actions arm64 build
RUN yarn install --network-timeout 10000000

RUN npx playwright install-deps && \
    apt-get clean && \
    yarn cache clean

COPY . .

RUN sed -i "s/DATABASE_PROVIDER/${DATABASE_PROVIDER}/g" ./prisma/schema.prisma

RUN yarn prisma generate && \
    yarn build

CMD yarn prisma migrate deploy && yarn start
