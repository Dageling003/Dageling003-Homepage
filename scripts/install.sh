#!/usr/bin/env bash
# ===================================================
# homepage — 远程一键引导脚本
# ===================================================
# 用法（裸机 / 全新服务器）：
#
# 海外服务器（交互向导）：
#   curl -fsSL https://raw.githubusercontent.com/Dageling003/Dageling003-Homepage/main/scripts/install.sh | bash
#
# 海外服务器（全自动，推荐）：
#   curl -fsSL https://raw.githubusercontent.com/Dageling003/Dageling003-Homepage/main/scripts/install.sh \
#     | CI=true DOMAIN=your-domain.com ACME_EMAIL=you@example.com bash
#
# 国内服务器（全自动，推荐）：
#   curl -fsSL https://raw.githubusercontent.com/Dageling003/Dageling003-Homepage/main/scripts/install.sh \
#     | CI=true CN=true DOMAIN=your-domain.com ACME_EMAIL=you@example.com bash
#
# 只用服务器 IP（纯 HTTP 试跑，无需 ACME_EMAIL）：
#   curl -fsSL https://raw.githubusercontent.com/Dageling003/Dageling003-Homepage/main/scripts/install.sh \
#     | CI=true DOMAIN=1.2.3.4 bash
#
# 国内服务器（交互向导）：
#   curl -fsSL https://raw.githubusercontent.com/Dageling003/Dageling003-Homepage/main/scripts/install.sh | CN=true bash
#
# 参数（可选，供高级场景使用）：
#   --cn              国内模式（同 CN=true 环境变量）
#   --domain DOMAIN   指定域名/IP（同 DOMAIN= 环境变量）
#   --branch BRANCH   git 分支，默认 main
#   --dir PATH        安装目录，默认 ./Dageling003-Homepage
#
# 环境变量：
#   DOMAIN       域名或 IP（域名部署要先把 DNS A 记录指向本机）
#   ACME_EMAIL   HTTPS 证书邮箱（可选，域名部署强烈建议填 —— 用于证书到期提醒）
#   CI           = true 时全自动无交互
#   CN           = true 时使用国内模式（slim 镜像 + 镜像加速）
#   INSTALL_DIR  安装目录
#   BRANCH       git 分支
#   REPO         git 仓库地址
# ===================================================
set -euo pipefail

REPO="${REPO:-https://github.com/Dageling003/Dageling003-Homepage.git}"
BRANCH="${BRANCH:-main}"
INSTALL_DIR="${INSTALL_DIR:-Dageling003-Homepage}"
USE_CN_MODE="${CN:-false}"
DOMAIN_ARG=""

# ---------- 参数解析 ----------
while [[ $# -gt 0 ]]; do
    case "$1" in
        --cn)
            USE_CN_MODE=true
            shift
            ;;
        --domain)
            DOMAIN_ARG="${2:-}"
            shift 2
            ;;
        --branch)
            BRANCH="${2:-main}"
            shift 2
            ;;
        --dir)
            INSTALL_DIR="${2:-Dageling003-Homepage}"
            shift 2
            ;;
        -h|--help)
            sed -n '2,20p' "$0" | sed 's/^# \?//'
            exit 0
            ;;
        *)
            echo "  未知参数: $1  (使用 -h 查看帮助)" >&2
            exit 1
            ;;
    esac
done

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

if $USE_CN_MODE; then
    echo -e "  ${GREEN}🇨🇳 国内模式已启用${NC}"
    echo ""
fi

# ====== 依赖检查 ======
need() {
    command -v "$1" >/dev/null 2>&1 || return 1
}

info "检查依赖..."

# git
if need git; then
    ok "git $(git --version | grep -o '[0-9.]*')"
else
    info "git 未安装，正在安装..."
    if command -v apt-get >/dev/null 2>&1; then
        apt-get update -qq && apt-get install -y -qq git
    elif command -v dnf >/dev/null 2>&1; then
        dnf install -y -q git
    elif command -v yum >/dev/null 2>&1; then
        yum install -y -q git
    else
        err "无法自动安装 git，请手动安装后重试"
        exit 1
    fi
    ok "git 安装完成"
fi

# docker
if need docker && docker compose version >/dev/null 2>&1; then
    ok "Docker $(docker --version | grep -o '[0-9.]*' | head -1)"
    ok "Docker Compose (v2)"
elif need docker && command -v docker-compose >/dev/null 2>&1; then
    ok "Docker $(docker --version | grep -o '[0-9.]*' | head -1)"
    ok "Docker Compose (v1)"
else
    info "Docker 未安装，将在克隆仓库后通过 install-docker.sh 安装"
    # 先标记需要安装，克隆完成后再执行
    NEED_DOCKER_INSTALL=true
fi

# ====== 克隆或更新仓库 ======
echo ""

# 判断是否在项目目录内执行（本地运行 install.sh 时）
# 通过 curl | bash 执行时 BASH_SOURCE 不可靠，走克隆/更新逻辑
SCRIPT_DIR=""
if [ -n "${BASH_SOURCE[0]:-}" ] && [ "${BASH_SOURCE[0]}" != "-" ] && [ -f "${BASH_SOURCE[0]:-}" ]; then
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
fi

IN_PROJECT_DIR=false
if [ -n "$SCRIPT_DIR" ] && [ -f "$SCRIPT_DIR/deploy.sh" ] && [ -f "$SCRIPT_DIR/../docker-compose.yml" ]; then
    IN_PROJECT_DIR=true
fi

if "$IN_PROJECT_DIR"; then
    PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
    info "检测到项目目录: $PROJECT_ROOT"
    cd "$PROJECT_ROOT"
elif [ -d "$INSTALL_DIR/.git" ]; then
    info "已存在 $INSTALL_DIR，执行 git pull..."
    cd "$INSTALL_DIR"
    git fetch --depth 1 origin "$BRANCH"
    git checkout "$BRANCH"
    git reset --hard "origin/$BRANCH"
    ok "更新完成"
elif [ -e "$INSTALL_DIR" ]; then
    err "$INSTALL_DIR 已存在但不是 git 仓库，请手动清理或换 --dir="
    exit 1
else
    info "克隆 $REPO ($BRANCH)..."
    git clone --depth 1 --branch "$BRANCH" "$REPO" "$INSTALL_DIR"
    ok "克隆完成 → $INSTALL_DIR"
    cd "$INSTALL_DIR"
fi

# ====== 安装 Docker（如果需要） ======
if "${NEED_DOCKER_INSTALL:-false}"; then
    echo ""
    info "通过 install-docker.sh 安装 Docker..."
    # 确定 install-docker.sh 的路径：优先用项目根目录下的 scripts/
    INSTALL_DOCKER_SCRIPT=""
    if "$IN_PROJECT_DIR"; then
        INSTALL_DOCKER_SCRIPT="$PROJECT_ROOT/scripts/install-docker.sh"
    elif [ -f "$INSTALL_DIR/scripts/install-docker.sh" ]; then
        INSTALL_DOCKER_SCRIPT="$INSTALL_DIR/scripts/install-docker.sh"
    elif [ -f "scripts/install-docker.sh" ]; then
        INSTALL_DOCKER_SCRIPT="scripts/install-docker.sh"
    fi
    if [ -n "$INSTALL_DOCKER_SCRIPT" ] && [ -f "$INSTALL_DOCKER_SCRIPT" ]; then
        if $USE_CN_MODE; then
            bash "$INSTALL_DOCKER_SCRIPT" --cn
        else
            bash "$INSTALL_DOCKER_SCRIPT"
        fi
    else
        err "install-docker.sh 不存在，请手动安装 Docker: https://docs.docker.com/engine/install/"
        exit 1
    fi

    if need docker && docker compose version >/dev/null 2>&1; then
        ok "Docker 安装完成"
    else
        err "Docker 安装失败，请检查日志后重试"
        exit 1
    fi
fi

# ====== 交接给 deploy.sh ======
echo ""
info "即将执行 scripts/deploy.sh"
echo ""

# 构建 deploy.sh 参数
DEPLOY_ARGS=()
if $USE_CN_MODE; then
    DEPLOY_ARGS+=("--cn")
fi

# 透传 DOMAIN
if [ -n "${DOMAIN:-}" ]; then
    export DOMAIN
elif [ -n "$DOMAIN_ARG" ]; then
    export DOMAIN="$DOMAIN_ARG"
fi

# 透传 ACME_EMAIL（HTTPS 证书邮箱，用于 Let's Encrypt / ZeroSSL 到期通知）
if [ -n "${ACME_EMAIL:-}" ]; then
    export ACME_EMAIL
fi

# 透传 CI
if [ "${CI:-false}" = "true" ]; then
    export CI
fi

exec bash scripts/deploy.sh "${DEPLOY_ARGS[@]}"
