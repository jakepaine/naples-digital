# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /repo

FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages/ui/package.json ./packages/ui/
COPY packages/mock-data/package.json ./packages/mock-data/
COPY packages/db/package.json ./packages/db/
COPY apps/admin-console/package.json ./apps/admin-console/
RUN pnpm install --frozen-lockfile=false

FROM base AS builder
COPY --from=deps /repo /repo
COPY packages ./packages
COPY apps/admin-console ./apps/admin-console
WORKDIR /repo/apps/admin-console
RUN pnpm exec next build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /repo/apps/admin-console/.next/standalone ./
COPY --from=builder /repo/apps/admin-console/.next/static ./apps/admin-console/.next/static
COPY --from=builder /repo/apps/admin-console/public ./apps/admin-console/public

ENV HOSTNAME=0.0.0.0
ENV PORT=3010
EXPOSE 3010

CMD ["node", "apps/admin-console/server.js"]
