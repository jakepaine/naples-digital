# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /repo

FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages/ui/package.json ./packages/ui/
COPY packages/mock-data/package.json ./packages/mock-data/
COPY packages/db/package.json ./packages/db/
COPY apps/lead-won-invoice/package.json ./apps/lead-won-invoice/
RUN pnpm install --frozen-lockfile=false

FROM base AS builder
COPY --from=deps /repo /repo
COPY packages ./packages
COPY apps/lead-won-invoice ./apps/lead-won-invoice
WORKDIR /repo/apps/lead-won-invoice
RUN pnpm exec next build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /repo/apps/lead-won-invoice/.next/standalone ./
COPY --from=builder /repo/apps/lead-won-invoice/.next/static ./apps/lead-won-invoice/.next/static
COPY --from=builder /repo/apps/lead-won-invoice/public ./apps/lead-won-invoice/public

ENV HOSTNAME=0.0.0.0
ENV PORT=3017
EXPOSE 3017

CMD ["node", "apps/lead-won-invoice/server.js"]
