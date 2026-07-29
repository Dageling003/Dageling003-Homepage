#!/usr/bin/env bash
# ===================================================
# homepage — 更新部署脚本（2C2G 友好版）
# ===================================================
# 用法：
#   bash scripts/redeploy.sh               # 拉代码 + 增量构建 + 重启
#   bash scripts/redeploy.sh --pull        # 同上
#   bash scripts/redeploy.sh --no-pull     # 跳过 git pull，本地已改好代码
#   bash scripts/redeploy.sh --clean       # 强制 --no-cache 重建（谨慎，2C2G 会卡）
#
# 与 scripts/update.sh 的差别：
#   1. 用 `nice + ionice` 降低 build 进程优先级，SSH 不被卡死
#   2. 顺序：先 build app 再 build caddy（caddy 依赖 app 镜像）
#   3. 默认走 Docker 层缓存（不加 --no-cache），仅有代码变更的层重建，
#      在 2C2G 上把重建时间从 ~5min 压到 ~40s，CPU 峰值从 100% 降到 ~30%
#   4. 明确的错误提示，避免用户误跑 `--no-cache` 打爆内存
# ===================================================
set -euo pipefail

# ====== 颜色 ======
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

ok()   { echo -e "  ${GREEN}✓${NC} $1"; }
warn() { echo -e "  ${YELLOW}⚠${NC} $1"; }
err()  { echo -e "  ${RED}✗${NC} $1" >&2; }
info() { echo -e "  ${BLUE}→${NC} $1"; }
step() { echo ""; echo -e "${BOLD}==> $1${NC}"; }

# ====== 参数 ======
DO_PULL=1
NO_CACHE=0
while [ $# -gt 0 ]; do
    case "$1" in
        --pull) DO_PULL=1 ;;
        --no-pull) DO_PULL=0 ;;
        --clean) NO_CACHE=1 ;;
        -h|--help)
            head -20 "$0" | sed -n '2,20p'
            exit 0
            ;;
        *) err "未知参数: $1"; exit 1 ;;
    esac
    shift
done

# ====== 环境检查 ======
if ! command -v docker &>/dev/null; then
    err "Docker 未安装"; exit 1
fi
if docker compose version &>/dev/null; then
    COMPOSE_CMD="docker compose"
elif command -v docker-compose &>/dev/null; then
    COMPOSE_CMD="docker-compose"
else
    err "docker compose 未找到"; exit 1
fi

ENV_FILE=".env.docker"
if [ ! -f "$ENV_FILE" ]; then
    err ".env.docker 不存在，请先跑 scripts/first-deploy.sh"
    exit 1
fi

# ====== 低优先级前缀 ======
# nice: CPU 调度让路（19 = 最低）；ionice: 磁盘 I/O 让路（class=3 idle）。
# 这样即使 build 阶段跑到 100% CPU 需求，SSH / caddy / app 仍能抢到时间片，
# 服务器不会“死机”一样卡住。macOS / 老 BSD 上没这两个命令时直接跳过。
LOWPRIO=""
if command -v nice &>/dev/null; then
    LOWPRIO="nice -n 19"
    if command -v ionice &>/dev/null; then
        LOWPRIO="$LOWPRIO ionice -c3"
    fi
fi

BUILD_FLAGS=""
if [ "$NO_CACHE" = "1" ]; then
    warn "--clean 模式：将 --no-cache 全量重建，2C2G 主机上约 5–8 分钟并可能触发内存告警"
    BUILD_FLAGS="--no-cache"
fi

# ====== 1. 拉代码 ======
if [ "$DO_PULL" = "1" ]; then
    step "1/5 拉取最新代码"
    git pull --ff-only origin main || { err "git pull 失败（可能有本地改动）"; exit 1; }
    ok "已同步到 $(git rev-parse --short HEAD)"
else
    step "1/5 跳过 git pull（--no-pull）"
fi

# ====== 2. 构建 app 镜像 ======
step "2/5 构建 app 镜像 ($LOWPRIO)"
# shellcheck disable=SC2086
$LOWPRIO $COMPOSE_CMD --env-file "$ENV_FILE" build $BUILD_FLAGS app
ok "app 镜像 OK"

# ====== 3. 构建 caddy 镜像 ======
# caddy Dockerfile 现在 `FROM homepage-app:latest`（复用 static 产物），
# 所以必须在 app 之后构建。这一步没有 pnpm install / build，非常快。
step "3/5 构建 caddy 镜像"
# shellcheck disable=SC2086
$LOWPRIO $COMPOSE_CMD --env-file "$ENV_FILE" build $BUILD_FLAGS caddy
ok "caddy 镜像 OK"

# ====== 4. 滚动启动 ======
step "4/5 启动服务"
$COMPOSE_CMD --env-file "$ENV_FILE" up -d
ok "已启动"

info "等待健康检查通过（最多 90s）..."
ATTEMPTS=0
READY=false
while [ $ATTEMPTS -lt 45 ]; do
    if $COMPOSE_CMD --env-file "$ENV_FILE" ps 2>/dev/null | grep -qE 'homepage-app.*healthy'; then
        READY=true
        break
    fi
    printf "."
    sleep 2
    ATTEMPTS=$((ATTEMPTS + 1))
done
echo ""
if "$READY"; then
    ok "app 健康"
else
    warn "app 未在 90s 内 healthy，查日志：$COMPOSE_CMD --env-file $ENV_FILE logs --tail 100 app"
fi

# ====== 5. 清理旧镜像 ======
step "5/5 清理无引用镜像"
docker image prune -f >/dev/null 2>&1 || true
ok "完成"

echo ""
$COMPOSE_CMD --env-file "$ENV_FILE" ps
