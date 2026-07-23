# homepage — Backend API image (production-optimized)
# Build:  docker compose build app

# ====== Stage 1: Build all three projects ======
FROM node:22-slim AS builder
WORKDIR /app

# Pin pnpm version to enable Docker layer cache.
# Only bump this when you intentionally want a newer pnpm.
RUN corepack enable && corepack prepare pnpm@11.5.2 --activate

# Low-memory tuning for small VMs (1-2GB RAM, no swap).
ENV PNPM_CONFIG_CHILD_CONCURRENCY=1 \
    PNPM_CONFIG_NETWORK_CONCURRENCY=2 \
    PNPM_CONFIG_REPORTER=append-only \
    NODE_OPTIONS=--max-old-space-size=384

# Install dependencies (root workspace + all apps)
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY apps/backend/package.json apps/frontend/package.json apps/admin/package.json ./apps/
RUN pnpm install --frozen-lockfile

# Copy source code and build all three apps
COPY apps/ apps/

RUN pnpm --filter homepage-backend build && \
    pnpm --filter homepage-frontend build && \
    pnpm --filter homepage-admin build && \
    pnpm --filter homepage-backend deploy /deploy --prod --legacy && \
    mkdir -p /deploy/public/uploads/avatar && \
    mkdir -p /static/frontend /static/admin && \
    cp -r apps/frontend/dist/. /static/frontend/ && \
    cp -r apps/admin/dist/. /static/admin/ && \
    pnpm store prune

# ====== Stage 2: Runtime (distroless, production-only) ======
FROM gcr.io/distroless/nodejs22-debian12 AS runtime
WORKDIR /app

COPY --from=builder --chown=65532:65532 /deploy /app
COPY --from=builder --chown=65532:65532 /static /static

ENV NODE_ENV=production
USER 65532

EXPOSE 8000

# Health check in exec form (no shell) for distroless compatibility.
# distroless 镜像的 node 只在 /nodejs/bin/node，PATH 里没有 node，
# 所以必须用绝对路径，否则 docker exec-based healthcheck 会报
# "executable file not found in $PATH" 从而永远 unhealthy。
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD ["/nodejs/bin/node", "-e", "require('http').get('http://localhost:8000/health',r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>process.exit(r.statusCode===200?0:1))})"]

CMD ["dist/main.js"]
