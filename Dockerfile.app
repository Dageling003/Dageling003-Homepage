# homepage — All-in-one image: backend API + frontend/admin static files
# No application code changes needed — only build & packaging

# ====== Stage 1: Build all three projects ======
FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate

# Install dependencies (root workspace + all apps)
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/backend/package.json apps/backend/
COPY apps/frontend/package.json apps/frontend/
COPY apps/admin/package.json apps/admin/
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/backend apps/backend
COPY apps/frontend apps/frontend
COPY apps/admin apps/admin

# Build all
RUN pnpm --filter homepage-backend build
RUN pnpm --filter homepage-frontend build
RUN pnpm --filter homepage-admin build

# ====== Stage 2: Runtime ======
FROM node:20-alpine
WORKDIR /app

# Install lightweight static file server
RUN npm install -g serve

# Backend runtime
COPY --from=builder /app/apps/backend/dist ./backend/dist
COPY --from=builder /app/apps/backend/package.json ./backend/
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/backend/.env.example .env

# Frontend & admin static assets
COPY --from=builder /app/apps/frontend/dist ./frontend
COPY --from=builder /app/apps/admin/dist ./admin

# Startup script: runs backend + static servers concurrently
RUN echo '#!/bin/sh\n\
echo "Starting backend API on :8000..."\n\
cd /app/backend && node dist/main.js &\n\
echo "Starting frontend on :3000..."\n\
serve /app/frontend -p 3000 -s --no-clipboard --no-request-logging &\n\
echo "Starting admin on :3001..."\n\
serve /app/admin -p 3001 -s --no-clipboard --no-request-logging &\n\
echo "Ready — API:8000  Frontend:3000  Admin:3001"\n\
wait\n' > /app/start.sh && chmod +x /app/start.sh

EXPOSE 8000 3000 3001

CMD ["/app/start.sh"]
