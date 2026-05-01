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
COPY apps/sponsor-pitch/package.json ./apps/sponsor-pitch/
RUN pnpm install --frozen-lockfile=false

# Build stage
FROM base AS builder
COPY --from=deps /repo /repo
COPY packages ./packages
COPY apps/sponsor-pitch ./apps/sponsor-pitch
WORKDIR /repo/apps/sponsor-pitch
RUN pnpm exec next build

# Runtime stage — minimal Alpine + standalone output
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /repo/apps/sponsor-pitch/.next/standalone ./
COPY --from=builder /repo/apps/sponsor-pitch/.next/static ./apps/sponsor-pitch/.next/static
COPY --from=builder /repo/apps/sponsor-pitch/public ./apps/sponsor-pitch/public

ENV HOSTNAME=0.0.0.0
ENV PORT=3007
EXPOSE 3007

CMD ["node", "apps/sponsor-pitch/server.js"]
