# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /repo

# Copy workspace manifests for install caching
FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages/ui/package.json ./packages/ui/
COPY packages/mock-data/package.json ./packages/mock-data/
COPY packages/db/package.json ./packages/db/
COPY apps/content-pipeline/package.json ./apps/content-pipeline/
RUN pnpm install --frozen-lockfile=false

# Build stage
FROM base AS builder
COPY --from=deps /repo /repo
COPY packages ./packages
COPY apps/content-pipeline ./apps/content-pipeline
WORKDIR /repo/apps/content-pipeline
RUN pnpm exec next build

# Runtime stage — minimal Alpine + standalone output
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /repo/apps/content-pipeline/.next/standalone ./
COPY --from=builder /repo/apps/content-pipeline/.next/static ./apps/content-pipeline/.next/static
COPY --from=builder /repo/apps/content-pipeline/public ./apps/content-pipeline/public

ENV HOSTNAME=0.0.0.0
ENV PORT=3006
EXPOSE 3006

CMD ["node", "apps/content-pipeline/server.js"]
