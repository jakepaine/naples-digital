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
COPY apps/tone-calibrator/package.json ./apps/tone-calibrator/
RUN pnpm install --frozen-lockfile=false

FROM base AS builder
COPY --from=deps /repo /repo
COPY packages ./packages
COPY apps/tone-calibrator ./apps/tone-calibrator
WORKDIR /repo/apps/tone-calibrator
RUN pnpm exec next build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /repo/apps/tone-calibrator/.next/standalone ./
COPY --from=builder /repo/apps/tone-calibrator/.next/static ./apps/tone-calibrator/.next/static
COPY --from=builder /repo/apps/tone-calibrator/public ./apps/tone-calibrator/public

ENV HOSTNAME=0.0.0.0
ENV PORT=3025
EXPOSE 3025

CMD ["node", "apps/tone-calibrator/server.js"]
