# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /repo

FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages/ui/package.json ./packages/ui/
COPY packages/mock-data/package.json ./packages/mock-data/
COPY packages/db/package.json ./packages/db/
COPY apps/mia/package.json ./apps/mia/
RUN pnpm install --frozen-lockfile=false

FROM base AS builder
COPY --from=deps /repo /repo
COPY packages ./packages
COPY apps/mia ./apps/mia
WORKDIR /repo/apps/mia
RUN pnpm exec next build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /repo/apps/mia/.next/standalone ./
COPY --from=builder /repo/apps/mia/.next/static ./apps/mia/.next/static
COPY --from=builder /repo/apps/mia/public ./apps/mia/public

ENV HOSTNAME=0.0.0.0
ENV PORT=3013
EXPOSE 3013

CMD ["node", "apps/mia/server.js"]
