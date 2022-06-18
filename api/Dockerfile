# Production image for api
# See https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md#running-on-alpine

FROM node:18-alpine
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /home/node
VOLUME /home/node/node_modules

RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

COPY . .
RUN npm ci && mkdir -p /media

# The collowing command fails when attempting to chown the node_modules directory.
# Running it in its own layer allows it to modify the volume.
RUN chown -R node:node /home/node /media

USER node

EXPOSE 5000
CMD node server.js
