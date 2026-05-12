# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /repo

FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages/ui/package.json ./packages/ui/
COPY packages/db/package.json ./packages/db/
COPY packages/mock-data/package.json ./packages/mock-data/
COPY packages/usage/package.json ./packages/usage/
COPY apps/competitor-spy/package.json ./apps/competitor-spy/
RUN pnpm install --frozen-lockfile=false

FROM base AS builder
COPY --from=deps /repo /repo
COPY packages ./packages
COPY apps/competitor-spy ./apps/competitor-spy
WORKDIR /repo/apps/competitor-spy
RUN pnpm exec next build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /repo/apps/competitor-spy/.next/standalone ./
COPY --from=builder /repo/apps/competitor-spy/.next/static ./apps/competitor-spy/.next/static
COPY --from=builder /repo/apps/competitor-spy/public ./apps/competitor-spy/public

ENV HOSTNAME=0.0.0.0
ENV PORT=3019
EXPOSE 3019

CMD ["node", "apps/competitor-spy/server.js"]
