#!/bin/bash
# ===================================================
# scripts/update.sh — 老名字保留，转发到 redeploy.sh
# ===================================================
# 历史行为：git pull → build app → build caddy → up → smoke test。
# 现在（2C2G 友好版）：走 scripts/redeploy.sh，共享 Docker 层缓存 +
# nice/ionice 降优先级，SSH 不会卡。
#
# 想触发过去的“完整烟测”行为，可以设：
#   SMOKE_TEST=1 bash scripts/update.sh
# ===================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
bash "$SCRIPT_DIR/redeploy.sh" "$@"

if [ "${SMOKE_TEST:-0}" = "1" ] && [ -f "$SCRIPT_DIR/smoke-test.sh" ]; then
    SMOKE_TARGET="localhost"
    if [ -f .env.docker ]; then
        ENV_DOMAIN=$(grep -E '^DOMAIN=' .env.docker | tail -n1 | cut -d= -f2- | tr -d '"' | tr -d "'" | xargs || true)
        if [ -n "${ENV_DOMAIN:-}" ] && [ "$ENV_DOMAIN" != "your-domain-or-ip" ]; then
            SMOKE_TARGET="$ENV_DOMAIN"
        fi
    fi
    echo ""
    echo "==> 冒烟测试目标: $SMOKE_TARGET"
    bash "$SCRIPT_DIR/smoke-test.sh" "$SMOKE_TARGET"
fi
