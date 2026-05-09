# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /repo

FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages/ui/package.json ./packages/ui/
COPY packages/mock-data/package.json ./packages/mock-data/
COPY packages/db/package.json ./packages/db/
COPY apps/onboarding-coach/package.json ./apps/onboarding-coach/
RUN pnpm install --frozen-lockfile=false

FROM base AS builder
COPY --from=deps /repo /repo
COPY packages ./packages
COPY apps/onboarding-coach ./apps/onboarding-coach
WORKDIR /repo/apps/onboarding-coach
RUN pnpm exec next build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /repo/apps/onboarding-coach/.next/standalone ./
COPY --from=builder /repo/apps/onboarding-coach/.next/static ./apps/onboarding-coach/.next/static
COPY --from=builder /repo/apps/onboarding-coach/public ./apps/onboarding-coach/public

ENV HOSTNAME=0.0.0.0
ENV PORT=3023
EXPOSE 3023

CMD ["node", "apps/onboarding-coach/server.js"]
