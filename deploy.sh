#!/usr/bin/env bash
# ===================================================
# homepage — 一键部署脚本（一步到位版）
# ===================================================
# 用法：
#   bash deploy.sh                       # 全自动：缺则生成 .env.docker，无交互
#   DOMAIN=my.example.com bash deploy.sh # 自定义域名（仅首次生成时生效）
#   bash deploy.sh -i                    # 交互式配置（兼容旧版）
# ===================================================
set -euo pipefail

# ====== 颜色定义 ======
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

banner() {
    echo -e "${CYAN}"
    echo "  ╔══════════════════════════════════════════╗"
    echo "  ║         homepage — 一键部署脚本           ║"
    echo "  ║     全栈前后端分离首页管理系统              ║"
    echo "  ╚══════════════════════════════════════════╝"
    echo -e "${NC}"
}

ok()   { echo -e "  ${GREEN}✓${NC} $1"; }
warn() { echo -e "  ${YELLOW}⚠${NC} $1"; }
err()  { echo -e "  ${RED}✗${NC} $1"; }
info() { echo -e "  ${BLUE}→${NC} $1"; }

# ====== 参数解析 ======
INTERACTIVE=false
for arg in "$@"; do
    case "$arg" in
        -i|--interactive) INTERACTIVE=true ;;
        -h|--help)
            sed -n '2,7p' "$0" | sed 's/^# \?//'
            exit 0
            ;;
        *)
            err "未知参数: $arg  (使用 -h 查看帮助)"
            exit 1
            ;;
    esac
done

# ====== 工具函数 ======
rand() {
    # 生成 base64 随机串，失败时退化
    openssl rand -base64 "$1" 2>/dev/null \
        || cat /dev/urandom | tr -dc 'a-zA-Z0-9' | head -c"$1"
}

# ====== 1. 环境检查 ======
check_deps() {
    echo ""
    echo -e "${BOLD}==> 1/5 检查运行环境${NC}"

    if command -v docker &>/dev/null; then
        ok "Docker $(docker --version 2>/dev/null | grep -o '[0-9.]*' | head -1)"
    else
        err "Docker 未安装，请先安装 Docker：https://docs.docker.com/engine/install/"
        exit 1
    fi

    COMPOSE_CMD=""
    if docker compose version &>/dev/null; then
        COMPOSE_CMD="docker compose"
        ok "Docker Compose (v2)"
    elif command -v docker-compose &>/dev/null; then
        COMPOSE_CMD="docker-compose"
        ok "Docker Compose (v1)"
    else
        err "Docker Compose 未安装，请先安装：https://docs.docker.com/compose/install/"
        exit 1
    fi

    # 端口检查（仅警告）
    if command -v netstat &>/dev/null; then
        if netstat -tlnp 2>/dev/null | grep -qE ':(80|443)\s'; then
            warn "端口 80 或 443 已被占用，可能导致 Caddy 启动失败"
        else
            ok "端口 80 / 443 可用"
        fi
    elif command -v ss &>/dev/null; then
        if ss -tlnp 2>/dev/null | grep -qE ':(80|443)\s'; then
            warn "端口 80 或 443 已被占用，可能导致 Caddy 启动失败"
        else
            ok "端口 80 / 443 可用"
        fi
    fi
}

# ====== 2. 交互式收集配置（仅 -i 模式） ======
collect_config() {
    echo ""
    echo -e "${BOLD}==> 2/5 配置部署参数${NC}"

    echo ""
    echo -e "  ${CYAN}请输入域名或 IP 地址：${NC}"
    while true; do
        read -rp "  DOMAIN: " DOMAIN
        [ -n "$DOMAIN" ] && break
        warn "域名/IP 不能为空"
    done

    if [[ "$DOMAIN" =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; then
        warn "检测到 IP 地址 — 仅 HTTP 模式（ACME 不支持 IP）"
        ACME_EMAIL=""
    elif [[ "$DOMAIN" == "localhost" || "$DOMAIN" == "127.0.0.1" ]]; then
        warn "使用 localhost — 仅本机 HTTP 访问"
        ACME_EMAIL=""
    else
        echo ""
        echo -e "  ${CYAN}请输入邮箱（用于 HTTPS 证书到期提醒）：${NC}"
        while true; do
            read -rp "  ACME_EMAIL: " ACME_EMAIL
            [[ "$ACME_EMAIL" =~ ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]] && break
            warn "邮箱格式无效"
        done
    fi

    echo ""
    echo -e "  ${CYAN}JWT 密钥：${NC}"
    read -rp "  自动生成？[Y/n]: " jwt_choice
    if [[ "${jwt_choice:-Y}" =~ ^[Nn]$ ]]; then
        while true; do
            read -rp "  JWT_SECRET (≥20位): " JWT_SECRET
            [ ${#JWT_SECRET} -ge 20 ] && break
            warn "长度至少 20 位"
        done
    else
        JWT_SECRET=$(rand 32)
    fi

    echo ""
    echo -e "  ${CYAN}默认管理员密码：${NC}"
    read -rp "  自动生成？[Y/n]: " admin_choice
    if [[ "${admin_choice:-Y}" =~ ^[Nn]$ ]]; then
        while true; do
            read -rp "  DEFAULT_ADMIN_PASSWORD (≥12位): " ADMIN_PASSWORD
            [ ${#ADMIN_PASSWORD} -ge 12 ] && break
            warn "长度至少 12 位"
        done
    else
        ADMIN_PASSWORD=$(rand 24)
    fi

    ACME_CA="https://acme.zerossl.com/v2/DV90"
    DB_USERNAME="homepage"
    DB_DATABASE="homepage"
    DB_ROOT_PASSWORD=$(rand 20)
    DB_PASSWORD=$(rand 20)
    info "数据库密码已自动生成"
}

# ====== 2. 一键加载 / 生成配置（默认模式） ======
load_or_generate_env() {
    echo ""
    echo -e "${BOLD}==> 2/5 加载部署配置${NC}"

    local env_file=".env.docker"

    if [ -f "$env_file" ]; then
        info "检测到现有 .env.docker，正在加载..."
        # 去除 CRLF（兼容 Windows 编辑器保存的换行）
        local tmp
        tmp=$(mktemp)
        sed 's/\r$//' "$env_file" > "$tmp"
        set -a
        # shellcheck disable=SC1090
        source "$tmp"
        set +a
        rm -f "$tmp"
        ok "已加载 .env.docker"
    else
        info "未找到 .env.docker，正在自动生成（DOMAIN 默认 localhost）..."
        # DOMAIN 优先取环境变量，否则 localhost
        DOMAIN="${DOMAIN:-localhost}"
        ACME_EMAIL="${ACME_EMAIL:-}"
        ACME_CA="https://acme.zerossl.com/v2/DV90"
        JWT_SECRET=$(rand 32)
        DEFAULT_ADMIN_PASSWORD=$(rand 24)
        DB_ROOT_PASSWORD=$(rand 20)
        DB_USERNAME="homepage"
        DB_PASSWORD=$(rand 20)
        DB_DATABASE="homepage"

        cat > "$env_file" <<EOF
# homepage Docker 部署环境变量 — $(date '+%Y-%m-%d %H:%M:%S') 自动生成
# 包含敏感信息，请妥善保管！
DOMAIN=${DOMAIN}
JWT_SECRET=${JWT_SECRET}
DEFAULT_ADMIN_PASSWORD=${DEFAULT_ADMIN_PASSWORD}
ACME_CA=${ACME_CA}
ACME_EMAIL=${ACME_EMAIL}
DB_ROOT_PASSWORD=${DB_ROOT_PASSWORD}
DB_USERNAME=${DB_USERNAME}
DB_PASSWORD=${DB_PASSWORD}
DB_DATABASE=${DB_DATABASE}
# 首次部署自动建表，部署完成后建议改为 false
DB_SYNCHRONIZE=true
EOF

        set -a
        # shellcheck disable=SC1090
        source "$env_file"
        set +a
        ok ".env.docker 已自动生成"
        warn "管理员账号: admin  密码: ${DEFAULT_ADMIN_PASSWORD}"
    fi
}

# ====== 3. 构建镜像 ======
build_app() {
    echo ""
    echo -e "${BOLD}==> 3/5 构建 Docker 镜像${NC}"

    info "正在构建 homepage-app 镜像..."
    if $COMPOSE_CMD --env-file .env.docker build app; then
        ok "homepage-app 镜像构建完成"
    else
        err "app 镜像构建失败"
        exit 1
    fi

    info "正在构建 homepage-caddy 镜像..."
    if $COMPOSE_CMD --env-file .env.docker build caddy; then
        ok "homepage-caddy 镜像构建完成"
    else
        err "caddy 镜像构建失败"
        exit 1
    fi
}

# ====== 4. 启动服务 ======
start_services() {
    echo ""
    echo -e "${BOLD}==> 4/5 启动服务${NC}"
    info "正在启动所有容器..."

    if $COMPOSE_CMD --env-file .env.docker up -d; then
        ok "服务已启动"
    else
        err "服务启动失败，请检查日志：$COMPOSE_CMD --env-file .env.docker logs"
        exit 1
    fi

    echo ""
    info "等待服务就绪..."
    local attempts=0
    while [ $attempts -lt 30 ]; do
        if $COMPOSE_CMD --env-file .env.docker ps 2>/dev/null | grep -qE 'homepage-app.*healthy'; then
            ok "所有服务就绪"
            break
        fi
        sleep 2
        attempts=$((attempts + 1))
    done
}

# ====== 5. 输出汇总 ======
print_summary() {
    local proto="http"
    if [[ ! "$DOMAIN" =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]] \
       && [[ "$DOMAIN" != "localhost" && "$DOMAIN" != "127.0.0.1" ]]; then
        proto="https"
    fi

    echo ""
    echo -e "${GREEN}${BOLD}  ╔══════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}${BOLD}  ║          🎉 部署完成！                    ║${NC}"
    echo -e "${GREEN}${BOLD}  ╚══════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "  ${BOLD}前台主页：${NC}  ${CYAN}${proto}://${DOMAIN}/${NC}"
    echo -e "  ${BOLD}管理后台：${NC}  ${CYAN}${proto}://${DOMAIN}/admin${NC}"
    echo ""
    echo -e "  ${BOLD}管理员账号：${NC} ${YELLOW}admin${NC}"
    echo -e "  ${BOLD}管理员密码：${NC} ${YELLOW}${DEFAULT_ADMIN_PASSWORD}${NC} ${GREEN}← 已输出，下次启动请从 .env.docker 读取${NC}"
    echo ""
    echo -e "  ${BOLD}常用命令：${NC}"
    echo "    $COMPOSE_CMD --env-file .env.docker ps             # 服务状态"
    echo "    $COMPOSE_CMD --env-file .env.docker logs -f        # 实时日志"
    echo "    $COMPOSE_CMD --env-file .env.docker down           # 停止"
    echo "    $COMPOSE_CMD --env-file .env.docker up -d          # 启动"
    echo ""
}

# ====== 主流程 ======
main() {
    banner
    check_deps
    if [ "$INTERACTIVE" = true ]; then
        collect_config
        # 交互模式也写出 .env.docker
        local env_file=".env.docker"
        cat > "$env_file" <<EOF
# homepage Docker 部署环境变量 — $(date '+%Y-%m-%d %H:%M:%S') 交互生成
DOMAIN=${DOMAIN}
JWT_SECRET=${JWT_SECRET}
DEFAULT_ADMIN_PASSWORD=${ADMIN_PASSWORD:-${DEFAULT_ADMIN_PASSWORD:-}}
ACME_CA=${ACME_CA}
ACME_EMAIL=${ACME_EMAIL}
DB_ROOT_PASSWORD=${DB_ROOT_PASSWORD}
DB_USERNAME=${DB_USERNAME}
DB_PASSWORD=${DB_PASSWORD}
DB_DATABASE=${DB_DATABASE}
DB_SYNCHRONIZE=true
EOF
        set -a; source "$env_file"; set +a
        DEFAULT_ADMIN_PASSWORD="${ADMIN_PASSWORD:-${DEFAULT_ADMIN_PASSWORD:-}}"
    else
        load_or_generate_env
    fi
    build_app
    start_services
    print_summary
}

main
