# homepage — Unified multi-stage Dockerfile
#
# 一个 Dockerfile 产出两个镜像：
#   • target=runtime  → homepage-app:latest    （NestJS backend + static bundles）
#   • target=caddy    → homepage-caddy:latest  （Caddy 反代 + 静态站点）
#
# 这样两次 build **共享同一份 BuildKit 缓存**（deps + builder 两层），2C2G
# 主机上重建时间从 ~5min 降到 ~40s；GitHub Actions 也不用再让 caddy build
# 去 registry 拉不存在的 homepage-app:latest。
#
# 用法：
#   docker compose --env-file .env.docker build app caddy   # 两个 target 各拉一次
#   或：
#   docker build -f docker/Dockerfile.app --target runtime  -t homepage-app:latest   .
#   docker build -f docker/Dockerfile.app --target caddy    -t homepage-caddy:latest .
#
# Mirror override（国内镜像）：
#   --build-arg BUILDER_IMAGE=docker.1ms.run/library/node:22-slim
#   --build-arg RUNTIME_IMAGE=docker.1ms.run/library/node:22-slim

ARG BUILDER_IMAGE=node:22-slim
ARG RUNTIME_IMAGE=gcr.io/distroless/nodejs22-debian12

# ====== Stage 1: Install dependencies (cacheable layer) ======
FROM ${BUILDER_IMAGE} AS deps
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11.5.2 --activate

# 2C2G 主机上关键：把 pnpm 并发压到 1，装依赖阶段常见的 tarball 解压 +
# postinstall 一起跑很容易 OOM / 卡死 SSH。max-old-space-size=1024 也做同样
# 的兜底，避免 node 单进程把内存吃满。
ENV PNPM_CONFIG_CHILD_CONCURRENCY=1 \
    PNPM_CONFIG_NETWORK_CONCURRENCY=2 \
    PNPM_CONFIG_REPORTER=append-only \
    NODE_OPTIONS=--max-old-space-size=1024

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY apps/backend/package.json apps/frontend/package.json apps/admin/package.json ./apps/
RUN pnpm install --frozen-lockfile

# ====== Stage 2: Build all three projects + prepare prod deps ======
FROM deps AS builder
WORKDIR /app

COPY apps/ apps/

# 顺序 build：backend → frontend → admin。三个并发在 2C2G 上会 OOM。
RUN pnpm --filter homepage-backend build && \
    pnpm --filter homepage-frontend build && \
    pnpm --filter homepage-admin build

# Produce a self-contained production bundle for the backend using `pnpm deploy`.
# This correctly resolves workspace root overrides and copies runtime deps
# (including @nestjs/core) into /prod/node_modules alongside the built dist/.
RUN pnpm --filter homepage-backend --prod --legacy deploy /prod

# Create empty dirs for runtime (distroless has no shell, so we copy them)
RUN mkdir -p /app/public/uploads/avatar /app/data

# ====== Stage 3a: Runtime — Backend API image ======
# Target: runtime → homepage-app:latest
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

# ====== Stage 3b: Runtime — Caddy reverse proxy image ======
# Target: caddy → homepage-caddy:latest
# 直接从 builder 层拷已构建好的 static 产物，不再 install/build 一次。
FROM caddy:2-alpine AS caddy
COPY --from=builder /app/apps/frontend/dist /var/www/frontend
COPY --from=builder /app/apps/admin/dist    /var/www/admin
COPY caddy/Caddyfile /etc/caddy/Caddyfile
COPY caddy/entrypoint.sh /usr/local/bin/caddy-entrypoint.sh
RUN chmod +x /usr/local/bin/caddy-entrypoint.sh
ENTRYPOINT ["/usr/local/bin/caddy-entrypoint.sh"]
