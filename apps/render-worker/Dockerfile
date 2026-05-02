# syntax=docker/dockerfile:1.7
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
RUN apk add --no-cache ffmpeg
WORKDIR /repo

FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages/db/package.json ./packages/db/
COPY packages/storage/package.json ./packages/storage/
COPY packages/mock-data/package.json ./packages/mock-data/
COPY apps/render-worker/package.json ./apps/render-worker/
RUN pnpm install --frozen-lockfile=false

FROM base AS runtime
COPY --from=deps /repo /repo
COPY packages ./packages
COPY apps/render-worker ./apps/render-worker
WORKDIR /repo/apps/render-worker
ENV NODE_ENV=production
CMD ["pnpm", "exec", "tsx", "src/main.ts"]
