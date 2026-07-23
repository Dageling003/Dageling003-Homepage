# Zero-Experience Deployment Guide (30 min from scratch to production)

> Written for readers with **zero Docker / zero Linux experience**. Every step is broken down; commands are copy-paste-ready.
>
> For the compact one-shot version, see [deployment.en.md](./deployment.en.md). This guide focuses on *what each step does, why, and how to recover from errors*.

---

## Table of contents

- [0. What you need](#0-what-you-need)
- [1. Get a server](#1-get-a-server)
- [2. SSH into the server](#2-ssh-into-the-server)
- [3. Install Docker (one command)](#3-install-docker-one-command)
- [4. Open ports & DNS (optional)](#4-open-ports--dns-optional)
- [5. Download the project](#5-download-the-project)
- [6. Generate .env.docker](#6-generate-envdocker)
- [7. Build & start](#7-build--start)
- [8. First visit: create the admin](#8-first-visit-create-the-admin)
- [9. Everyday commands](#9-everyday-commands)
- [10. Troubleshooting cookbook](#10-troubleshooting-cookbook)
- [11. Start over from scratch](#11-start-over-from-scratch)

---

## 0. What you need

| Item | Notes | Costs money? |
|------|-------|--------------|
| A cloud server | 2 vCPU / 2 GB RAM minimum; Ubuntu 22.04 / Debian 12 / Rocky 9 / AlmaLinux 9 / CentOS Stream 9 all work | Yes (student plans / lightweight instances are cheap, ~$15/year) |
| A domain (optional) | Needed only if you want a pretty URL + HTTPS lock | Yes (`.top` / `.xyz` start ~$1/year) |
| An SSH client | Windows 10/11 has built-in `ssh` in Terminal / PowerShell; macOS has Terminal | Free |
| Copy-paste hands | 90% of this guide is paste → enter | Free |

> **No domain, just want to try?** Fine — access via `http://your.server.ip` (no HTTPS padlock). Add a domain later by editing config and restarting.

---

## 1. Get a server

Pick **one**:

| Provider | Product | Notes |
|----------|---------|-------|
| Alibaba Cloud | Simple Application Server | Fast inside mainland China; requires real-name + ICP filing for domains (IP-only doesn't) |
| Tencent Cloud | Lighthouse | Same as above |
| Huawei Cloud | Flexus L | Same as above |
| Vultr / DigitalOcean / Racknerd / Hetzner | VPS | Overseas, no filing; credit card |

**Recommended options at checkout:**

- **OS image**: Debian family (`Ubuntu 22.04 LTS` / `Debian 12`) or RHEL family (`Rocky Linux 9` / `AlmaLinux 9` / `CentOS Stream 9`). This guide gives both `apt` and `dnf` commands; whenever they differ, the block is tagged **[Debian/Ubuntu]** or **[RHEL/CentOS/Rocky/AlmaLinux]**
- **Specs**: 2 vCPU + 2 GB RAM minimum; 1 GB works but is tight — you'll need swap
- **Bandwidth**: 3 Mbps is enough
- **Disk**: 40 GB or more
- **Region**: Mainland China nodes for CN visitors (ICP filing required); Hong Kong / Singapore / Japan for overseas or personal use (no filing)

After checkout you'll have **3 things**:

- Public IP (e.g. `123.45.67.89`)
- Login user (usually `root` or `ubuntu`)
- Password (or a key file `.pem` / `.ppk`)

**Note them down — you'll need them next.**

---

## 2. SSH into the server

### Windows

Press `Win + X` → pick "Windows Terminal" or "PowerShell":

```powershell
ssh root@123.45.67.89
```

Replace `123.45.67.89` with your IP. The first connect asks:

```
Are you sure you want to continue connecting (yes/no/[fingerprint])?
```

Type `yes`, hit Enter, then paste your password (**no characters will appear as you paste — that's normal**), Enter again.

You'll see a welcome banner:

```
# Debian / Ubuntu
Welcome to Ubuntu 22.04.4 LTS (GNU/Linux 5.15.0-...)
root@your-server:~#

# or RHEL / Rocky / AlmaLinux / CentOS Stream
Last login: ...
[root@your-server ~]#
```

### macOS / Linux

Open Terminal, same command: `ssh root@123.45.67.89`.

### Key-based instead of password?

```bash
ssh -i /path/to/your-key.pem root@123.45.67.89
```

---

## 3. Install Docker (recommended: use the project script)

Supported distros: Debian 11+ / Ubuntu 20.04+ / RHEL 8+ / CentOS Stream 8+ / Rocky 8+ / AlmaLinux 8+ / Fedora 38+.

### Option A: one command with the project script (**recommended**)

If §5 (project clone) isn't done yet, do it first:

```bash
# Install git (skip if already present)
# [Debian / Ubuntu]  apt update && apt install -y git
# [RHEL family]      dnf install -y git

cd /opt
git clone https://github.com/Dageling003/Dageling003-Homepage.git
cd Dageling003-Homepage
```

Then run the installer:

```bash
# Overseas nodes
bash scripts/install-docker.sh

# Mainland China nodes (Aliyun source + auto registry mirror)
bash scripts/install-docker.sh --cn

# Also add a non-root user to the docker group (skip sudo for docker)
bash scripts/install-docker.sh --cn --user ubuntu
```

The script handles 6 things automatically:

1. Detect the distro family (Debian vs RHEL)
2. Install `curl` / `ca-certificates` (RHEL 9 minimal often lacks curl)
3. Remove conflicting packages (`docker.io` / `podman-docker` / stale `runc`)
4. Call `get.docker.com` to install Engine + Compose plugin
5. `systemctl enable --now docker`; on RHEL with `firewalld`, restart docker so its iptables NAT rules survive
6. In `--cn` mode, write registry mirrors (`docker.1ms.run` + `docker.xuanyuan.me`) and set up log rotation

It finishes with a `hello-world` smoke test. If that passes, move on to §4.

### Option B: manual install via get.docker.com

```bash
# Prereqs (RHEL 9 minimal needs these)
# [Debian / Ubuntu]  apt update && apt install -y curl ca-certificates
# [RHEL family]      dnf install -y curl ca-certificates

# Install Docker
curl -fsSL https://get.docker.com | sh                            # overseas
curl -fsSL https://get.docker.com | sh -s docker --mirror Aliyun  # mainland China

# Enable & start
systemctl enable --now docker

# RHEL with firewalld: restart docker so iptables NAT rules re-apply
systemctl is-active --quiet firewalld && systemctl restart docker

# Non-root sudo-less usage (takes effect after re-login)
usermod -aG docker your-user
```

### Verify

```bash
docker --version
docker compose version
docker run --rm hello-world    # prints "Hello from Docker!" on success
```

No version output or `hello-world` failing? Jump to [10.3 Image pull failure](#103-image-pull-failure-pull-access-denied--failed-to-resolve-reference).

### Common gotchas

- **A few RHEL 8/9 images shipped `podman-docker`**: the official script errors out; `bash scripts/install-docker.sh` removes it automatically. In manual mode, run `dnf remove -y podman-docker` first.
- **Non-root user gets `permission denied` on `docker ps`**: add to the docker group or use `sudo`. After adding, **log out and back in** or run `newgrp docker`.
- **firewalld blocks container egress on RHEL**: `systemctl restart docker` rebuilds Docker's iptables NAT chains.

---

## 4. Open ports & DNS (optional)

Homepage serves on **80 (HTTP)** and **443 (HTTPS)**. Two layers of firewall need to allow them:

### 4.1 Cloud provider "Security Group" / "Firewall"

Log in to your provider's console → find the server → "Security Group" / "Firewall":

| Protocol | Port | Source | Purpose |
|----------|------|--------|---------|
| TCP | 22 | 0.0.0.0/0 | SSH (log in to server) |
| TCP | 80 | 0.0.0.0/0 | HTTP (website) |
| TCP | 443 | 0.0.0.0/0 | HTTPS (website + cert issuance) |

Alibaba calls it "Security Group rules", Tencent "Firewall", Huawei "Security Group" — all add-inbound-rule style.

### 4.2 OS firewall (often disabled by default on cloud VMs — you may skip)

**[Debian / Ubuntu]** if you've enabled `ufw`:

```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw reload
```

**[RHEL / CentOS Stream / Rocky / AlmaLinux]** — `firewalld` is enabled by default:

```bash
# First check whether firewalld is actually running
systemctl is-active firewalld
# active         → run the commands below
# inactive       → cloud VM has it disabled (common on Tencent/Alibaba/etc.), skip to 4.3
# unit not found → not installed, also skip to 4.3

firewall-cmd --permanent --add-service=ssh
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --reload

# verify
firewall-cmd --list-all
```

> If `firewall-cmd` is missing, or you see `FirewallD is not running`, the OS firewall isn't guarding anything — skip to 4.3. Your cloud provider's security group is already handling inbound rules.

### 4.3 Point your domain at the server (**only if you want HTTPS + a pretty URL**)

Log in to your **domain registrar** (Alibaba / Tencent / Cloudflare / Namesilo / …) → DNS records → add **A records**:

| Host | Type | Value | TTL |
|------|------|-------|-----|
| `@` | A | `123.45.67.89` (your IP) | default |
| `www` | A | `123.45.67.89` | default |

Wait **1–10 minutes** for DNS to propagate. Verify:

```bash
ping your-domain.com
```

The returned IP should match your server's public IP.

> **Domains in mainland China require ICP filing.** Without it the cloud provider blocks 80/443. While waiting on filing, use IP-only access or an overseas node.

---

## 5. Download the project

Install git (most distros don't ship it):

```bash
# [Debian / Ubuntu]
apt update && apt install -y git

# [RHEL / CentOS Stream / Rocky / AlmaLinux]
dnf install -y git
```

Clone:

```bash
cd /opt   # /opt is conventional; /root or /home are fine too
git clone https://github.com/Dageling003/Dageling003-Homepage.git
cd Dageling003-Homepage
```

If you see `docker-compose.yml` / `apps/` / `docs/` / `scripts/`, you're set.

---

## 6. Generate .env.docker

### Option A: interactive wizard (**recommended for beginners**)

```bash
bash scripts/setup.sh
```

Answers it collects:

1. **Domain or IP** → e.g. `your-domain.com` or your server's public IP
2. **Admin password** → three choices:
   - `1)` auto-generate (written to `.env.docker` and printed — **save it**)
   - `2)` type your own (≥ 12 chars)
   - `3)` leave empty (create via the web UI later)
3. **SMTP** → for password-reset emails; skippable (links land in `docker logs` instead)

Produces `.env.docker`.

### Option B: hand-edit (full control)

```bash
cp docker/.env.example .env.docker
nano .env.docker    # or vim .env.docker
```

Change at minimum:

```dotenv
# Domain or IP (required)
DOMAIN=your-domain.com

# JWT secret (required, ≥ 20 chars; generate below and paste)
JWT_SECRET=paste-what-openssl-prints

# Database passwords (required; also generated)
DB_ROOT_PASSWORD=paste-generated-value
DB_PASSWORD=paste-generated-value

# HTTPS cert notification email (fill if you have a domain; empty is ok for IP-only)
ACME_EMAIL=you@example.com

# Admin password (≥ 12 chars; empty means create via web UI later)
DEFAULT_ADMIN_PASSWORD=
```

**Generate random secrets** (run on the server, paste output back):

```bash
openssl rand -base64 32    # for JWT_SECRET
openssl rand -base64 24    # for each DB password (run twice)
```

`Ctrl + O` to save, `Ctrl + X` to exit nano.

---

## 7. Build & start

The one command that matters:

```bash
docker compose --env-file .env.docker up -d --build
```

**First build is slow** (pulls Node image, installs deps, compiles both frontends + backend) — expect **5–15 minutes**. Log spam is normal.

**Success looks like:**

```
 ✔ Container homepage-db     Healthy
 ✔ Container homepage-app    Healthy
 ✔ Container homepage-caddy  Started
```

**Verify:**

```bash
docker compose --env-file .env.docker ps
```

Three rows of `Up (healthy)` means everything's up.

### If app shows unhealthy?

```bash
docker logs homepage-app --tail 100
```

Take the error to the [troubleshooting cookbook](#10-troubleshooting-cookbook).

---

## 8. First visit: create the admin

On **your own laptop** (not the server), open a browser:

```
http://your-domain.com/admin/setup
```

(no domain? use `http://123.45.67.89/admin/setup`)

You'll see the **setup wizard**:

1. **Create admin account** (only if you left `DEFAULT_ADMIN_PASSWORD` empty)
   - Username: your choice (e.g. `admin`)
   - Password: **≥ 12 chars**, mix upper/lower/digits/symbols recommended
   - If `SETUP_TOKEN` is configured, an extra field will ask for the token — copy from `.env.docker`
2. **Site title** — browser tab text (e.g. `My Homepage`)
3. **Profile** — name, gender, birthday, region, school, occupation tag
4. **Quick links** — blog / GitHub / Bilibili / email / …
5. **Tech stack** — enter tech names (e.g. `Vue3`, `TypeScript`); the public site auto-matches colorful icons
6. **Typewriter lines** — hero greeting rotation (e.g. `Hi, I'm ...`)
7. **Todos** — plans to display publicly

**Each "Next" saves**; hit "Finish" on the last step.

Afterwards:

- `http://your-domain.com/` → public homepage
- `http://your-domain.com/admin/` → admin login using the account you just created

> **With a domain, Caddy issues an HTTPS cert automatically within 1–2 minutes.** Refresh and look for the padlock / `https://`.

---

## 9. Everyday commands

**Run everything from `/opt/Dageling003-Homepage`** (`cd /opt/Dageling003-Homepage`).

| I want to | Command |
|-----------|---------|
| Check service status | `docker compose --env-file .env.docker ps` |
| Tail backend logs (Ctrl+C to exit) | `docker compose --env-file .env.docker logs -f app` |
| Tail Caddy logs | `docker compose --env-file .env.docker logs -f caddy` |
| Restart everything | `docker compose --env-file .env.docker restart` |
| Restart backend only | `docker compose --env-file .env.docker restart app` |
| Stop all services | `docker compose --env-file .env.docker down` |
| Pull latest code & rebuild | `git pull && docker compose --env-file .env.docker up -d --build` |
| Back up the database | `bash scripts/backup-db.sh` (writes to `./backups/`) |
| Nightly backup at 02:00 | `crontab -e` → add `0 2 * * * cd /opt/Dageling003-Homepage && bash scripts/backup-db.sh` |
| Can't see the password-reset link? | `docker logs homepage-app 2>&1 \| grep -A 6 'password reset'` |

---

## 10. Troubleshooting cookbook

### 10.1 `dependency failed to start: container homepage-app is unhealthy`

Read the backend logs:

```bash
docker logs homepage-app --tail 100
```

Common patterns:

| Log keyword | Cause | Fix |
|-------------|-------|-----|
| `JWT_SECRET is not properly configured` | Missing or too-short `JWT_SECRET` in `.env.docker` | Regenerate with `openssl rand -base64 32`, then `docker compose --env-file .env.docker up -d` |
| `Access denied for user` / `ER_ACCESS_DENIED_ERROR` | DB password mismatch. **Usually because you edited `.env.docker` but the DB container kept the old password** | See 10.7 |
| `ECONNREFUSED mariadb:3306` | App raced ahead of DB startup | `docker compose --env-file .env.docker down` then `up -d` to reorder healthchecks |
| Container exits immediately with `Cannot find module '/app/dist/main.js'` | Build output path mismatch (pre-v1.2.0 bug) | `git pull` and `up -d --build` again |

### 10.2 HTTPS certificate fails (Caddy stuck on `obtaining certificate` or `unable to satisfy challenges`)

- ✅ Does DNS resolve to this host? On the server: `curl -s ifconfig.me` for your public IP, then `dig +short your-domain.com` (or `nslookup your-domain.com`) — they must match.
- ✅ Is port 80 open? Both the cloud security group and the OS firewall must allow it (ACME HTTP-01 challenge uses port 80).
- ✅ Is `ACME_EMAIL` set? ZeroSSL requires an email account; empty sometimes fails.
- ✅ Try switching CA. Edit `.env.docker`:
  ```dotenv
  ACME_CA=https://acme-v02.api.letsencrypt.org/directory
  ```
  Then `docker compose --env-file .env.docker restart caddy`.

### 10.3 Image pull failure (`pull access denied` / `failed to resolve reference`)

Common in China. Configure the Docker registry mirror (§3 tail) or switch MariaDB source in `.env.docker`:

```dotenv
MARIADB_IMAGE=mirrors.tuna.tsinghua.edu.cn/library/mariadb:11.4
```

Then:

```bash
docker compose --env-file .env.docker up -d
```

### 10.4 Port already in use (`bind: address already in use`)

Find who's on 80/443:

```bash
ss -tlnp | grep -E ':(80|443)\b'
```

If it's another nginx / apache / httpd, stop and disable it:

```bash
# [Debian / Ubuntu]
systemctl stop nginx apache2 2>/dev/null
systemctl disable nginx apache2 2>/dev/null

# [RHEL / CentOS Stream / Rocky / AlmaLinux]
systemctl stop nginx httpd 2>/dev/null
systemctl disable nginx httpd 2>/dev/null
```

### 10.5 Out-of-memory kills (`OOMKilled`)

Classic 1 GB problem — add swap:

```bash
# Portable (most distros support fallocate)
fallocate -l 2G /swapfile

# If fallocate errors (some XFS / older kernels do), use dd instead:
# dd if=/dev/zero of=/swapfile bs=1M count=2048

chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
free -h    # confirm Swap row is non-zero
```

> **Extra note for RHEL / Rocky / AlmaLinux**: if `swapon` errors with `Insecure permissions` or `swap file has holes`, your root disk is XFS — use the `dd` line above.

### 10.6 SELinux blocks container access to host directories [RHEL family only]

**Symptom**: containers start fine but reading/writing files under `/opt/Dageling003-Homepage` returns `Permission denied`; `docker logs` shows nothing app-level; `ausearch -m avc` or `journalctl -t setroubleshoot` reveals AVC denials.

By default Homepage puts all data in named volumes (`mariadb_data` / `app_uploads` / `caddy_data`), so **you usually don't hit this**. If you edited compose to use a bind mount (`- ./some/path:/xxx`), either add the `:z` / `:Z` suffix or set SELinux to permissive temporarily:

```bash
# Temporary (reverts on reboot): switch SELinux from enforcing to permissive
setenforce 0

# Persistent: edit /etc/selinux/config, change SELINUX=enforcing to SELINUX=permissive
sestatus    # verify
```

**Preferred**: keep SELinux on, add `:Z` (exclusive, container-only label) or `:z` (shared label) to bind mounts:

```yaml
volumes:
  - ./my-data:/data:Z
```

### 10.7 I changed the DB password in `.env.docker` and now nothing connects

**Because MariaDB baked the password into the `mariadb_data` volume on first launch — env var changes alone won't touch it.**

Two paths:

- **Discard data (haven't initialized yet)**: `docker compose --env-file .env.docker down -v` (`-v` **wipes the DB volume!**), then `up -d --build`
- **Keep data** — exec in and change the password:
  ```bash
  docker exec -it homepage-db mariadb -uroot -p<old-root-password>
  ```
  Inside the SQL prompt:
  ```sql
  ALTER USER 'homepage'@'%' IDENTIFIED BY 'new-password';
  FLUSH PRIVILEGES;
  EXIT;
  ```
  Sync `DB_PASSWORD` in `.env.docker`, then restart the app: `docker compose --env-file .env.docker restart app`.

### 10.8 I forgot the admin password

If you still have SSH: the web UI can't self-recover, but "Forgot password" works **if SMTP is configured**. Otherwise, delete the admin user and re-initialize:

```bash
docker exec -it homepage-db mariadb -uhomepage -p<DB_PASSWORD> homepage
```

```sql
DELETE FROM users WHERE username='admin';
EXIT;
```

Then set `DEFAULT_ADMIN_PASSWORD=at-least-12-chars` in `.env.docker` and restart the backend:

```bash
docker compose --env-file .env.docker restart app
```

The backend will recreate the admin on next boot.

### 10.9 Everything deployed fine, but the site returns 502 / Bad Gateway

Caddy is up but can't reach the App — App is either still starting or already dead.

```bash
docker compose --env-file .env.docker ps
docker logs homepage-app --tail 50
```

Then work through 10.1.

---

## 11. Start over from scratch

**Wipe code, keep data** (DB survives):

```bash
docker compose --env-file .env.docker down
```

**Wipe everything, including data** (**⚠️ database, uploads, certs — all gone**):

```bash
docker compose --env-file .env.docker down -v
```

**Also delete built images**:

```bash
docker compose --env-file .env.docker down -v --rmi all
```

Then start again from §6.

---

## Further reading

- Complete command / env-var reference → [deployment.en.md](./deployment.en.md)
- Want to change code / run locally → [dev-guide.en.md](./dev-guide.en.md)
- Understand the project layout → [architecture.en.md](./architecture.en.md)
- Anything not covered here → [GitHub Issues](https://github.com/Dageling003/Dageling003-Homepage/issues)
