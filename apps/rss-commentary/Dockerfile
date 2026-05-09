# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /repo

FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages/ui/package.json ./packages/ui/
COPY packages/mock-data/package.json ./packages/mock-data/
COPY packages/outreach/package.json ./packages/outreach/
COPY packages/db/package.json ./packages/db/
COPY apps/rss-commentary/package.json ./apps/rss-commentary/
RUN pnpm install --frozen-lockfile=false

FROM base AS builder
COPY --from=deps /repo /repo
COPY packages ./packages
COPY apps/rss-commentary ./apps/rss-commentary
WORKDIR /repo/apps/rss-commentary
RUN pnpm exec next build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /repo/apps/rss-commentary/.next/standalone ./
COPY --from=builder /repo/apps/rss-commentary/.next/static ./apps/rss-commentary/.next/static
COPY --from=builder /repo/apps/rss-commentary/public ./apps/rss-commentary/public

ENV HOSTNAME=0.0.0.0
ENV PORT=3027
EXPOSE 3027

CMD ["node", "apps/rss-commentary/server.js"]
