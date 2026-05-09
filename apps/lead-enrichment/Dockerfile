# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /repo

FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages/ui/package.json ./packages/ui/
COPY packages/mock-data/package.json ./packages/mock-data/
COPY packages/db/package.json ./packages/db/
COPY apps/lead-enrichment/package.json ./apps/lead-enrichment/
RUN pnpm install --frozen-lockfile=false

FROM base AS builder
COPY --from=deps /repo /repo
COPY packages ./packages
COPY apps/lead-enrichment ./apps/lead-enrichment
WORKDIR /repo/apps/lead-enrichment
RUN pnpm exec next build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /repo/apps/lead-enrichment/.next/standalone ./
COPY --from=builder /repo/apps/lead-enrichment/.next/static ./apps/lead-enrichment/.next/static
COPY --from=builder /repo/apps/lead-enrichment/public ./apps/lead-enrichment/public

ENV HOSTNAME=0.0.0.0
ENV PORT=3020
EXPOSE 3020

CMD ["node", "apps/lead-enrichment/server.js"]
