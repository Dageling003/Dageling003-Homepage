# homepage — Backend API image (production-optimized)
# Build:  docker compose build app
# Override base images with build-args for Chinese mirror:
#   --build-arg BUILDER_IMAGE=docker.1ms.run/library/node:22-slim
#   --build-arg RUNTIME_IMAGE=docker.1ms.run/library/node:22-slim

ARG BUILDER_IMAGE=node:22-slim
ARG RUNTIME_IMAGE=gcr.io/distroless/nodejs22-debian12

# ====== Stage 1: Install dependencies (cacheable layer) ======
FROM ${BUILDER_IMAGE} AS deps
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11.5.2 --activate

ENV PNPM_CONFIG_CHILD_CONCURRENCY=1 \
    PNPM_CONFIG_NETWORK_CONCURRENCY=2 \
    PNPM_CONFIG_REPORTER=append-only \
    NODE_OPTIONS=--max-old-space-size=2048

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY apps/backend/package.json apps/frontend/package.json apps/admin/package.json ./apps/
RUN pnpm install --frozen-lockfile

# ====== Stage 2: Build all three projects + prepare prod deps ======
FROM deps AS builder
WORKDIR /app

COPY apps/ apps/

RUN pnpm --filter homepage-backend build && \
    pnpm --filter homepage-frontend build && \
    pnpm --filter homepage-admin build

# Produce a self-contained production bundle for the backend using `pnpm deploy`.
# This correctly resolves workspace root overrides and copies runtime deps
# (including @nestjs/core) into /prod/node_modules alongside the built dist/.
RUN pnpm --filter homepage-backend --prod --legacy deploy /prod

# Create empty dirs for runtime (distroless has no shell, so we copy them)
RUN mkdir -p /app/public/uploads/avatar /app/data

# ====== Stage 3: Runtime (distroless or slim, production-only) ======
FROM ${RUNTIME_IMAGE} AS runtime
WORKDIR /app

COPY --from=builder /prod/node_modules ./node_modules
COPY --from=builder /prod/dist ./dist
COPY --from=builder /app/apps/frontend/dist /static/frontend
COPY --from=builder /app/apps/admin/dist /static/admin
COPY --from=builder /app/public /app/public
COPY --from=builder /app/data /app/data

ENV NODE_ENV=production \
    NODE_OPTIONS=--max-old-space-size=256

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
  CMD ["/nodejs/bin/node", "-e", "const h=require('http');const req=h.get('http://localhost:8000/health',r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>process.exit(r.statusCode===200?0:1))});req.on('error',()=>process.exit(1));req.setTimeout(3000,()=>{req.destroy();process.exit(1)})"]

CMD ["/app/dist/main.js"]
