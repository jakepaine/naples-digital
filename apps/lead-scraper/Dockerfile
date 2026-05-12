# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /repo

FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages/ui/package.json ./packages/ui/
COPY packages/mock-data/package.json ./packages/mock-data/
COPY packages/db/package.json ./packages/db/
COPY packages/usage/package.json ./packages/usage/
COPY apps/lead-scraper/package.json ./apps/lead-scraper/
RUN pnpm install --frozen-lockfile=false

FROM base AS builder
COPY --from=deps /repo /repo
COPY packages ./packages
COPY apps/lead-scraper ./apps/lead-scraper
WORKDIR /repo/apps/lead-scraper
RUN pnpm exec next build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /repo/apps/lead-scraper/.next/standalone ./
COPY --from=builder /repo/apps/lead-scraper/.next/static ./apps/lead-scraper/.next/static
COPY --from=builder /repo/apps/lead-scraper/public ./apps/lead-scraper/public

ENV HOSTNAME=0.0.0.0
ENV PORT=3021
EXPOSE 3021

CMD ["node", "apps/lead-scraper/server.js"]
