# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /repo

FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages/ui/package.json ./packages/ui/
COPY packages/mock-data/package.json ./packages/mock-data/
COPY packages/db/package.json ./packages/db/
COPY apps/sponsor-analytics/package.json ./apps/sponsor-analytics/
RUN pnpm install --frozen-lockfile=false

FROM base AS builder
COPY --from=deps /repo /repo
COPY packages ./packages
COPY apps/sponsor-analytics ./apps/sponsor-analytics
WORKDIR /repo/apps/sponsor-analytics
RUN pnpm exec next build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /repo/apps/sponsor-analytics/.next/standalone ./
COPY --from=builder /repo/apps/sponsor-analytics/.next/static ./apps/sponsor-analytics/.next/static
COPY --from=builder /repo/apps/sponsor-analytics/public ./apps/sponsor-analytics/public

ENV HOSTNAME=0.0.0.0
ENV PORT=3008
EXPOSE 3008

CMD ["node", "apps/sponsor-analytics/server.js"]
