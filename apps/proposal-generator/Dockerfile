# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /repo

FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages/ui/package.json ./packages/ui/
COPY packages/db/package.json ./packages/db/
COPY apps/proposal-generator/package.json ./apps/proposal-generator/
RUN pnpm install --frozen-lockfile=false

FROM base AS builder
COPY --from=deps /repo /repo
COPY packages ./packages
COPY apps/proposal-generator ./apps/proposal-generator
WORKDIR /repo/apps/proposal-generator
RUN pnpm exec next build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /repo/apps/proposal-generator/.next/standalone ./
COPY --from=builder /repo/apps/proposal-generator/.next/static ./apps/proposal-generator/.next/static
COPY --from=builder /repo/apps/proposal-generator/public ./apps/proposal-generator/public

ENV HOSTNAME=0.0.0.0
ENV PORT=3018
EXPOSE 3018

CMD ["node", "apps/proposal-generator/server.js"]
