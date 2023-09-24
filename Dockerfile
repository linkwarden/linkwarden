# playwright doesnt support debian image
FROM node:20-bullseye-slim

ARG DEBIAN_FRONTEND=noninteractive

RUN mkdir /data

WORKDIR /data

COPY ./package.json ./yarn.lock ./playwright.config.ts ./

RUN yarn && \
    npx playwright install-deps && \
    apt-get clean && \
    yarn cache clean

COPY . .

RUN yarn prisma generate && \
    yarn build

CMD yarn prisma migrate deploy && yarn start
