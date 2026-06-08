#!/bin/sh
# Caddy entrypoint — handles optional ACME_EMAIL
# If ACME_EMAIL is empty, remove the email directive so Caddy auto-generates one

if [ -z "${ACME_EMAIL:-}" ]; then
    sed -i '/email.*ACME_EMAIL/d' /etc/caddy/Caddyfile
fi

exec caddy run --config /etc/caddy/Caddyfile --adapter caddyfile
