#!/usr/bin/env bash
# ===================================================
# homepage — 一键部署脚本 v3
# ===================================================
# 用法：
#   bash deploy.sh                       # 向导模式：逐一询问关键配置
#   DOMAIN=my.example.com bash deploy.sh # 跳过域名询问（其余仍交互）
#   CI=true bash deploy.sh               # CI 模式：全自动，无任何交互
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
    echo "  ║         homepage — 一键部署脚本 v3        ║"
    echo "  ║     全栈前后端分离首页管理系统              ║"
    echo "  ╚══════════════════════════════════════════╝"
    echo -e "${NC}"
}

ok()   { echo -e "  ${GREEN}✓${NC} $1"; }
warn() { echo -e "  ${YELLOW}⚠${NC} $1"; }
err()  { echo -e "  ${RED}✗${NC} $1"; }
info() { echo -e "  ${BLUE}→${NC} $1"; }

# ====== 参数解析 ======
CI_MODE=false
for arg in "$@"; do
    case "$arg" in
        -h|--help)
            sed -n '2,8p' "$0" | sed 's/^# \?//'
            exit 0
            ;;
        -i|--interactive)
            # 兼容旧版 -i 参数，等同于默认向导模式
            ;;
        *)
            err "未知参数: $arg  (使用 -h 查看帮助)"
            exit 1
            ;;
    esac
done
# CI 环境或显式 CI=true → 跳过所有交互
if [ "${CI:-false}" = "true" ]; then
    CI_MODE=true
fi

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

# ====== 2. 部署配置向导 ======
wizard() {
    echo ""
    echo -e "${BOLD}==> 2/5 部署配置${NC}"

    local env_file=".env.docker"
    local is_new=false

    if [ -f "$env_file" ]; then
        info "检测到现有 .env.docker，正在加载..."
        load_env_file "$env_file"
        ok "已加载"
    else
        is_new=true
    fi

    # ====== DOMAIN ======
    echo ""
    if [ -n "${DOMAIN:-}" ] && [ "$is_new" = false ]; then
        echo -e "  ${CYAN}域名${NC}    ${BOLD}${DOMAIN}${NC}  (从 .env.docker 读取，回车不变)"
        read -rp "  → 新域名留空跳过: " new_domain
        if [ -n "$new_domain" ]; then
            DOMAIN="$new_domain"
        fi
    elif [ -n "${DOMAIN:-}" ]; then
        ok "域名    ${BOLD}${DOMAIN}${NC}  (环境变量)"
    else
        echo -e "  ${BOLD}① 域名 / IP${NC}  (例 dageling003.top 或 1.2.3.4)"
        read -rp "  → DOMAIN: " DOMAIN
        DOMAIN="${DOMAIN:-localhost}"
    fi

    # ====== ACME_EMAIL ======
    if [[ "$DOMAIN" =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]] \
       || [[ "$DOMAIN" == "localhost" || "$DOMAIN" == "127.0.0.1" ]]; then
        warn "${DOMAIN} 仅 HTTP，无需 HTTPS 证书"
        ACME_EMAIL=""
    else
        echo ""
        local email_hint="${ACME_EMAIL:-}"
        [ -z "$email_hint" ] && email_hint="留空自动生成"
        echo -e "  ${BOLD}② HTTPS 证书邮箱${NC}  (当前: ${email_hint})"
        read -rp "  → ACME_EMAIL: " ACME_EMAIL_INPUT
        if [ -n "${ACME_EMAIL_INPUT:-}" ]; then
            ACME_EMAIL="$ACME_EMAIL_INPUT"
        elif [ "$is_new" = true ] && [ -z "${ACME_EMAIL:-}" ]; then
            ACME_EMAIL=""
        fi
    fi

    # ====== SMTP ======
    echo ""
    if [ -n "${SMTP_HOST:-}" ] && [ -n "${SMTP_USER:-}" ]; then
        echo -e "  ${GREEN}${BOLD}③ 邮件通知已配置${NC}   ${SMTP_USER} → ${SMTP_HOST}:${SMTP_PORT:-465}"
        read -rp "  → 重新配置？[y/N]: " smtp_redo
        if [[ ! "${smtp_redo:-N}" =~ ^[Yy]$ ]]; then
            true # keep existing
        else
            SMTP_HOST=""
        fi
    fi
    if [ -z "${SMTP_HOST:-}" ] || [ -z "${SMTP_USER:-}" ]; then
        echo -e "  ${BOLD}③ 邮件通知 (SMTP)${NC}"
        echo -e "  常用：QQ邮箱 smtp.qq.com:465 | 163 smtp.163.com:465"
        read -rp "  → 现在配置？[y/N]: " smtp_choice
        if [[ "${smtp_choice:-N}" =~ ^[Yy]$ ]]; then
            echo ""
            echo -e "  ${CYAN}SMTP 服务器${NC}"
            echo "  1) QQ邮箱     smtp.qq.com:465 (SSL)"
            echo "  2) 163邮箱    smtp.163.com:465 (SSL)"
            echo "  3) Gmail      smtp.gmail.com:465 (SSL)"
            echo "  4) 自定义"
            read -rp "  → 选择 [1/2/3/4]: " smtp_provider
            case "${smtp_provider:-1}" in
                1) SMTP_HOST="smtp.qq.com"; SMTP_PORT="465"; SMTP_SECURE="true" ;;
                2) SMTP_HOST="smtp.163.com"; SMTP_PORT="465"; SMTP_SECURE="true" ;;
                3) SMTP_HOST="smtp.gmail.com"; SMTP_PORT="465"; SMTP_SECURE="true" ;;
                4) read -rp "  → SMTP_HOST: " SMTP_HOST
                   read -rp "  → SMTP_PORT (默认 465): " SMTP_PORT
                   SMTP_PORT="${SMTP_PORT:-465}"
                   read -rp "  → SSL? [Y/n]: " smtp_ssl
                   SMTP_SECURE="$([[ "${smtp_ssl:-Y}" =~ ^[Nn]$ ]] && echo "false" || echo "true")"
                   ;;
            esac
            read -rp "  → 邮箱地址 (例 noreply@qq.com): " SMTP_USER
            SMTP_FROM="${SMTP_USER}"
            echo -e "  ${YELLOW}⚠ QQ/163 需用授权码，非登录密码${NC}"
            read -rp "  → SMTP 授权码: " SMTP_PASS
            ok "SMTP 已配置"
        else
            SMTP_HOST=""; SMTP_PORT="465"; SMTP_SECURE="true"
            SMTP_USER=""; SMTP_PASS=""; SMTP_FROM=""
            info "跳过 SMTP，找回密码链接写入 docker logs"
        fi
    fi
    SMTP_REJECT_UNAUTHORIZED="${SMTP_REJECT_UNAUTHORIZED:-true}"

    # ====== ADMIN PASSWORD ======
    echo ""
    echo -e "  ${BOLD}④ 管理员账号${NC}"
    if [ "$is_new" = true ]; then
        echo "  1) 自动生成密码（部署完成后在终端显示）"
        echo "  2) 自己设置密码 (≥12位)"
        echo "  3) 留空 — 首次访问网页 /admin/setup 时创建（推荐）"
        read -rp "  → 选择 [1/2/3，默认 3]: " admin_choice
        admin_choice="${admin_choice:-3}"
        case "$admin_choice" in
            1) DEFAULT_ADMIN_PASSWORD=$(rand 24) ;;
            2)
                while true; do
                    read -rp "  → 密码 (≥12位): " DEFAULT_ADMIN_PASSWORD
                    [ ${#DEFAULT_ADMIN_PASSWORD} -ge 12 ] && break
                    warn "至少 12 位"
                done
                ;;
            3) DEFAULT_ADMIN_PASSWORD="" ;;
        esac
    else
        [ -n "${DEFAULT_ADMIN_PASSWORD:-}" ] && echo -e "  ${GREEN}✓ 已有管理员密码${NC}" || echo -e "  管理员将在网页端创建"
    fi

    # ====== 自动生成项 ======
    ACME_CA="https://acme.zerossl.com/v2/DV90"
    JWT_SECRET="${JWT_SECRET:-$(rand 32)}"
    DB_ROOT_PASSWORD="${DB_ROOT_PASSWORD:-$(rand 20)}"
    DB_USERNAME="${DB_USERNAME:-homepage}"
    DB_PASSWORD="${DB_PASSWORD:-$(rand 20)}"
    DB_DATABASE="${DB_DATABASE:-homepage}"
    PUBLIC_ADMIN_URL="${PUBLIC_ADMIN_URL:-}"

    write_env_file "$env_file"
    load_env_file "$env_file"
    ok "配置完成"
    [ -n "${DEFAULT_ADMIN_PASSWORD:-}" ] && warn "管理员: admin / ${DEFAULT_ADMIN_PASSWORD}"
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

# ====== 5. 冒烟测试 ======
run_smoke_test() {
    echo ""
    echo -e "${BOLD}==> 5/6 冒烟测试${NC}"

    local proto
    proto=$(derive_proto "${DOMAIN:-localhost}")
    local target="${DOMAIN:-localhost}"

    echo -e "  ${BLUE}→${NC} 正在验证部署..."
    if [ -f scripts/smoke-test.sh ]; then
        if bash scripts/smoke-test.sh "$target"; then
            ok "冒烟测试通过"
        else
            warn "冒烟测试部分失败，请检查服务状态"
        fi
    else
        warn "smoke-test.sh 不存在，跳过冒烟测试"
    fi
}

# ====== 主流程 ======
main() {
    banner
    check_deps
    if [ "$CI_MODE" = true ]; then
        # CI 全自动模式：不交互，缺的用默认值
        DOMAIN="${DOMAIN:-localhost}"
        ACME_EMAIL="${ACME_EMAIL:-}"
        ACME_CA="https://acme.zerossl.com/v2/DV90"
        JWT_SECRET="${JWT_SECRET:-$(rand 32)}"
        DEFAULT_ADMIN_PASSWORD="${DEFAULT_ADMIN_PASSWORD:-$(rand 24)}"
        DB_ROOT_PASSWORD="${DB_ROOT_PASSWORD:-$(rand 20)}"
        DB_USERNAME="${DB_USERNAME:-homepage}"
        DB_PASSWORD="${DB_PASSWORD:-$(rand 20)}"
        DB_DATABASE="${DB_DATABASE:-homepage}"
        SMTP_HOST="${SMTP_HOST:-}"; SMTP_PORT="${SMTP_PORT:-465}"
        SMTP_SECURE="${SMTP_SECURE:-true}"; SMTP_USER="${SMTP_USER:-}"
        SMTP_PASS="${SMTP_PASS:-}"; SMTP_FROM="${SMTP_FROM:-}"
        SMTP_REJECT_UNAUTHORIZED="${SMTP_REJECT_UNAUTHORIZED:-true}"
        PUBLIC_ADMIN_URL="${PUBLIC_ADMIN_URL:-}"
        local env_file=".env.docker"
        if [ ! -f "$env_file" ]; then
            write_env_file "$env_file"
            load_env_file "$env_file"
            ok ".env.docker 已生成 (CI 模式)"
        else
            load_env_file "$env_file"
            ok "已加载 .env.docker (CI 模式)"
        fi
    else
        wizard
    fi
    build_app
    start_services
    run_smoke_test
    print_summary
}

main
