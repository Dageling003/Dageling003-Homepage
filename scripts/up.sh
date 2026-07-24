#!/usr/bin/env bash
# ===================================================
# homepage — 一键启动
# ===================================================
# 直接构建并启动全部服务。app 与 caddy 现在是各自独立构建，
# 可安全并行；不再需要先 build app 才能 build caddy。
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

step "构建并启动全部服务"
$COMPOSE up -d --build

echo
ok "已启动，用下面命令查看状态："
echo "    $COMPOSE ps"
echo "    $COMPOSE logs -f app"
