# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /repo

FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages/ui/package.json ./packages/ui/
COPY packages/mock-data/package.json ./packages/mock-data/
COPY packages/db/package.json ./packages/db/
COPY apps/backlog/package.json ./apps/backlog/
RUN pnpm install --frozen-lockfile=false

FROM base AS builder
COPY --from=deps /repo /repo
COPY packages ./packages
COPY apps/backlog ./apps/backlog
WORKDIR /repo/apps/backlog
RUN pnpm exec next build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /repo/apps/backlog/.next/standalone ./
COPY --from=builder /repo/apps/backlog/.next/static ./apps/backlog/.next/static
COPY --from=builder /repo/apps/backlog/public ./apps/backlog/public

# Suggest endpoint scans repo state for context. Copy the marker files into
# the standalone runtime so the scan returns useful results in prod (the
# pnpm-workspace.yaml lookup walks up from cwd at request time).
COPY --from=builder /repo/pnpm-workspace.yaml ./
COPY --from=builder /repo/.build-state.md ./.build-state.md
COPY --from=builder /repo/README.md ./README.md

ENV HOSTNAME=0.0.0.0
ENV PORT=3012
EXPOSE 3012

CMD ["node", "apps/backlog/server.js"]
