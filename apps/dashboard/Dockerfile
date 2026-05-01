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
COPY apps/dashboard/package.json ./apps/dashboard/
RUN pnpm install --frozen-lockfile=false

# Build stage
FROM base AS builder
COPY --from=deps /repo /repo
COPY packages ./packages
COPY apps/dashboard ./apps/dashboard
WORKDIR /repo/apps/dashboard
RUN pnpm exec next build

# Runtime stage — minimal Alpine + standalone output
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /repo/apps/dashboard/.next/standalone ./
COPY --from=builder /repo/apps/dashboard/.next/static ./apps/dashboard/.next/static
COPY --from=builder /repo/apps/dashboard/public ./apps/dashboard/public

ENV HOSTNAME=0.0.0.0
ENV PORT=3002
EXPOSE 3002

CMD ["node", "apps/dashboard/server.js"]
