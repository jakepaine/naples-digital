# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /repo

FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages/ui/package.json ./packages/ui/
COPY packages/mock-data/package.json ./packages/mock-data/
COPY packages/outreach/package.json ./packages/outreach/
COPY packages/db/package.json ./packages/db/
COPY apps/warmup-monitor/package.json ./apps/warmup-monitor/
RUN pnpm install --frozen-lockfile=false

FROM base AS builder
COPY --from=deps /repo /repo
COPY packages ./packages
COPY apps/warmup-monitor ./apps/warmup-monitor
WORKDIR /repo/apps/warmup-monitor
RUN pnpm exec next build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /repo/apps/warmup-monitor/.next/standalone ./
COPY --from=builder /repo/apps/warmup-monitor/.next/static ./apps/warmup-monitor/.next/static
COPY --from=builder /repo/apps/warmup-monitor/public ./apps/warmup-monitor/public

ENV HOSTNAME=0.0.0.0
ENV PORT=3024
EXPOSE 3024

CMD ["node", "apps/warmup-monitor/server.js"]
