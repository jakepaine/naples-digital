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
COPY apps/agency-site/package.json ./apps/agency-site/
RUN pnpm install --frozen-lockfile=false

# Build stage
FROM base AS builder
COPY --from=deps /repo /repo
COPY packages ./packages
COPY apps/agency-site ./apps/agency-site
WORKDIR /repo/apps/agency-site
RUN pnpm exec next build

# Runtime stage — minimal Alpine + standalone output
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /repo/apps/agency-site/.next/standalone ./
COPY --from=builder /repo/apps/agency-site/.next/static ./apps/agency-site/.next/static
COPY --from=builder /repo/apps/agency-site/public ./apps/agency-site/public

ENV HOSTNAME=0.0.0.0
ENV PORT=3003
EXPOSE 3003

CMD ["node", "apps/agency-site/server.js"]
