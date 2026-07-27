# homepage — Backend API image (production-optimized)
# Build:  docker compose build app
# Override base images with build-args for Chinese mirror:
#   --build-arg BUILDER_IMAGE=docker.1ms.run/library/node:22-slim
#   --build-arg RUNTIME_IMAGE=docker.1ms.run/library/node:22-slim

ARG BUILDER_IMAGE=node:22-slim
ARG RUNTIME_IMAGE=gcr.io/distroless/nodejs22-debian12

# ====== Stage 1: Build all three projects ======
FROM ${BUILDER_IMAGE} AS builder
WORKDIR /app

# Pin pnpm version to enable Docker layer cache.
# Only bump this when you intentionally want a newer pnpm.
RUN corepack enable && corepack prepare pnpm@11.5.2 --activate

# Low-memory tuning for small VMs (1-2GB RAM, no swap).
ENV PNPM_CONFIG_CHILD_CONCURRENCY=1 \
    PNPM_CONFIG_NETWORK_CONCURRENCY=2 \
    PNPM_CONFIG_REPORTER=append-only \
    NODE_OPTIONS=--max-old-space-size=2048

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

# ====== Stage 2: Runtime (distroless or slim, production-only) ======
FROM ${RUNTIME_IMAGE} AS runtime
WORKDIR /app

COPY --from=builder /deploy /app
COPY --from=builder /static /static

ENV NODE_ENV=production

EXPOSE 8000

# Health check: uses /nodejs/bin/node for distroless, /usr/local/bin/node for slim.
# The correct path is determined at build time and baked into the image.
# For slim images, deploy.sh --cn passes HEALTHCHECK_NODE_PATH=/usr/local/bin/node.
ARG HEALTHCHECK_NODE_PATH=/nodejs/bin/node
ENV _HEALTHCHECK_NODE_PATH=${HEALTHCHECK_NODE_PATH}
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD ["${HEALTHCHECK_NODE_PATH}", "-e", "require('http').get('http://localhost:8000/health',r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>process.exit(r.statusCode===200?0:1))})"]

CMD ["dist/main.js"]
