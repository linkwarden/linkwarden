FROM node:latest as builder

WORKDIR /app

COPY . /app/

RUN yarn install

# Ubuntu is needed for playwright.
FROM ubuntu:22.04 as app

ENV NODE_ENV production
ARG DEBIAN_FRONTEND noninteractive

# Installs nodejs and yarn latest version through node/yarn repositories.
# Creates 'node' unprivileged user with uid/gid 1000 (the same as in "node" official docker image).
RUN apt-get -yqq update && apt-get install -yqq --no-install-recommends curl gnupg ca-certificates lsb-release dialog apt-utils \
    && curl -s https://deb.nodesource.com/gpgkey/nodesource.gpg.key | gpg --dearmor | tee /usr/share/keyrings/nodesource.gpg >/dev/null \
    && echo 'deb [signed-by=/usr/share/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x jammy main' > /etc/apt/sources.list.d/nodesource.list \
    && echo 'deb-src [signed-by=/usr/share/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x jammy main' >> /etc/apt/sources.list.d/nodesource.list \
    && curl -sL https://dl.yarnpkg.com/debian/pubkey.gpg | gpg --dearmor | tee /usr/share/keyrings/yarnkey.gpg >/dev/null \
    && echo "deb [signed-by=/usr/share/keyrings/yarnkey.gpg] https://dl.yarnpkg.com/debian stable main" | tee /etc/apt/sources.list.d/yarn.list \
    && apt-get -yqq update && apt-get install -yqq --no-install-recommends nodejs yarn \
    && groupadd --gid 1000 node \
    && useradd --uid 1000 --gid 1000 -m node

COPY --chown=node:node --from=builder /app/node_modules /app/node_modules
COPY --chown=node:node . /app

WORKDIR /app

# This installs playwright dependencies on Ubuntu APT repositories.
RUN npx playwright install-deps \
    && rm -rf /var/lib/apt/lists/* \
    && npx next telemetry disable \
    && yarn build

# Start the app as a non-privileged user.
USER node

# The entrypoint plays prisma migrations before starting whatever command the user wants (defaults to `yarn start`).
ENTRYPOINT ["/app/docker-entrypoint.sh"]

CMD ["yarn", "start"]
