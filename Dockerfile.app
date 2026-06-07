# homepage — Backend API image (production-optimized)
# Caddy serves static files directly; this image is backend-only.
# Build:  docker compose build app

# ====== Stage 1: Build all three projects ======
FROM node:22-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

# Install dependencies (root workspace + all apps)
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/backend/package.json apps/backend/
COPY apps/frontend/package.json apps/frontend/
COPY apps/admin/package.json apps/admin/
RUN pnpm install --frozen-lockfile

# Copy source code and build all three apps
COPY apps/ apps/
RUN pnpm --filter homepage-backend build
RUN pnpm --filter homepage-frontend build
RUN pnpm --filter homepage-admin build

# Deploy backend to /deploy with production dependencies ONLY
# This strips devDependencies (typescript, jest, eslint, ts-jest, etc.) — huge size savings
RUN pnpm --filter homepage-backend deploy /deploy --prod

# ====== Stage 2: Runtime (slim, production-only) ======
FROM node:22-alpine AS runtime
WORKDIR /app

# Copy the pruned production deployment (dist + prod node_modules + package.json)
COPY --from=builder /deploy /app

# Copy frontend/admin dist to /static for the Caddy build stage
COPY --from=builder /app/apps/frontend/dist /static/frontend
COPY --from=builder /app/apps/admin/dist /static/admin

# Uploads directory (mounted as volume at runtime)
RUN mkdir -p /app/public/uploads/avatar

ENV NODE_ENV=production

EXPOSE 8000

# Health check: confirms the API is responding
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8000/api/config/initialized',r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>process.exit(r.statusCode===200?0:1))})"

CMD ["node", "dist/main.js"]
