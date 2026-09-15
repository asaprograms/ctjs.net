#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ -e .env.production ]]; then
    echo ".env.production already exists" >&2
    exit 1
fi

umask 077
database_password="$(openssl rand -hex 32)"
root_password="$(openssl rand -hex 32)"
jwt_secret="$(openssl rand -hex 48)"

{
    printf 'DATABASE_URL=mysql://ctjs:%s@database:3306/ctjs\n' "$database_password"
    printf 'MYSQL_DATABASE=ctjs\n'
    printf 'MYSQL_USER=ctjs\n'
    printf 'MYSQL_PASSWORD=%s\n' "$database_password"
    printf 'MYSQL_ROOT_PASSWORD=%s\n' "$root_password"
    printf 'NEXT_PUBLIC_WEB_ROOT=https://ctjs.net\n'
    printf 'DISCORD_ANNOUNCE_CHANNEL_WEBHOOK=\n'
    printf 'DISCORD_VERIFY_CHANNEL_WEBHOOK=\n'
    printf 'JWT_SECRET=%s\n' "$jwt_secret"
    printf 'JWT_COOKIE_NAME=ctjs_session\n'
    printf 'MAILERSEND_API_KEY=\n'
    printf 'MAILERSEND_DOMAIN_ID=\n'
    printf 'MAILERSEND_VERIFICATION_TEMPLATE_ID=\n'
    printf 'MAILERSEND_PASSWORD_RESET_TEMPLATE_ID=\n'
    printf 'GITHUB_TOKEN=\n'
    printf 'REGISTRATION_ENABLED=false\n'
} > .env.production

echo "Created .env.production with registration disabled"
