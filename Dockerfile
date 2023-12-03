FROM node:18-bullseye-slim AS base

FROM base AS deps
WORKDIR /app

COPY package.json yarn.lock* ./

RUN npx playwright install-deps

# Increase timeout to pass github actions arm64 build
RUN yarn --frozen-lockfile --network-timeout 10000000

RUN mkdir /prismabase
WORKDIR /prismabase

# Generate separate Prisma install; needed for prisma migrate deploy
COPY prisma/prisma-package.json ./package.json
COPY prisma/prisma-yarn.lock ./yarn.lock
RUN yarn --frozen-lockfile --network-timeout 10000000




FROM base AS builder

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN yarn prisma generate
RUN yarn build



FROM base AS runner

RUN mkdir -p /data/data
WORKDIR /data

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

RUN mkdir .next
RUN chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/stadockertic

# Add Prisma; needed for prisma migrate deploy
COPY --from=deps --chown=nextjs:nodejs /prismabase/node_modules ./node_modules
COPY package.json yarn.lock* ./
RUN yarn prisma generate

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD yarn prisma migrate deploy && node server.js
