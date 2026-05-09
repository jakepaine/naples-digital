# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /repo

FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages/ui/package.json ./packages/ui/
COPY packages/db/package.json ./packages/db/
COPY apps/sla-dashboard/package.json ./apps/sla-dashboard/
RUN pnpm install --frozen-lockfile=false

FROM base AS builder
COPY --from=deps /repo /repo
COPY packages ./packages
COPY apps/sla-dashboard ./apps/sla-dashboard
WORKDIR /repo/apps/sla-dashboard
RUN pnpm exec next build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /repo/apps/sla-dashboard/.next/standalone ./
COPY --from=builder /repo/apps/sla-dashboard/.next/static ./apps/sla-dashboard/.next/static
COPY --from=builder /repo/apps/sla-dashboard/public ./apps/sla-dashboard/public

ENV HOSTNAME=0.0.0.0
ENV PORT=3022
EXPOSE 3022

CMD ["node", "apps/sla-dashboard/server.js"]
