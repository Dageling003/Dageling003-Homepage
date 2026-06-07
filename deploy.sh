#!/usr/bin/env bash
# ===================================================
# homepage — 一键部署脚本
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

# ====== 1. 环境检查 ======
check_deps() {
    echo ""
    echo -e "${BOLD}==> 1/5 检查运行环境${NC}"

    # Docker
    if command -v docker &>/dev/null; then
        ok "Docker $(docker --version 2>/dev/null | grep -o '[0-9.]*' | head -1)"
    else
        err "Docker 未安装，请先安装 Docker：https://docs.docker.com/engine/install/"
        exit 1
    fi

    # Docker Compose (try both v2 and v1)
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

    # Caddy: port 80/443 must be available
    if command -v netstat &>/dev/null; then
        if netstat -tlnp 2>/dev/null | grep -qE ':(80|443)\s'; then
            warn "端口 80 或 443 已被占用，请先停止占用这些端口的服务"
            netstat -tlnp 2>/dev/null | grep -E ':(80|443)\s' || true
            echo ""
            read -rp "  是否继续？端口冲突可能导致 Caddy 启动失败 [y/N]: " cont
            [[ "$cont" =~ ^[Yy]$ ]] || exit 1
        else
            ok "端口 80 / 443 可用"
        fi
    elif command -v ss &>/dev/null; then
        if ss -tlnp 2>/dev/null | grep -qE ':(80|443)\s'; then
            warn "端口 80 或 443 已被占用，请先停止占用这些端口的服务"
            ss -tlnp 2>/dev/null | grep -E ':(80|443)\s' || true
            echo ""
            read -rp "  是否继续？端口冲突可能导致 Caddy 启动失败 [y/N]: " cont
            [[ "$cont" =~ ^[Yy]$ ]] || exit 1
        else
            ok "端口 80 / 443 可用"
        fi
    fi
}

# ====== 2. 收集配置 ======
collect_config() {
    echo ""
    echo -e "${BOLD}==> 2/5 配置部署参数${NC}"
    echo ""

    # --- DOMAIN ---
    echo -e "  ${CYAN}请输入域名或 IP 地址：${NC}"
    echo "    域名（推荐）→ 自动申请免费 HTTPS 证书"
    echo "    IP 地址     → 仅 HTTP（ACME 不支持 IP 签发证书）"
    echo ""
    while true; do
        read -rp "  DOMAIN: " DOMAIN
        if [ -n "$DOMAIN" ]; then
            break
        fi
        warn "域名/IP 不能为空"
    done

    # Detect if IP or domain
    if [[ "$DOMAIN" =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; then
        echo ""
        warn "检测到 IP 地址。ACME 不支持为 IP 签发证书，将使用 HTTP 模式。"
        warn "如需 HTTPS，请使用域名（可使用免费 DDNS 服务如 duckdns.org）。"
        echo ""
        read -rp "  确认继续？[Y/n]: " cont
        [[ "$cont" =~ ^[Nn]$ ]] && exit 0
        USE_ACME=false
    elif [[ "$DOMAIN" == "localhost" || "$DOMAIN" == "127.0.0.1" ]]; then
        warn "使用 localhost — 仅限本机访问，HTTP 模式"
        USE_ACME=false
    else
        USE_ACME=true
    fi

    # --- ACME CA selection (only for domain-based deployments) ---
    if [ "$USE_ACME" = true ]; then
        echo ""
        echo -e "  ${CYAN}选择证书颁发机构 (CA)：${NC}"
        echo "    1) ZeroSSL（默认，国内可正常访问）"
        echo "    2) Let's Encrypt（国内可能被墙）"
        read -rp "  请选择 [1]: " ca_choice
        if [ "${ca_choice:-1}" = "2" ]; then
            ACME_CA="https://acme-v02.api.letsencrypt.org/directory"
            ok "已选择 Let's Encrypt"
        else
            ACME_CA="https://acme.zerossl.com/v2/DV90"
            ok "已选择 ZeroSSL"
        fi

        # --- ACME Email ---
        echo ""
        echo -e "  ${CYAN}请输入邮箱地址（用于证书到期提醒）：${NC}"
        while true; do
            read -rp "  ACME_EMAIL: " ACME_EMAIL
            if [[ "$ACME_EMAIL" =~ ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]]; then
                break
            fi
            warn "请输入有效的邮箱地址"
        done
    else
        ACME_CA="https://acme.zerossl.com/v2/DV90"
        ACME_EMAIL=""
    fi

    # --- JWT_SECRET ---
    echo ""
    echo -e "  ${CYAN}JWT 密钥（用于 API 认证）：${NC}"
    echo "    1) 自动生成（推荐）"
    echo "    2) 手动输入"
    read -rp "  请选择 [1]: " jwt_choice
    if [ "${jwt_choice:-1}" = "2" ]; then
        while true; do
            read -rp "  JWT_SECRET: " JWT_SECRET
            if [ ${#JWT_SECRET} -ge 20 ]; then
                break
            fi
            warn "JWT_SECRET 长度至少 20 位，当前 ${#JWT_SECRET} 位"
        done
    else
        JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || cat /dev/urandom | tr -dc 'a-zA-Z0-9' | head -c32)
        ok "JWT_SECRET 已自动生成"
    fi

    # --- DEFAULT_ADMIN_PASSWORD ---
    echo ""
    echo -e "  ${CYAN}默认管理员密码（首次初始化时创建 admin 账号）：${NC}"
    echo "    1) 自动生成（推荐）"
    echo "    2) 手动输入"
    read -rp "  请选择 [1]: " admin_choice
    if [ "${admin_choice:-1}" = "2" ]; then
        while true; do
            read -rp "  DEFAULT_ADMIN_PASSWORD: " ADMIN_PASSWORD
            if [ ${#ADMIN_PASSWORD} -ge 12 ]; then
                break
            fi
            warn "密码长度至少 12 位，当前 ${#ADMIN_PASSWORD} 位"
        done
    else
        ADMIN_PASSWORD=$(openssl rand -base64 24 2>/dev/null || cat /dev/urandom | tr -dc 'a-zA-Z0-9!@#$%^&*' | head -c24)
        ok "DEFAULT_ADMIN_PASSWORD 已自动生成"
    fi

    # --- DB passwords ---
    echo ""
    info "正在生成数据库密码..."
    DB_ROOT_PASSWORD=$(openssl rand -base64 16 2>/dev/null || cat /dev/urandom | tr -dc 'a-zA-Z0-9' | head -c16)
    DB_PASSWORD=$(openssl rand -base64 16 2>/dev/null || cat /dev/urandom | tr -dc 'a-zA-Z0-9' | head -c16)
    DB_USERNAME="homepage"
    DB_DATABASE="homepage"
    ok "数据库密码已自动生成"
}

# ====== 3. 生成 .env.docker ======
write_env() {
    echo ""
    echo -e "${BOLD}==> 3/5 生成 .env.docker${NC}"

    local env_file=".env.docker"

    if [ -f "$env_file" ]; then
        echo ""
        warn ".env.docker 已存在"
        read -rp "  是否覆盖？[y/N]: " overwrite
        [[ "$overwrite" =~ ^[Yy]$ ]] || { info "保留现有 .env.docker，跳过"; return; }
    fi

    cat > "$env_file" <<EOF
# homepage Docker 部署环境变量 — $(date '+%Y-%m-%d %H:%M:%S') 生成
DOMAIN=${DOMAIN}
JWT_SECRET=${JWT_SECRET}
DEFAULT_ADMIN_PASSWORD=${ADMIN_PASSWORD}
ACME_CA=${ACME_CA}
ACME_EMAIL=${ACME_EMAIL}
DB_ROOT_PASSWORD=${DB_ROOT_PASSWORD}
DB_USERNAME=${DB_USERNAME}
DB_PASSWORD=${DB_PASSWORD}
DB_DATABASE=${DB_DATABASE}
EOF

    ok ".env.docker 已生成"
    warn "请妥善保管此文件，其中包含敏感信息"
}

# ====== 4. 构建镜像 ======
build_app() {
    echo ""
    echo -e "${BOLD}==> 4/5 构建 Docker 镜像${NC}"
    info "正在构建 homepage-app 镜像（包含前后端全部应用）..."

    if $COMPOSE_CMD --env-file .env.docker build app 2>&1 | tail -20; then
        ok "镜像构建完成"
    else
        err "镜像构建失败，请检查上方错误信息"
        exit 1
    fi
}

# ====== 5. 启动服务 ======
start_services() {
    echo ""
    echo -e "${BOLD}==> 5/5 启动服务${NC}"
    info "正在启动所有容器..."

    if $COMPOSE_CMD --env-file .env.docker up -d; then
        ok "服务已启动"
    else
        err "服务启动失败，请检查日志：$COMPOSE_CMD logs"
        exit 1
    fi

    # Wait for health
    echo ""
    info "等待服务就绪..."
    local attempts=0
    while [ $attempts -lt 30 ]; do
        if $COMPOSE_CMD ps | grep -q 'homepage-app.*Up'; then
            ok "所有服务就绪"
            break
        fi
        sleep 2
        attempts=$((attempts + 1))
    done
}

# ====== 最终输出 ======
print_summary() {
    local proto="http"
    if [[ ! "$DOMAIN" =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]] && \
       [[ "$DOMAIN" != "localhost" && "$DOMAIN" != "127.0.0.1" ]]; then
        proto="https"
    fi

    echo ""
    echo -e "${GREEN}${BOLD}  ╔══════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}${BOLD}  ║          🎉 部署完成！                    ║${NC}"
    echo -e "${GREEN}${BOLD}  ╚══════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "  ${BOLD}前台主页：${NC}    ${CYAN}${proto}://${DOMAIN}/${NC}"
    echo -e "  ${BOLD}管理后台：${NC}    ${CYAN}${proto}://${DOMAIN}/admin${NC}"
    echo -e "  ${BOLD}API 文档：${NC}    ${CYAN}${proto}://${DOMAIN}/api/docs${NC}"
    echo ""
    echo -e "  ${BOLD}管理员账号：${NC}  ${YELLOW}admin${NC}"
    echo -e "  ${BOLD}管理员密码：${NC}  ${YELLOW}${ADMIN_PASSWORD}${NC}"
    echo ""
    echo -e "  ${BOLD}⚠  请立即登录后台修改默认密码！${NC}"
    echo ""
    echo -e "  ${BOLD}常用命令：${NC}"
    echo "    $COMPOSE_CMD ps             查看服务状态"
    echo "    $COMPOSE_CMD logs -f        查看所有日志"
    echo "    $COMPOSE_CMD logs -f caddy  查看 Caddy 日志"
    echo "    $COMPOSE_CMD logs -f app    查看应用日志"
    echo "    $COMPOSE_CMD down           停止并删除容器"
    echo "    $COMPOSE_CMD up -d          重新启动"
    echo ""

    if [ "$proto" = "https" ]; then
        local ca_name="ZeroSSL"
        [[ "$ACME_CA" == *"letsencrypt"* ]] && ca_name="Let's Encrypt"
        echo -e "  ${GREEN}🔒 HTTPS 证书由 ${ca_name} 自动管理，无需手动续签${NC}"
        echo ""
    fi
}

# ====== 主流程 ======
main() {
    banner
    check_deps
    collect_config
    write_env
    build_app
    start_services
    print_summary
}

main
