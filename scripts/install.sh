#!/usr/bin/env bash
# ===================================================
# homepage — 远程一键引导脚本
# ===================================================
# 用法（裸机 / 全新服务器）：
#   curl -fsSL https://raw.githubusercontent.com/Dageling003/Dageling003-Homepage/main/scripts/install.sh | bash
#
# 带参数：
#   curl -fsSL <url> | DOMAIN=example.com bash
#   curl -fsSL <url> | CI=true DOMAIN=example.com bash
#   curl -fsSL <url> | INSTALL_DIR=/opt/homepage BRANCH=main bash
#
# 环境变量：
#   DOMAIN       域名或 IP，透传给 deploy.sh
#   CI           = true 时全自动无交互
#   INSTALL_DIR  安装目录，默认 ./Dageling003-Homepage
#   BRANCH       git 分支，默认 main
#   REPO         git 仓库地址，默认官方仓库
# ===================================================
set -euo pipefail

REPO="${REPO:-https://github.com/Dageling003/Dageling003-Homepage.git}"
BRANCH="${BRANCH:-main}"
INSTALL_DIR="${INSTALL_DIR:-Dageling003-Homepage}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

ok()   { echo -e "  ${GREEN}✓${NC} $1"; }
warn() { echo -e "  ${YELLOW}⚠${NC} $1"; }
err()  { echo -e "  ${RED}✗${NC} $1"; }
info() { echo -e "  ${CYAN}→${NC} $1"; }

echo -e "${CYAN}"
echo "  ╔══════════════════════════════════════════╗"
echo "  ║   homepage — 一键引导 (clone + deploy)    ║"
echo "  ╚══════════════════════════════════════════╝"
echo -e "${NC}"

# ====== 依赖检查 ======
need() {
    command -v "$1" >/dev/null 2>&1 || {
        err "缺少依赖: $1"
        case "$1" in
            git)    echo "     Debian/Ubuntu: sudo apt install -y git" ;;
            docker) echo "     一键安装:      curl -fsSL https://get.docker.com | sh" ;;
            bash)   echo "     请安装 bash ≥ 4" ;;
        esac
        exit 1
    }
}

info "检查依赖..."
need bash
need git
need docker

if docker compose version >/dev/null 2>&1; then
    ok "Docker Compose (v2)"
elif command -v docker-compose >/dev/null 2>&1; then
    ok "Docker Compose (v1)"
else
    err "Docker Compose 未安装，参考 https://docs.docker.com/compose/install/"
    exit 1
fi

# ====== 克隆或更新仓库 ======
echo ""
if [ -d "$INSTALL_DIR/.git" ]; then
    info "已存在 $INSTALL_DIR，执行 git pull..."
    git -C "$INSTALL_DIR" fetch --depth 1 origin "$BRANCH"
    git -C "$INSTALL_DIR" checkout "$BRANCH"
    git -C "$INSTALL_DIR" reset --hard "origin/$BRANCH"
    ok "更新完成"
elif [ -e "$INSTALL_DIR" ]; then
    err "$INSTALL_DIR 已存在但不是 git 仓库，请手动清理或换 INSTALL_DIR="
    exit 1
else
    info "克隆 $REPO ($BRANCH)..."
    git clone --depth 1 --branch "$BRANCH" "$REPO" "$INSTALL_DIR"
    ok "克隆完成 → $INSTALL_DIR"
fi

# ====== 交接给 deploy.sh ======
echo ""
info "即将进入 $INSTALL_DIR 并执行 scripts/deploy.sh"
echo ""

cd "$INSTALL_DIR"

# 透传 DOMAIN / CI / 其它环境变量给 deploy.sh
exec bash scripts/deploy.sh "$@"
