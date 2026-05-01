# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /repo

FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages/ui/package.json ./packages/ui/
COPY packages/mock-data/package.json ./packages/mock-data/
COPY packages/db/package.json ./packages/db/
COPY apps/client-portal/package.json ./apps/client-portal/
RUN pnpm install --frozen-lockfile=false

FROM base AS builder
COPY --from=deps /repo /repo
COPY packages ./packages
COPY apps/client-portal ./apps/client-portal
WORKDIR /repo/apps/client-portal
RUN pnpm exec next build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /repo/apps/client-portal/.next/standalone ./
COPY --from=builder /repo/apps/client-portal/.next/static ./apps/client-portal/.next/static
COPY --from=builder /repo/apps/client-portal/public ./apps/client-portal/public

ENV HOSTNAME=0.0.0.0
ENV PORT=3009
EXPOSE 3009

CMD ["node", "apps/client-portal/server.js"]
