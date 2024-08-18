# Build Stage
FROM node:18.18-bullseye-slim AS builder

ARG DEBIAN_FRONTEND=noninteractive

RUN apt-get update
RUN apt-get install -y curl

RUN curl -L -o /tmp/monolith https://github.com/Y2Z/monolith/releases/download/v2.8.1/monolith-gnu-linux-x86_64 && \
chmod +x /tmp/monolith && \
mv /tmp/monolith /usr/local/bin/monolith

RUN apt-get remove --purge -y curl
RUN apt-get autoremove --purge -y
RUN apt-get clean

RUN npx playwright install-deps

WORKDIR /build
COPY . .

RUN --mount=type=cache,sharing=locked,target=/usr/local/share/.cache/yarn yarn install --network-timeout 10000000
RUN yarn playwright install
RUN yarn cache clean

RUN yarn prisma generate
ENV NODE_ENV=production
RUN yarn build

WORKDIR /data

RUN cp -a /build/.next .
RUN cp -a /build/package.json .
RUN cp -a /build/public .
RUN cp -a /build/node_modules .
RUN cp -a /build/prisma .
RUN cp -a /build/scripts .
RUN cp -a /build/lib .
RUN cp -a /build/next.config.js .
RUN cp -a /build/next-i18next.config.js .

RUN rm -rf /build


# Final Stage
FROM node:18.18-bullseye-slim

WORKDIR /data

COPY --from=builder /data /data
COPY --from=builder /root/.cache/ms-playwright /root/.cache/ms-playwright
COPY --from=builder /root/.cache/prisma-nodejs /root/.cache/prisma-nodejs
COPY --from=builder /usr/local/bin/monolith /usr/local/bin/monolith

RUN apt-get update
RUN npx playwright install-deps

RUN apt-get autoremove --purge -y
RUN apt-get clean

CMD yarn prisma migrate deploy && yarn start