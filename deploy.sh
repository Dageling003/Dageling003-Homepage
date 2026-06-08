#!/usr/bin/env bash
# ===================================================
# homepage — 一键部署脚本
# ===================================================
# 用法：
#   bash deploy.sh                       # 全自动：缺则生成 .env.docker，无交互
#   DOMAIN=my.example.com bash deploy.sh # 自定义域名（仅首次生成时生效）
#   bash deploy.sh -i                    # 交互式配置（兼容旧版）
#
#   1) DEFAULT_ADMIN_PASSWORD 现在是「可选」——留空时通过 /admin/setup 自设密码
#   2) 自动收集 SMTP 邮件配置（不配也能用，找回密码降级到 docker logs）
#   3) 自动写入 PUBLIC_ADMIN_URL（找回密码邮件链接里要用）
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
    echo "  ║         homepage — 一键部署脚本 v2        ║"
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
            sed -n '2,11p' "$0" | sed 's/^# \?//'
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

# 推断主协议（域名 → https，IP/localhost → http）
derive_proto() {
    local d="${1:-localhost}"
    if [[ "$d" =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]] \
       || [[ "$d" == "localhost" || "$d" == "127.0.0.1" ]]; then
        echo "http"
    else
        echo "https"
    fi
}

# 把 .env.docker 加载进当前 shell
load_env_file() {
    local env_file="$1"
    local tmp
    tmp=$(mktemp)
    sed 's/\r$//' "$env_file" > "$tmp"
    set -a
    # shellcheck disable=SC1090
    source "$tmp"
    set +a
    rm -f "$tmp"
}

# 把所有变量写入 .env.docker
write_env_file() {
    local env_file="$1"
    local proto
    proto=$(derive_proto "${DOMAIN:-localhost}")
    local public_url
    if [ -n "${PUBLIC_ADMIN_URL:-}" ]; then
        public_url="${PUBLIC_ADMIN_URL}"
    else
        public_url="${proto}://${DOMAIN:-localhost}"
    fi

    cat > "$env_file" <<EOF
# homepage Docker 部署环境变量 — $(date '+%Y-%m-%d %H:%M:%S') 自动生成
# 包含敏感信息，请妥善保管！切勿提交至 Git。
DOMAIN=${DOMAIN}
JWT_SECRET=${JWT_SECRET}
# 留空 → 通过 /admin/setup 自设密码；设置 → 容器启动时自动用此密码建 admin
DEFAULT_ADMIN_PASSWORD=${DEFAULT_ADMIN_PASSWORD}
ACME_CA=${ACME_CA}
ACME_EMAIL=${ACME_EMAIL}
DB_ROOT_PASSWORD=${DB_ROOT_PASSWORD}
DB_USERNAME=${DB_USERNAME}
DB_PASSWORD=${DB_PASSWORD}
DB_DATABASE=${DB_DATABASE}
# 首次部署自动建表，部署完成后建议改为 false
DB_SYNCHRONIZE=true
# ====================================
# 找回密码邮件（可选）
# 留空 = 未配置 SMTP，找回密码链接写入 docker logs
# 主流参考：QQ smtp.qq.com:465 | 163 smtp.163.com:465
#          Gmail smtp.gmail.com:465 | Outlook smtp.office365.com:587
# ====================================
SMTP_HOST=${SMTP_HOST:-}
SMTP_PORT=${SMTP_PORT:-465}
SMTP_SECURE=${SMTP_SECURE:-true}
SMTP_USER=${SMTP_USER:-}
SMTP_PASS=${SMTP_PASS:-}
SMTP_FROM=${SMTP_FROM:-}
SMTP_REJECT_UNAUTHORIZED=${SMTP_REJECT_UNAUTHORIZED:-true}
# 找回密码链接中的根 URL（默认从 DOMAIN 推断）
PUBLIC_ADMIN_URL=${public_url}
EOF
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

# ====== 2a. 交互式收集配置（仅 -i 模式） ======
collect_config() {
    echo ""
    echo -e "${BOLD}==> 2/5 配置部署参数${NC}"

    # ----- 域名 -----
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

    # ----- JWT -----
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

    # ----- 默认管理员密码 -----
    echo ""
    echo -e "  ${CYAN}默认管理员密码：${NC}"
    echo -e "  ${BLUE}1) 自动生成（写入 .env.docker，请记下）${NC}"
    echo -e "  ${BLUE}2) 自定义（≥12 位）${NC}"
    echo -e "  ${BLUE}3) 留空，首次访问 /admin/setup 时自设（推荐：不会被任何人看到）${NC}"
    while true; do
        read -rp "  选择 [1/2/3，默认 1]: " admin_choice
        admin_choice="${admin_choice:-1}"
        case "$admin_choice" in
            1)
                DEFAULT_ADMIN_PASSWORD=$(rand 24)
                ok "已自动生成密码"
                break
                ;;
            2)
                while true; do
                    read -rp "  DEFAULT_ADMIN_PASSWORD (≥12位): " DEFAULT_ADMIN_PASSWORD
                    [ ${#DEFAULT_ADMIN_PASSWORD} -ge 12 ] && break
                    warn "长度至少 12 位"
                done
                break
                ;;
            3)
                DEFAULT_ADMIN_PASSWORD=""
                ok "已选择首次 /admin/setup 自设密码"
                break
                ;;
            *) warn "请输入 1 / 2 / 3" ;;
        esac
    done

    # ----- SMTP（可选） -----
    echo ""
    echo -e "  ${CYAN}找回密码邮件配置（可选，回车跳过）：${NC}"
    read -rp "  启用 SMTP？[y/N]: " smtp_choice
    if [[ "${smtp_choice:-N}" =~ ^[Yy]$ ]]; then
        read -rp "  SMTP_HOST (例 smtp.qq.com): " SMTP_HOST
        read -rp "  SMTP_PORT (默认 465): " SMTP_PORT
        SMTP_PORT="${SMTP_PORT:-465}"
        if [ "$SMTP_PORT" = "465" ] || [ "$SMTP_PORT" = "994" ]; then
            SMTP_SECURE_DEFAULT="true"
        else
            SMTP_SECURE_DEFAULT="false"
        fi
        read -rp "  SMTP_SECURE (true/false, 默认 $SMTP_SECURE_DEFAULT): " SMTP_SECURE
        SMTP_SECURE="${SMTP_SECURE:-$SMTP_SECURE_DEFAULT}"
        read -rp "  SMTP_USER (例 noreply@your-domain.com): " SMTP_USER
        read -rp "  SMTP_PASS (授权码 / 应用密码): " SMTP_PASS
        read -rp "  SMTP_FROM (默认 = SMTP_USER): " SMTP_FROM
        SMTP_FROM="${SMTP_FROM:-$SMTP_USER}"
        ok "SMTP 已配置：${SMTP_USER}@${SMTP_HOST}:${SMTP_PORT} (SSL=${SMTP_SECURE})"
    else
        SMTP_HOST=""
        SMTP_PORT="465"
        SMTP_SECURE="true"
        SMTP_USER=""
        SMTP_PASS=""
        SMTP_FROM=""
        ok "跳过 SMTP — 找回密码链接将写入 docker logs"
    fi

    # ----- PUBLIC_ADMIN_URL（可选） -----
    echo ""
    read -rp "  PUBLIC_ADMIN_URL (留空则取 https://${DOMAIN}): " PUBLIC_ADMIN_URL
    PUBLIC_ADMIN_URL="${PUBLIC_ADMIN_URL:-}"

    ACME_CA="https://acme.zerossl.com/v2/DV90"
    DB_USERNAME="homepage"
    DB_DATABASE="homepage"
    DB_ROOT_PASSWORD=$(rand 20)
    DB_PASSWORD=$(rand 20)
    info "数据库密码已自动生成"
}

# ====== 2b. 一键加载 / 生成配置（默认模式） ======
load_or_generate_env() {
    echo ""
    echo -e "${BOLD}==> 2/5 加载部署配置${NC}"

    local env_file=".env.docker"

    if [ -f "$env_file" ]; then
        info "检测到现有 .env.docker，正在加载..."
        load_env_file "$env_file"
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

        # SMTP 全部留空（无交互）
        SMTP_HOST=""
        SMTP_PORT="465"
        SMTP_SECURE="true"
        SMTP_USER=""
        SMTP_PASS=""
        SMTP_FROM=""
        SMTP_REJECT_UNAUTHORIZED="true"
        PUBLIC_ADMIN_URL="${PUBLIC_ADMIN_URL:-}"

        write_env_file "$env_file"
        load_env_file "$env_file"
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
    local proto
    proto=$(derive_proto "${DOMAIN:-localhost}")
    local root="${proto}://${DOMAIN}"
    local admin_url="${root}/admin/"
    local setup_url="${root}/admin/setup"
    local forgot_url="${root}/admin/forgot-password"

    echo ""
    echo -e "${GREEN}${BOLD}  ╔══════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}${BOLD}  ║          🎉 部署完成！                    ║${NC}"
    echo -e "${GREEN}${BOLD}  ╚══════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "  ${BOLD}📌  网站主页${NC}"
    echo -e "  ──────────────────────────────────"
    echo -e "  ${CYAN}${root}/${NC}"
    echo ""
    echo -e "  ${BOLD}📌  后台管理${NC}"
    echo -e "  ──────────────────────────────────"
    echo -e "  ${CYAN}${admin_url}${NC}"
    echo ""
    echo -e "  ${BOLD}📌  网站第一次初始化${NC}"
    echo -e "  ──────────────────────────────────"
    echo -e "  ${CYAN}${setup_url}${NC}"
    echo ""

    # 区分两种初始化路径
    if [ -n "${DEFAULT_ADMIN_PASSWORD:-}" ]; then
        echo -e "  ${YELLOW}${BOLD}⚠️   重要提示${NC}"
        echo -e "  ──────────────────────────────────"
        echo -e "  ① 访问 ${CYAN}${admin_url}${NC}  用下方管理员账号直接登录"
        echo -e "  ② 登录后会自动跳到初始化向导，走完 7 步"
        echo -e "  ③ 初始化完成后，进入 ${CYAN}账号设置${NC} → ${CYAN}修改密码${NC}，替换默认密码"
        echo ""
        echo -e "  ${BOLD}🔐  管理员账号${NC}"
        echo -e "  ──────────────────────────────────"
        echo -e "  用户名：    ${YELLOW}admin${NC}"
        echo -e "  密  码：    ${YELLOW}${DEFAULT_ADMIN_PASSWORD}${NC}"
        echo -e "  ${GREEN}(已写入 .env.docker，重启自动加载；切勿提交至 Git)${NC}"
    else
        echo -e "  ${YELLOW}${BOLD}⚠️   重要提示（首次 / 全新部署）${NC}"
        echo -e "  ──────────────────────────────────"
        echo -e "  系统当前 ${BOLD}没有${NC} 默认密码。需要 ${BOLD}先在页面上创建管理员账号${NC}："
        echo -e "  ① 访问 ${CYAN}${setup_url}${NC}  走完向导（${BOLD}第一步就是创建账号${NC}）"
        echo -e "  ② 用刚创建的账号登录 ${CYAN}${admin_url}${NC}"
        echo ""
        echo -e "  ${BOLD}🔐  管理员账号${NC}"
        echo -e "  ──────────────────────────────────"
        echo -e "  用户名：    ${YELLOW}首次 setup 时自定${NC}"
        echo -e "  ${GREEN}（DEFAULT_ADMIN_PASSWORD 在 .env.docker 中留空，账号只在数据库里）${NC}"
    fi

    echo ""
    echo -e "  ${BOLD}🗺   基本路由${NC}"
    echo -e "  ──────────────────────────────────"
    echo -e "  ${CYAN}${root}/${NC}                 →  网站主页（公开访问）"
    echo -e "  ${CYAN}${admin_url}${NC}          →  后台管理（需登录）"
    echo -e "  ${CYAN}${setup_url}${NC}     →  首次初始化向导（${BOLD}含创建管理员${NC}）"
    echo -e "  ${CYAN}${forgot_url}${NC}  →  找回密码"
    echo -e "  ${CYAN}${root}/admin/dashboard${NC}  →  后台仪表盘"
    echo -e "  ${CYAN}${root}/admin/account${NC}    →  账号设置（修改密码）"
    echo -e "  ${CYAN}${root}/api/${NC}              →  后端 API"
    echo -e "  ${CYAN}${root}/health${NC}            →  健康检查端点"

    # SMTP 状态提示
    echo ""
    if [ -n "${SMTP_HOST:-}" ] && [ -n "${SMTP_USER:-}" ]; then
        echo -e "  ${BOLD}📧  找回密码邮件${NC}"
        echo -e "  ──────────────────────────────────"
        echo -e "  ${GREEN}✓${NC} 已配置 SMTP：${SMTP_USER}@${SMTP_HOST}:${SMTP_PORT:-465}"
        echo -e "  忘记密码时会发送邮件到绑定邮箱"
    else
        echo -e "  ${BOLD}📧  找回密码邮件${NC}"
        echo -e "  ──────────────────────────────────"
        echo -e "  ${YELLOW}⚠${NC} 未配置 SMTP，找回密码链接会写入 docker logs："
        echo -e "     ${CYAN}docker logs homepage-app 2>&1 | grep -A 6 '密码重置请求'${NC}"
        echo -e "  后续可在 .env.docker 中补 SMTP_HOST / SMTP_USER / SMTP_PASS 后重启生效"
    fi

    echo ""
    echo -e "  ${BOLD}🛠   常用命令${NC}"
    echo -e "  ──────────────────────────────────"
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
        local env_file=".env.docker"
        write_env_file "$env_file"
        load_env_file "$env_file"
    else
        load_or_generate_env
    fi
    build_app
    start_services
    print_summary
}

main
