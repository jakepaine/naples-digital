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
COPY apps/crm-pipeline/package.json ./apps/crm-pipeline/
RUN pnpm install --frozen-lockfile=false

# Build stage
FROM base AS builder
COPY --from=deps /repo /repo
COPY packages ./packages
COPY apps/crm-pipeline ./apps/crm-pipeline
WORKDIR /repo/apps/crm-pipeline
RUN pnpm exec next build

# Runtime stage — minimal Alpine + standalone output
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /repo/apps/crm-pipeline/.next/standalone ./
COPY --from=builder /repo/apps/crm-pipeline/.next/static ./apps/crm-pipeline/.next/static
COPY --from=builder /repo/apps/crm-pipeline/public ./apps/crm-pipeline/public

ENV HOSTNAME=0.0.0.0
ENV PORT=3005
EXPOSE 3005

CMD ["node", "apps/crm-pipeline/server.js"]
