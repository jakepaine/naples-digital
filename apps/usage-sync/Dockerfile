# syntax=docker/dockerfile:1.7
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /repo

FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages/db/package.json ./packages/db/
COPY packages/mock-data/package.json ./packages/mock-data/
COPY packages/usage/package.json ./packages/usage/
COPY apps/usage-sync/package.json ./apps/usage-sync/
RUN pnpm install --frozen-lockfile=false

FROM base AS runtime
COPY --from=deps /repo /repo
COPY packages ./packages
COPY apps/usage-sync ./apps/usage-sync
WORKDIR /repo/apps/usage-sync
ENV NODE_ENV=production
CMD ["pnpm", "exec", "tsx", "src/main.ts"]
