# syntax=docker/dockerfile:1.7
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /repo

FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages/ui/package.json ./packages/ui/
COPY packages/mock-data/package.json ./packages/mock-data/
COPY packages/db/package.json ./packages/db/
COPY packages/outreach/package.json ./packages/outreach/
COPY apps/outreach-dispatcher/package.json ./apps/outreach-dispatcher/
RUN pnpm install --frozen-lockfile=false

FROM base AS builder
COPY --from=deps /repo /repo
COPY packages ./packages
COPY apps/outreach-dispatcher ./apps/outreach-dispatcher
WORKDIR /repo/apps/outreach-dispatcher
RUN pnpm exec next build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /repo/apps/outreach-dispatcher/.next/standalone ./
COPY --from=builder /repo/apps/outreach-dispatcher/.next/static ./apps/outreach-dispatcher/.next/static
COPY --from=builder /repo/apps/outreach-dispatcher/public ./apps/outreach-dispatcher/public
ENV HOSTNAME=0.0.0.0
ENV PORT=3011
EXPOSE 3011
CMD ["node", "apps/outreach-dispatcher/server.js"]
