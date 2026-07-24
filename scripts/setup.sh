#!/usr/bin/env bash
# ===================================================
# homepage — 快速配置脚本
# ===================================================
# 用法：bash setup.sh
# ===================================================
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

ok()   { echo -e "  ${GREEN}✓${NC} $1"; }
warn() { echo -e "  ${YELLOW}⚠${NC} $1"; }
info() { echo -e "  ${CYAN}→${NC} $1"; }

echo -e "${CYAN}"
echo "  ╔══════════════════════════════════════════╗"
echo "  ║       homepage — 快速配置向导             ║"
echo "  ╚══════════════════════════════════════════╝"
echo -e "${NC}"

# 生成随机密码
rand() {
    openssl rand -base64 "$1" 2>/dev/null || cat /dev/urandom | tr -dc 'a-zA-Z0-9' | head -c"$1"
}

# 检测协议
derive_proto() {
    local d="${1:-localhost}"
    if [[ "$d" =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]] \
       || [[ "$d" == "localhost" || "$d" == "127.0.0.1" ]]; then
        echo "http"
    else
        echo "https"
    fi
}

ENV_FILE=".env.docker"

# 如果已存在配置文件，询问是否覆盖
if [ -f "$ENV_FILE" ]; then
    warn "检测到已有 .env.docker 配置文件"
    read -rp "  → 是否重新配置？[y/N]: " redo
    if [[ ! "${redo:-N}" =~ ^[Yy]$ ]]; then
        echo ""
        info "使用现有配置，跳过向导"
        info "如需修改，请手动编辑 $ENV_FILE"
        exit 0
    fi
fi

echo ""
echo -e "${BOLD}  ① 基础配置${NC}"
echo -e "  ──────────────────────────────────"

# 域名/IP
read -rp "  → 域名或 IP（如 192.168.1.100）: " DOMAIN
DOMAIN="${DOMAIN:-localhost}"
ok "DOMAIN: $DOMAIN"

# 协议检测
PROTO=$(derive_proto "$DOMAIN")
if [ "$PROTO" = "http" ]; then
    info "检测到 IP 地址，使用 HTTP 协议（无 HTTPS）"
else
    info "检测到域名，使用 HTTPS 协议"
fi

echo ""
echo -e "${BOLD}  ② 管理员账号${NC}"
echo -e "  ──────────────────────────────────"
echo "  1) 自动生成密码（推荐，部署后显示）"
echo "  2) 自己设置密码 (≥12位)"
echo "  3) 留空 — 首次访问网页时创建"
read -rp "  → 选择 [1/2/3，默认 3]: " ADMIN_CHOICE
ADMIN_CHOICE="${ADMIN_CHOICE:-3}"

case "$ADMIN_CHOICE" in
    1) DEFAULT_ADMIN_PASSWORD=$(rand 24) ;;
    2)
        while true; do
            read -rp "  → 密码 (≥12位): " DEFAULT_ADMIN_PASSWORD
            [ ${#DEFAULT_ADMIN_PASSWORD} -ge 12 ] && break
            warn "密码至少 12 位"
        done
        ;;
    *) DEFAULT_ADMIN_PASSWORD="" ;;
esac

echo ""
echo -e "${BOLD}  ③ 邮件通知（可选）${NC}"
echo -e "  ──────────────────────────────────"
read -rp "  → 是否配置 SMTP 邮件？[y/N]: " SMTP_CHOICE

SMTP_HOST=""
SMTP_PORT="465"
SMTP_SECURE="true"
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM=""

if [[ "${SMTP_CHOICE:-N}" =~ ^[Yy]$ ]]; then
    echo "  常用邮箱："
    echo "    1) QQ邮箱   smtp.qq.com:465"
    echo "    2) 163邮箱  smtp.163.com:465"
    echo "    3) Gmail    smtp.gmail.com:465"
    echo "    4) 自定义"
    read -rp "  → 选择 [1/2/3/4]: " SMTP_PROVIDER
    
    case "${SMTP_PROVIDER:-1}" in
        1) SMTP_HOST="smtp.qq.com" ;;
        2) SMTP_HOST="smtp.163.com" ;;
        3) SMTP_HOST="smtp.gmail.com" ;;
        4)
            read -rp "  → SMTP 服务器: " SMTP_HOST
            read -rp "  → 端口 (默认 465): " SMTP_PORT
            SMTP_PORT="${SMTP_PORT:-465}"
            ;;
    esac
    
    read -rp "  → 邮箱地址: " SMTP_USER
    SMTP_FROM="Homepage <${SMTP_USER}>"
    echo -e "  ${YELLOW}⚠ QQ/163 需使用授权码，非登录密码${NC}"
    read -rp "  → SMTP 授权码: " SMTP_PASS
    ok "SMTP 已配置"
fi

echo ""
echo -e "${BOLD}  ④ HTTPS 证书（仅域名需要）${NC}"
echo -e "  ──────────────────────────────────"

ACME_CA="https://acme.zerossl.com/v2/DV90"
ACME_EMAIL=""

if [ "$PROTO" = "https" ]; then
    read -rp "  → 证书邮箱（留空自动生成）: " ACME_EMAIL
    ACME_EMAIL="${ACME_EMAIL:-}"
fi

# 自动生成项
JWT_SECRET=$(rand 32)
# SEC-003: SETUP_TOKEN 必填 —— 生产环境 users 表为空且 SETUP_TOKEN 未设置时，
# 后端启动会直接拒绝，防止公网部署到你完成初始化之间的窗口期被抢注管理员。
SETUP_TOKEN=$(rand 24)
DB_ROOT_PASSWORD=$(rand 20)
DB_USERNAME="homepage"
DB_PASSWORD=$(rand 20)
DB_DATABASE="homepage"

# MariaDB 镜像源（默认使用 Docker Hub 镜像加速器）
MARIADB_IMAGE="docker.1ms.run/library/mariadb:11.4"

# 写入配置文件
cat > "$ENV_FILE" <<EOF
# homepage Docker 部署环境变量 — $(date '+%Y-%m-%d %H:%M:%S') 自动生成
# 域名或 IP
DOMAIN=${DOMAIN}

# JWT 密钥
JWT_SECRET=${JWT_SECRET}

# 首次部署管理员抢注防护 token（初始化完成后可以删除）
SETUP_TOKEN=${SETUP_TOKEN}

# 管理员密码（留空则通过网页创建）
DEFAULT_ADMIN_PASSWORD=${DEFAULT_ADMIN_PASSWORD}

# HTTPS 证书（IP 地址无需配置）
ACME_CA=${ACME_CA}
ACME_EMAIL=${ACME_EMAIL}

# 数据库配置
DB_ROOT_PASSWORD=${DB_ROOT_PASSWORD}
DB_USERNAME=${DB_USERNAME}
DB_PASSWORD=${DB_PASSWORD}
DB_DATABASE=${DB_DATABASE}

# MariaDB 镜像源（可选，默认使用阿里云中国镜像）
MARIADB_IMAGE=${MARIADB_IMAGE}

# 首次部署自动建表
DB_SYNCHRONIZE=true

# 邮件通知（可选）
SMTP_HOST=${SMTP_HOST}
SMTP_PORT=${SMTP_PORT}
SMTP_SECURE=${SMTP_SECURE}
SMTP_USER=${SMTP_USER}
SMTP_PASS=${SMTP_PASS}
SMTP_FROM=${SMTP_FROM}
SMTP_REJECT_UNAUTHORIZED=true
EOF

ok "配置文件已生成: $ENV_FILE"

echo ""
echo -e "${GREEN}${BOLD}  ╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}${BOLD}  ║          ✓ 配置完成！                    ║${NC}"
echo -e "${GREEN}${BOLD}  ╚══════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${BOLD}下一步：${NC}"
echo -e "  ──────────────────────────────────"
echo "  1. 构建并启动服务："
echo -e "     ${CYAN}docker compose --env-file .env.docker up -d --build${NC}"
echo ""
echo "  2. 访问管理后台："
PROTO=$(derive_proto "$DOMAIN")
echo -e "     ${CYAN}${PROTO}://${DOMAIN}/admin/setup${NC}"
echo ""
if [ -n "${DEFAULT_ADMIN_PASSWORD:-}" ]; then
    echo -e "  ${BOLD}管理员账号${NC}"
    echo -e "  ──────────────────────────────────"
    echo "  用户名: admin"
    echo -e "  密  码: ${YELLOW}${DEFAULT_ADMIN_PASSWORD}${NC}"
    echo ""
fi
