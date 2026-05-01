# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /repo

# Copy workspace manifests for install caching
FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages/ui/package.json ./packages/ui/
COPY packages/mock-data/package.json ./packages/mock-data/
COPY apps/outreach-demo/package.json ./apps/outreach-demo/
RUN pnpm install --frozen-lockfile=false

# Build stage
FROM base AS builder
COPY --from=deps /repo /repo
COPY packages ./packages
COPY apps/outreach-demo ./apps/outreach-demo
WORKDIR /repo/apps/outreach-demo
RUN pnpm exec next build

# Runtime stage — minimal Alpine + standalone output
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /repo/apps/outreach-demo/.next/standalone ./
COPY --from=builder /repo/apps/outreach-demo/.next/static ./apps/outreach-demo/.next/static
COPY --from=builder /repo/apps/outreach-demo/public ./apps/outreach-demo/public

ENV HOSTNAME=0.0.0.0
ENV PORT=3004
EXPOSE 3004

CMD ["node", "apps/outreach-demo/server.js"]
