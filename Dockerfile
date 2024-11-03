FROM node:18.18-bullseye-slim

ARG DEBIAN_FRONTEND=noninteractive

RUN mkdir /data

WORKDIR /data

COPY ./package.json ./yarn.lock ./playwright.config.ts ./

RUN --mount=type=cache,sharing=locked,target=/usr/local/share/.cache/yarn yarn install --network-timeout 10000000

RUN apt-get update

RUN apt-get install -y \
    build-essential \
    curl \
    libssl-dev \
    pkg-config

RUN apt-get update

RUN curl https://sh.rustup.rs -sSf | bash -s -- -y

ENV PATH="/root/.cargo/bin:${PATH}"

RUN cargo install monolith

RUN npx playwright install-deps && \
    apt-get clean && \
    yarn cache clean

RUN yarn playwright install

COPY . .

RUN yarn prisma generate && \
    yarn build

CMD yarn prisma migrate deploy && yarn start