# 小白傻瓜式部署教程（零基础 30 分钟上线）

> 面向零 Docker / 零 Linux 经验的读者。假设你只会用鼠标点，本教程把每一步能拆的都拆开，命令直接复制粘贴即可。
>
> 想看紧凑版一键部署，走 [deployment.md](./deployment.md)；本教程侧重"每一步在做什么、为什么这么做、报错怎么办"。

---

## 目录

- [0. 你需要准备什么](#0-你需要准备什么)
- [1. 买一台服务器](#1-买一台服务器)
- [2. SSH 连上服务器](#2-ssh-连上服务器)
- [3. 装 Docker（一条命令搞定）](#3-装-docker一条命令搞定)
- [4. 开放端口 & 解析域名（可选）](#4-开放端口--解析域名可选)
- [5. 把项目下载到服务器](#5-把项目下载到服务器)
- [6. 生成配置文件 .env.docker](#6-生成配置文件-envdocker)
- [7. 一键构建并启动](#7-一键构建并启动)
- [8. 首次访问：创建管理员](#8-首次访问创建管理员)
- [9. 日常维护命令](#9-日常维护命令)
- [10. 出问题了怎么办（避坑手册）](#10-出问题了怎么办避坑手册)
- [11. 我想推倒重来](#11-我想推倒重来)

---

## 0. 你需要准备什么

| 东西 | 说明 | 花钱吗 |
|------|------|--------|
| 一台云服务器 | 2 核 2G 内存 起步，Ubuntu 22.04 / Debian 12 / Rocky 9 / AlmaLinux 9 / CentOS Stream 9 都行 | 是（学生机 / 轻量应用服务器最便宜，一年 100 元档就够） |
| （可选）一个域名 | 想要 `xxx.com` 这种漂亮地址 + HTTPS 时才需要 | 是（`.top` / `.xyz` 首年 8 元起，续费贵一点） |
| SSH 客户端 | Windows 10/11 自带 `ssh`，直接用 PowerShell 或 Windows Terminal 即可；Mac 打开"终端"就行 | 免费 |
| 复制粘贴的手 | 本教程 90% 的操作是复制命令 → 粘贴 → 回车 | 免费 |

> **完全没有域名想先试试？** 也行，直接用服务器 IP 访问（例如 `http://1.2.3.4`），只是没有 HTTPS 小绿锁。之后想上域名再改配置重启就行。

---

## 1. 买一台服务器

推荐（**任选其一**）：

| 云厂商 | 产品名 | 备注 |
|--------|--------|------|
| 阿里云 | 轻量应用服务器 | 国内访问快，需实名 + 备案（域名需要备案，用 IP 不需要） |
| 腾讯云 | 轻量应用服务器 | 同上 |
| 华为云 | 耀云服务器 L 实例 | 同上 |
| Vultr / DigitalOcean / Racknerd | VPS | 海外，不需备案，信用卡付款 |

**买机器时的选项建议：**

- **系统镜像**：Debian 系（`Ubuntu 22.04 LTS` / `Debian 12`）或 RHEL 系（`Rocky Linux 9` / `AlmaLinux 9` / `CentOS Stream 9`）都可以。本教程 Debian 命令用 `apt`，RHEL 命令用 `dnf`，两套都给出；命令有区别的地方会明确标注 **[Debian/Ubuntu]** 或 **[RHEL/CentOS/Rocky/AlmaLinux]**
- **配置**：2 vCPU + 2 GB 内存起步；1G 内存也能跑但很紧张，需自己加 swap
- **带宽**：3 Mbps 起步够用
- **系统盘**：40 GB 起步
- **地区**：面向国内访客选大陆节点（需备案）；面向海外或纯自用选香港/新加坡/日本节点（不需备案）

买完后你会拿到 **3 样东西**：

- 服务器公网 IP（形如 `123.45.67.89`）
- 登录用户名（一般是 `root` 或 `ubuntu`）
- 登录密码（或密钥文件 `.pem` / `.ppk`）

**先记下来，下一步要用。**

---

## 2. SSH 连上服务器

### Windows 用户

按 `Win + X` → 选"Windows Terminal"或"PowerShell"，输入：

```powershell
ssh root@123.45.67.89
```

把 `123.45.67.89` 换成你自己的 IP。第一次连接会问：

```
Are you sure you want to continue connecting (yes/no/[fingerprint])?
```

输入 `yes` 回车，然后粘贴你的密码（**粘贴时看不到任何字符，是正常的，不是没输入进去**），再回车。

看到类似这样的欢迎语就成功了：

```
# Debian / Ubuntu
Welcome to Ubuntu 22.04.4 LTS (GNU/Linux 5.15.0-...)
root@your-server:~#

# 或 RHEL / Rocky / AlmaLinux / CentOS Stream
Last login: ...
[root@your-server ~]#
```

### Mac / Linux 用户

打开"终端"，同样运行 `ssh root@123.45.67.89`。

### 用密钥而不是密码？

```bash
ssh -i /path/to/your-key.pem root@123.45.67.89
```

---

## 3. 装 Docker（推荐用项目内脚本）

支持的发行版：Debian 11+ / Ubuntu 20.04+ / RHEL 8+ / CentOS Stream 8+ / Rocky 8+ / AlmaLinux 8+ / Fedora 38+。

### 方式 A：一条命令跑项目内脚本（**推荐**）

如果第 5 章还没做（还没 clone 项目），先克隆一下：

```bash
# 装 git（如已装可跳过）
# [Debian / Ubuntu]  apt update && apt install -y git
# [RHEL 系]          dnf install -y git

cd /opt
git clone https://github.com/Dageling003/Dageling003-Homepage.git
cd Dageling003-Homepage
```

然后跑脚本：

```bash
# 海外节点
bash scripts/install-docker.sh

# 国内节点（Aliyun 源 + 自动配 registry mirror）
bash scripts/install-docker.sh --cn

# 顺手把某个非 root 用户加入 docker 组（免 sudo 用 docker）
bash scripts/install-docker.sh --cn --user ubuntu
```

脚本会自动做这 6 件事：

1. 识别发行版（Debian 家族 vs RHEL 家族）
2. 装 `curl` / `ca-certificates` 前置依赖（RHEL 9 minimal 常缺）
3. 清掉冲突包（`docker.io` / `podman-docker` / 老版 `runc`）
4. 调 `get.docker.com` 官方脚本装 Engine + Compose plugin
5. `systemctl enable --now docker`；RHEL 系上遇到 `firewalld` 时自动重启 docker 让 NAT 规则重建
6. `--cn` 模式下写入 registry mirror（`docker.1ms.run` + `docker.xuanyuan.me`）并配好 log rotation

跑完自动执行 `hello-world` 冒烟测试，成功就能进第 4 章。

### 方式 B：不用脚本，手动走 get.docker.com

```bash
# 前置（RHEL 9 minimal 需要）
# [Debian / Ubuntu]  apt update && apt install -y curl ca-certificates
# [RHEL 系]          dnf install -y curl ca-certificates

# 装 Docker
curl -fsSL https://get.docker.com | sh              # 海外
curl -fsSL https://get.docker.com | sh -s docker --mirror Aliyun   # 国内

# 启动
systemctl enable --now docker

# RHEL 系如果有 firewalld，重启一次 docker 让 iptables NAT 规则重建
systemctl is-active --quiet firewalld && systemctl restart docker

# 非 root 用户免 sudo（重登才生效）
usermod -aG docker your-user
```

### 验证装好了

```bash
docker --version
docker compose version
docker run --rm hello-world    # 打印一段 "Hello from Docker!" 就通了
```

看不到版本号或 `hello-world` 报错，跳到 [10.3 镜像拉取失败](#103-镜像拉取失败pull-access-denied--failed-to-resolve-reference)。

### 常见坑

- **RHEL 8/9 少数镜像装过 `podman-docker`**：官方脚本会失败，`bash scripts/install-docker.sh` 会自动移除；手动模式需要先 `dnf remove -y podman-docker`
- **非 root 用户执行 `docker ps` 报 `permission denied`**：加入 docker 组或 `sudo docker`。加组后必须**重新登录 shell** 或跑 `newgrp docker`
- **RHEL 系装完 firewalld 拦截容器出网**：`systemctl restart docker` 让 Docker 重建 iptables NAT 规则

---

## 4. 开放端口 & 解析域名（可选）

Homepage 用 **80（HTTP）** 和 **443（HTTPS）** 对外提供服务。你需要打通两层网络：

### 4.1 云厂商"安全组" / "防火墙规则"

登录云厂商控制台 → 找到你的服务器 → "安全组" / "防火墙"：

| 协议 | 端口 | 来源 | 用途 |
|------|------|------|------|
| TCP | 22 | 0.0.0.0/0 | SSH（登录服务器） |
| TCP | 80 | 0.0.0.0/0 | HTTP（网站） |
| TCP | 443 | 0.0.0.0/0 | HTTPS（网站 + 证书申请） |

阿里云叫"安全组规则"、腾讯云叫"防火墙"、华为云叫"安全组"。都是加"入方向"规则。

### 4.2 系统防火墙（大多数云机默认没开，可跳过）

**[Debian / Ubuntu]** 如果你启用过 `ufw`：

```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw reload
```

**[RHEL / CentOS Stream / Rocky / AlmaLinux]** 系统默认启用 `firewalld`：

```bash
firewall-cmd --permanent --add-service=ssh
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --reload

# 验证已放行
firewall-cmd --list-all
```

> 如果 `firewall-cmd` 命令找不到，说明 firewalld 没装或没启用，直接跳到 4.3。

### 4.3 解析域名到服务器（**只有想用 HTTPS + 漂亮域名才需要**）

登录你的**域名注册商**（阿里云 / 腾讯云 / Cloudflare / Namesilo 等）→ 找到"域名解析" / "DNS Records" → 添加 **A 记录**：

| 主机记录 | 记录类型 | 记录值 | TTL |
|----------|----------|--------|-----|
| `@` | A | `123.45.67.89`（你的服务器 IP） | 默认 |
| `www` | A | `123.45.67.89` | 默认 |

保存后**等 1~10 分钟**让 DNS 生效。**验证生效：**

```bash
ping your-domain.com
```

看到返回的 IP 是你自己的服务器 IP 就成功了。

> **国内域名需要备案！** 否则 80/443 端口会被云厂商封禁。备案期间可用 IP 直连或用海外节点应急。

---

## 5. 把项目下载到服务器

装 git（大多数发行版默认没装）：

```bash
# [Debian / Ubuntu]
apt update && apt install -y git

# [RHEL / CentOS Stream / Rocky / AlmaLinux]
dnf install -y git
```

克隆项目：

```bash
cd /opt   # 放在 /opt 下比较规范，也可以放 /root、/home 你随意
git clone https://github.com/Dageling003/Dageling003-Homepage.git
cd Dageling003-Homepage
```

看到一堆文件（`docker-compose.yml` / `apps/` / `docs/` / `scripts/`），就下载成功了。

---

## 6. 生成配置文件 .env.docker

### 方式 A：跟着向导填（**推荐给纯小白**）

```bash
bash scripts/setup.sh
```

它会一步步问你：

1. **域名或 IP** → 有域名填 `your-domain.com`；没有就填服务器公网 IP
2. **管理员密码** → 三选一：
   - `1)` 自动生成（脚本会存进 `.env.docker` 并显示给你，**记下来**）
   - `2)` 手动输入（至少 12 位）
   - `3)` 留空（后面访问网站用图形界面创建）
3. **SMTP 邮件** → 用来发"忘记密码"邮件，不填也行（那时链接会写到日志里，你 SSH 上去看）

跑完会自动生成 `.env.docker` 文件。

### 方式 B：手动编辑（想全掌控）

```bash
cp docker/.env.example .env.docker
nano .env.docker    # 或 vim .env.docker
```

至少改这几行（其他保持默认）：

```dotenv
# 域名或 IP（必填）
DOMAIN=your-domain.com

# JWT 密钥（必填，≥ 20 位；下面命令生成一个粘贴进去）
JWT_SECRET=换成下面命令生成的字符串

# 数据库密码（必填，也用命令生成）
DB_ROOT_PASSWORD=换成生成的
DB_PASSWORD=换成生成的

# HTTPS 证书通知邮箱（有域名就填你的邮箱，用 IP 部署可留空）
ACME_EMAIL=you@example.com

# 管理员密码（≥ 12 位；留空则后面用网页创建）
DEFAULT_ADMIN_PASSWORD=
```

**生成随机密钥的命令**（在服务器上跑，把输出粘贴进 `.env.docker`）：

```bash
openssl rand -base64 32    # 用于 JWT_SECRET
openssl rand -base64 24    # 用于两个数据库密码，跑两次
```

`Ctrl + O` 保存，`Ctrl + X` 退出 nano。

---

## 7. 一键构建并启动

关键一步，一条命令：

```bash
docker compose --env-file .env.docker up -d --build
```

**第一次构建会慢**（要下载 Node 镜像、装依赖、编译前后端），大约 **5~15 分钟**，视网速和机器性能。你会看到刷屏的日志，都正常。

**看到这几行就成功了：**

```
 ✔ Container homepage-db     Healthy
 ✔ Container homepage-app    Healthy
 ✔ Container homepage-caddy  Started
```

**验证运行状态：**

```bash
docker compose --env-file .env.docker ps
```

三行 `Up (healthy)` 就说明服务全都活了。

### 如果 app 显示 unhealthy？

```bash
docker logs homepage-app --tail 100
```

拿报错去对照本文第 10 章"避坑手册"。

---

## 8. 首次访问：创建管理员

打开电脑浏览器（**不是服务器上的**，是你自己电脑的），输入：

```
http://your-domain.com/admin/setup
```

（没有域名的话用 `http://123.45.67.89/admin/setup`）

会看到一个 **设置向导页**，跟着一步步走：

1. **创建管理员账号**（如果你在 `.env.docker` 里留空了 `DEFAULT_ADMIN_PASSWORD`）
   - 用户名：自己起（比如 `admin`）
   - 密码：**至少 12 位**，建议大小写数字符号混合
   - 有 `SETUP_TOKEN` 的话在这一步会额外要你输入令牌，从 `.env.docker` 抄进去
2. **网站标题**：浏览器标签页显示的名字（例如 `鹊楠的主页`）
3. **个人信息**：姓名、性别、生日、省份、学校、职业标签
4. **快捷链接**：博客 / GitHub / B站 / 邮箱等
5. **技术栈**：填技术名字（如 `Vue3`、`TypeScript`），前台会自动匹配彩色图标
6. **打字机文字**：首页 hero 区轮播的欢迎语（比如 `Hi, I'm ...`）
7. **待办事项**：想公开展示的计划

**每步点"下一步"会保存**，最后一步点"完成设置"。

完成后访问：

- `http://your-domain.com/` → 你的主页
- `http://your-domain.com/admin/` → 后台登录，用刚创建的账号进去改配置

> **有域名的话，等 1-2 分钟 Caddy 会自动申请 HTTPS 证书**。刷新页面看地址栏是否出现小绿锁 / `https://` 前缀。

---

## 9. 日常维护命令

**所有命令都要在 `/opt/Dageling003-Homepage` 目录下跑**（`cd /opt/Dageling003-Homepage`）。

| 我想 | 命令 |
|------|------|
| 看服务是不是活着 | `docker compose --env-file .env.docker ps` |
| 看后端日志（Ctrl+C 退出） | `docker compose --env-file .env.docker logs -f app` |
| 看 Caddy 日志 | `docker compose --env-file .env.docker logs -f caddy` |
| 重启所有服务 | `docker compose --env-file .env.docker restart` |
| 只重启后端 | `docker compose --env-file .env.docker restart app` |
| 停掉所有服务 | `docker compose --env-file .env.docker down` |
| 更新到最新代码 | `git pull && docker compose --env-file .env.docker up -d --build` |
| 备份数据库 | `bash scripts/backup-db.sh` （备份到 `./backups/`） |
| 定时备份（每天凌晨 2 点） | `crontab -e` 加一行：`0 2 * * * cd /opt/Dageling003-Homepage && bash scripts/backup-db.sh` |
| 找回密码链接看不到？ | `docker logs homepage-app 2>&1 \| grep -A 6 '密码重置请求'` |

---

## 10. 出问题了怎么办（避坑手册）

### 10.1 `dependency failed to start: container homepage-app is unhealthy`

看后端日志找具体原因：

```bash
docker logs homepage-app --tail 100
```

常见几种：

| 日志关键字 | 原因 | 修法 |
|-----------|------|------|
| `JWT_SECRET is not properly configured` | `.env.docker` 里 JWT_SECRET 没设或太短 | 用 `openssl rand -base64 32` 生成一个新的填进去，然后 `docker compose --env-file .env.docker up -d` 重启 |
| `Access denied for user` / `ER_ACCESS_DENIED_ERROR` | 数据库密码不匹配。**通常是你改过 `.env.docker` 但数据库容器保留了旧密码** | 见 10.7 |
| `ECONNREFUSED mariadb:3306` | 数据库还没起来 App 就来连了 | 先 `docker compose --env-file .env.docker down`，再 `up -d`，让 healthcheck 重排 |
| 容器直接 Exited、无日志、只显示 `Cannot find module '/app/dist/main.js'` | 构建产物路径不对（v1.2.0 之前的老坑） | 拉最新代码 `git pull`，重新 `up -d --build` |

### 10.2 HTTPS 证书申请失败（Caddy 一直 `obtaining certificate` 或报 `unable to satisfy challenges`）

- ✅ DNS 是否解析到本机？在服务器上跑：`curl -s ifconfig.me` 拿到你的 IP，再跑 `dig +short your-domain.com` 或 `nslookup your-domain.com` 看是否一致。
- ✅ 80 端口是否开放？云厂商安全组 + 系统防火墙都要放行 80（ACME HTTP-01 挑战靠 80）
- ✅ `ACME_EMAIL` 是否填了？ZeroSSL 需要邮箱注册账号，不填有时会失败
- ✅ 试试切换证书颁发机构：编辑 `.env.docker` →
  ```dotenv
  ACME_CA=https://acme-v02.api.letsencrypt.org/directory
  ```
  然后 `docker compose --env-file .env.docker restart caddy`

### 10.3 镜像拉取失败（`pull access denied` / `failed to resolve reference`）

国内节点最常见。参考第 3 章末尾配 Docker 镜像加速器，或在 `.env.docker` 里切 MariaDB 镜像源：

```dotenv
MARIADB_IMAGE=mirrors.tuna.tsinghua.edu.cn/library/mariadb:11.4
```

保存后：

```bash
docker compose --env-file .env.docker up -d
```

### 10.4 端口被占用（`bind: address already in use`）

看看是谁占了 80/443：

```bash
ss -tlnp | grep -E ':(80|443)\b'
```

如果是别的 nginx / apache / httpd，停掉并禁用开机自启：

```bash
# [Debian / Ubuntu]
systemctl stop nginx apache2 2>/dev/null
systemctl disable nginx apache2 2>/dev/null

# [RHEL / CentOS Stream / Rocky / AlmaLinux]
systemctl stop nginx httpd 2>/dev/null
systemctl disable nginx httpd 2>/dev/null
```

### 10.5 内存不够，容器一直被 kill（`OOMKilled`）

1G 机器的通病。加 swap：

```bash
# 通用（大多数发行版都支持 fallocate）
fallocate -l 2G /swapfile

# 如果 fallocate 报错（部分 XFS / 老内核会），换 dd：
# dd if=/dev/zero of=/swapfile bs=1M count=2048

chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
free -h    # 验证 Swap 那一行不再是 0
```

> **RHEL / Rocky / AlmaLinux 额外注意**：如果 `swapon` 报 `Insecure permissions` 或 `swap file has holes`，说明系统盘是 XFS，请改用上面 `dd` 那行创建。

### 10.6 SELinux 挡住了容器读写宿主目录 [仅 RHEL 系]

**症状**：容器启动正常但读写 `/opt/Dageling003-Homepage` 下的文件报 `Permission denied`；`docker logs` 看不出应用层错误，`ausearch -m avc` 或 `journalctl -t setroubleshoot` 能看到 AVC 拒绝。

Homepage 项目默认所有数据都走 named volume（`mariadb_data` / `app_uploads` / `caddy_data`），**通常不会踩这个坑**。但如果你自己改了 compose 挂了 bind mount（`- ./some/path:/xxx`），要么给挂载加 `:z` / `:Z` 后缀，要么临时把 SELinux 设成 permissive：

```bash
# 临时（重启失效）：把 SELinux 从 enforcing 切到 permissive
setenforce 0

# 永久：编辑 /etc/selinux/config，把 SELINUX=enforcing 改成 SELINUX=permissive
sestatus    # 验证
```

**更推荐**：不要关 SELinux，把 bind mount 加 `:Z`（独占，容器专用标签）或 `:z`（共享标签）：

```yaml
volumes:
  - ./my-data:/data:Z
```

### 10.7 我改了 `.env.docker` 里的数据库密码，重启后连不上

**因为数据库容器第一次启动时把密码写进了数据卷 `mariadb_data`，之后改环境变量没用。**

两条路：

- **不想留数据（还没初始化过）**：`docker compose --env-file .env.docker down -v` （`-v` 会把数据库卷一起删！），然后 `up -d --build`
- **要保留数据**：进容器手动改 MariaDB 密码：
  ```bash
  docker exec -it homepage-db mariadb -uroot -p<旧的root密码>
  ```
  在 SQL 提示符里：
  ```sql
  ALTER USER 'homepage'@'%' IDENTIFIED BY '新密码';
  FLUSH PRIVILEGES;
  EXIT;
  ```
  然后同步 `.env.docker` 里的 `DB_PASSWORD`，重启 app：`docker compose --env-file .env.docker restart app`

### 10.8 忘了管理员密码

如果你还有服务器 SSH：进后台没法自助，但可以走"忘记密码"（前提是配了 SMTP）；否则直接删掉 admin 用户重新初始化：

```bash
docker exec -it homepage-db mariadb -uhomepage -p<DB_PASSWORD> homepage
```

```sql
DELETE FROM users WHERE username='admin';
EXIT;
```

然后在 `.env.docker` 设一个 `DEFAULT_ADMIN_PASSWORD=至少12位新密码`，重启后端：

```bash
docker compose --env-file .env.docker restart app
```

后端启动会自动用新密码建 admin。

### 10.9 首次部署一切正常，但访问网站显示 502 / Bad Gateway

Caddy 起来了但连不上 App。基本就是 App 还在启动或已经挂了。

```bash
docker compose --env-file .env.docker ps
docker logs homepage-app --tail 50
```

按 10.1 排查。

---

## 11. 我想推倒重来

**只清代码不清数据**（数据库还在）：

```bash
docker compose --env-file .env.docker down
```

**连数据一起清**（**⚠️ 数据库、上传文件、证书全没**）：

```bash
docker compose --env-file .env.docker down -v
```

**连镜像都删掉，从零开始拉**：

```bash
docker compose --env-file .env.docker down -v --rmi all
```

之后重新走第 6 章开始就行。

---

## 更多

- 命令、环境变量的完整版说明 → [deployment.md](./deployment.md)
- 想改代码 / 本地跑 → [dev-guide.md](./dev-guide.md)
- 想理解项目结构 → [architecture.md](./architecture.md)
- 遇到本教程没覆盖的问题，欢迎去 [GitHub Issues](https://github.com/Dageling003/Dageling003-Homepage/issues) 提问
