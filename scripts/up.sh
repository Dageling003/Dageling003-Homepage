#!/usr/bin/env bash
# ===================================================
# homepage — 一键启动（顺序构建 + 启动）
# ===================================================
# 为什么需要这个脚本？
#   docker-compose.yml 里 caddy 依赖 app 的镜像（Dockerfile.caddy 有
#   FROM homepage-app:latest），但 `docker compose up --build` 会并行构建，
#   caddy 有时会先跑，因为本地找不到 homepage-app:latest 就去 docker.io 拉，
#   触发 registry mirror 的 429 Too Many Requests / 404 Not Found。
#
#   本脚本按正确顺序执行：先 build app，再 up 全部。
# ===================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

ENV_FILE="${ENV_FILE:-.env.docker}"

RED='\033[0;31m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'
ok()   { echo -e "  ${GREEN}✔${NC} $1"; }
step() { echo; echo -e "${BOLD}${CYAN}==>${NC} ${BOLD}$1${NC}"; }
err()  { echo -e "  ${RED}✘${NC} $1" >&2; }

if [[ ! -f "$ENV_FILE" ]]; then
  err "找不到 $ENV_FILE，请先跑 bash scripts/setup.sh 或 bash scripts/deploy.sh 生成"
  exit 1
fi

COMPOSE="docker compose --env-file $ENV_FILE"

step "1/2  构建 app 镜像"
$COMPOSE build app
ok "homepage-app:latest 就绪"

step "2/2  构建 caddy 并启动全部服务"
$COMPOSE up -d --build

echo
ok "已启动，用下面命令查看状态："
echo "    $COMPOSE ps"
echo "    $COMPOSE logs -f app"
