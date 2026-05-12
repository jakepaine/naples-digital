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
COPY apps/ig-reels-research/package.json ./apps/ig-reels-research/
RUN pnpm install --frozen-lockfile=false

FROM base AS builder
COPY --from=deps /repo /repo
COPY packages ./packages
COPY apps/ig-reels-research ./apps/ig-reels-research
WORKDIR /repo/apps/ig-reels-research
RUN pnpm exec next build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /repo/apps/ig-reels-research/.next/standalone ./
COPY --from=builder /repo/apps/ig-reels-research/.next/static ./apps/ig-reels-research/.next/static
COPY --from=builder /repo/apps/ig-reels-research/public ./apps/ig-reels-research/public

ENV HOSTNAME=0.0.0.0
ENV PORT=3026
EXPOSE 3026

CMD ["node", "apps/ig-reels-research/server.js"]
