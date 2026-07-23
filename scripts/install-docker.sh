#!/usr/bin/env bash
# ===================================================
# homepage — Docker + Docker Compose 一键安装脚本
# ===================================================
# 用法：
#   bash scripts/install-docker.sh              # 默认（海外源）
#   bash scripts/install-docker.sh --cn         # 国内节点，走 Aliyun / USTC
#   bash scripts/install-docker.sh --user alice # 把非 root 用户加入 docker 组
#
# 支持的发行版：
#   Debian 11+, Ubuntu 20.04+, RHEL 8/9, CentOS Stream 8/9,
#   Rocky Linux 8/9, AlmaLinux 8/9, Fedora 38+
# ===================================================
set -euo pipefail

# ---------- 颜色 ----------
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'
ok()   { echo -e "  ${GREEN}✔${NC} $1"; }
warn() { echo -e "  ${YELLOW}!${NC} $1"; }
info() { echo -e "  ${CYAN}i${NC} $1"; }
err()  { echo -e "  ${RED}✘${NC} $1" >&2; }
step() { echo; echo -e "${BOLD}${CYAN}==>${NC} ${BOLD}$1${NC}"; }

# ---------- 参数 ----------
USE_CN_MIRROR=false
DOCKER_USER=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --cn)          USE_CN_MIRROR=true; shift ;;
    --user)        DOCKER_USER="${2:-}"; shift 2 ;;
    -h|--help)
      sed -n '2,15p' "$0"; exit 0 ;;
    *) err "未知参数：$1"; exit 2 ;;
  esac
done

# ---------- 必须 root ----------
if [[ $EUID -ne 0 ]]; then
  if command -v sudo >/dev/null 2>&1; then
    warn "非 root 执行，重新以 sudo 提升权限…"
    exec sudo -E bash "$0" "$@"
  else
    err "需要 root 权限，请用 sudo 或 root 执行。"; exit 1
  fi
fi

echo -e "${CYAN}"
echo "  ╔══════════════════════════════════════════╗"
echo "  ║   Docker + Docker Compose 一键安装脚本   ║"
echo "  ╚══════════════════════════════════════════╝"
echo -e "${NC}"

# ============================================================
# Step 1: 识别发行版
# ============================================================
step "1/6  识别发行版"

if [[ ! -f /etc/os-release ]]; then
  err "找不到 /etc/os-release，无法识别系统"; exit 1
fi
# shellcheck disable=SC1091
. /etc/os-release
OS_ID="${ID:-unknown}"
OS_LIKE="${ID_LIKE:-}"
OS_NAME="${PRETTY_NAME:-$OS_ID}"

case "$OS_ID" in
  ubuntu|debian) PKG_FAMILY="debian" ;;
  rhel|centos|rocky|almalinux|fedora|ol) PKG_FAMILY="rhel" ;;
  *)
    if [[ "$OS_LIKE" == *debian* ]];  then PKG_FAMILY="debian"
    elif [[ "$OS_LIKE" == *rhel* || "$OS_LIKE" == *fedora* ]]; then PKG_FAMILY="rhel"
    else err "不支持的发行版：$OS_NAME"; exit 1
    fi
    ;;
esac
ok "识别到 $OS_NAME (family=$PKG_FAMILY)"
$USE_CN_MIRROR && info "启用国内镜像源"

# ============================================================
# Step 2: 前置依赖（curl / ca-certificates）
# ============================================================
step "2/6  安装前置依赖"

if [[ "$PKG_FAMILY" == "debian" ]]; then
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -qq
  apt-get install -y -qq curl ca-certificates >/dev/null
else
  # RHEL 系 minimal 镜像常缺 curl
  dnf install -y -q curl ca-certificates >/dev/null 2>&1 \
    || yum install -y -q curl ca-certificates >/dev/null
fi
ok "curl / ca-certificates 就绪"

# ============================================================
# Step 3: 处理已存在的冲突（旧 docker.io / podman-docker / runc）
# ============================================================
step "3/6  清理冲突包"

if [[ "$PKG_FAMILY" == "debian" ]]; then
  # 旧发行版可能有 docker.io / docker-engine / docker-doc（distro 自带、非官方）
  for pkg in docker.io docker-doc docker-compose docker-compose-v2 podman-docker containerd runc; do
    if dpkg -s "$pkg" >/dev/null 2>&1; then
      warn "移除旧包：$pkg"
      apt-get remove -y -qq "$pkg" >/dev/null || true
    fi
  done
else
  for pkg in docker docker-client docker-common docker-latest docker-latest-logrotate \
             docker-logrotate docker-engine podman-docker runc; do
    if rpm -q "$pkg" >/dev/null 2>&1; then
      warn "移除旧包：$pkg"
      dnf remove -y -q "$pkg" >/dev/null 2>&1 || yum remove -y -q "$pkg" >/dev/null || true
    fi
  done
fi
ok "冲突包已清理"

# ============================================================
# Step 4: 通过 get.docker.com 官方脚本安装
# ============================================================
step "4/6  安装 Docker Engine + Compose plugin"

# 已装则跳过（idempotent）
if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  ok "Docker 已安装，跳过 —— $(docker --version)"
else
  # 清理残留 repo，避免多次尝试互相污染
  cleanup_broken_repo() {
    if [[ "$PKG_FAMILY" == "rhel" ]]; then
      rm -f /etc/yum.repos.d/docker-ce.repo /etc/yum.repos.d/docker-ce-staging.repo
      dnf clean all -q >/dev/null 2>&1 || yum clean all -q >/dev/null 2>&1 || true
    else
      rm -f /etc/apt/sources.list.d/docker.list /etc/apt/keyrings/docker.asc 2>/dev/null || true
    fi
  }

  # ----- RHEL 家族：直接手动配 centos repo，跳过 get.docker.com 的 rocky/ 路径 -----
  # 原因：
  #   1) Aliyun 只有 centos/ 路径，rocky/ 路径 404
  #   2) upstream download.docker.com/linux/rocky/ 部分 IP 只返回 repodata、
  #      不返回实际 rpm，导致 "Unable to find a match"
  # Rocky / AlmaLinux / CentOS Stream 与 CentOS 二进制兼容，用 centos repo 完全 OK。
  install_rhel_from_repo() {
    local repo_url="$1"
    local repo_label="$2"
    cleanup_broken_repo
    info "尝试 $repo_label：$repo_url"
    dnf install -y -q dnf-plugins-core >/dev/null 2>&1 || true
    if ! dnf config-manager --add-repo "$repo_url" >/dev/null 2>&1; then
      warn "$repo_label 添加 repo 失败"
      return 1
    fi
    if ! dnf makecache -q >/dev/null 2>&1; then
      warn "$repo_label makecache 失败"
      return 1
    fi
    if dnf install -y -q docker-ce docker-ce-cli containerd.io \
         docker-buildx-plugin docker-compose-plugin; then
      return 0
    fi
    warn "$repo_label 安装包失败"
    return 1
  }

  install_debian_via_script() {
    local mirror_arg="${1:-}"
    local tmp; tmp="$(mktemp)"
    curl -fsSL --retry 3 --retry-delay 2 -o "$tmp" https://get.docker.com || return 1
    if [[ -n "$mirror_arg" ]]; then
      sh "$tmp" --mirror "$mirror_arg"; local rc=$?
    else
      sh "$tmp"; local rc=$?
    fi
    rm -f "$tmp"
    return $rc
  }

  install_ok=false

  if [[ "$PKG_FAMILY" == "rhel" ]]; then
    # 定义候选源（按顺序尝试，直到成功）
    if $USE_CN_MIRROR; then
      REPOS=(
        "https://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo|Aliyun (centos)"
        "https://mirrors.tuna.tsinghua.edu.cn/docker-ce/linux/centos/docker-ce.repo|TUNA (centos)"
        "https://mirrors.ustc.edu.cn/docker-ce/linux/centos/docker-ce.repo|USTC (centos)"
        "https://download.docker.com/linux/centos/docker-ce.repo|upstream (centos)"
      )
    else
      REPOS=(
        "https://download.docker.com/linux/centos/docker-ce.repo|upstream (centos)"
        "https://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo|Aliyun (centos)"
      )
    fi
    for entry in "${REPOS[@]}"; do
      url="${entry%%|*}"
      label="${entry##*|}"
      if install_rhel_from_repo "$url" "$label"; then
        install_ok=true
        break
      fi
    done
  else
    # Debian / Ubuntu 走 get.docker.com（该脚本对 debian/ubuntu 稳定）
    info "下载 get.docker.com 脚本…"
    if $USE_CN_MIRROR; then
      install_debian_via_script "Aliyun" && install_ok=true
      if ! $install_ok; then
        warn "Aliyun 源失败，回退到官方源"
        cleanup_broken_repo
        install_debian_via_script "" && install_ok=true
      fi
    else
      install_debian_via_script "" && install_ok=true
      if ! $install_ok; then
        warn "官方源失败，自动回退 Aliyun 镜像"
        cleanup_broken_repo
        install_debian_via_script "Aliyun" && install_ok=true
      fi
    fi
  fi

  if ! $install_ok; then
    err "所有候选源均安装失败，请检查网络或手动排查"
    exit 1
  fi
  ok "Docker Engine 安装完成"
fi

# ============================================================
# Step 5: 启动 docker，处理 firewalld 与用户组
# ============================================================
step "5/6  启动 Docker 服务"

systemctl enable --now docker
ok "docker.service 已启用并启动"

# RHEL 系：firewalld 可能吃掉 Docker 的 iptables NAT
if [[ "$PKG_FAMILY" == "rhel" ]] && systemctl is-active --quiet firewalld 2>/dev/null; then
  info "检测到 firewalld 启用，重启 docker 以重建 iptables NAT 规则"
  systemctl restart docker || true
fi

# 把指定用户加入 docker 组（可选）
if [[ -n "$DOCKER_USER" ]]; then
  if id "$DOCKER_USER" >/dev/null 2>&1; then
    usermod -aG docker "$DOCKER_USER"
    ok "已把 $DOCKER_USER 加入 docker 组"
    warn "该用户需重新登录 shell（或执行 'newgrp docker'）后免 sudo 使用 docker"
  else
    err "用户 $DOCKER_USER 不存在，跳过"
  fi
fi

# ============================================================
# Step 6: 可选 —— 配置 registry mirror（国内节点强烈推荐）
# ============================================================
step "6/6  registry mirror 配置"

DAEMON_JSON=/etc/docker/daemon.json
if $USE_CN_MIRROR; then
  if [[ -f "$DAEMON_JSON" ]] && grep -q "registry-mirrors" "$DAEMON_JSON"; then
    info "$DAEMON_JSON 已配置 registry-mirrors，跳过"
  else
    mkdir -p /etc/docker
    if [[ -f "$DAEMON_JSON" ]]; then
      cp "$DAEMON_JSON" "${DAEMON_JSON}.bak.$(date +%s)"
      warn "已备份现有 daemon.json"
    fi
    cat > "$DAEMON_JSON" <<'EOF'
{
  "registry-mirrors": [
    "https://docker.1ms.run",
    "https://docker.xuanyuan.me"
  ],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "20m",
    "max-file": "3"
  }
}
EOF
    systemctl daemon-reload
    systemctl restart docker
    ok "已写入 registry-mirrors 并重启 docker"
  fi
else
  info "海外模式，跳过 registry mirror（如需配置，加 --cn 重跑）"
fi

# ============================================================
# 验证
# ============================================================
echo
echo -e "${BOLD}${GREEN}══════════════ 安装完成 ══════════════${NC}"
echo
DOCKER_VER="$(docker --version 2>/dev/null || echo '未知')"
COMPOSE_VER="$(docker compose version --short 2>/dev/null || echo '未知')"
echo -e "  ${BOLD}Docker:${NC}         $DOCKER_VER"
echo -e "  ${BOLD}Docker Compose:${NC} $COMPOSE_VER"
echo

info "运行 hello-world 冒烟测试（可 Ctrl+C 跳过）…"
if timeout 30 docker run --rm hello-world >/dev/null 2>&1; then
  ok "hello-world 通过，Docker 运转正常"
else
  warn "hello-world 未成功（网络受限或超时），但引擎已装好"
fi

echo
info "下一步："
echo "    cd 到项目目录，编辑 .env.docker，然后："
echo "      docker compose --env-file .env.docker up -d --build"
echo
