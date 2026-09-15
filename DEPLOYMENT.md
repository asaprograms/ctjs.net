# Production deployment

## Requirements

- A Linux or WSL 2 host whose existing reverse proxy is reachable on TCP ports 80 and 443
- Docker Engine with the Compose plugin
- DNS for `ctjs.net`, `www.ctjs.net`, `api.ctjs.net`, and `downloads.ctjs.net`
- Cloudflare SSL mode set to Full (strict)

## Configuration

Copy `.env.production.example` to `.env.production` and replace every value marked `change-me`. Use a long random database password and a separate random JWT secret. Do not commit the production file.

Email and Discord webhook settings may be left empty for the first local smoke test. Public account registration should not open until email delivery is configured and tested.

## Start

From the repository root:

```text
docker compose --env-file .env.production up -d --build
```

The application binds only to `127.0.0.1:8083`. MySQL and uploaded module archives are stored in named volumes.

This WSL host already uses nginx for its public sites. Copy `deployment/nginx/ctjs.net.conf` to
`/etc/nginx/sites-available/ctjs.net`, enable it with a symlink in `sites-enabled`, run
`nginx -t`, and reload nginx only after the configuration test passes. The checked-in file uses
the host's existing origin certificate paths and is intended for Cloudflare Full (strict) mode.

If this repository is deployed on a dedicated host with no existing reverse proxy, start the
optional Caddy profile instead:

```text
docker compose --env-file .env.production --profile caddy up -d --build
```

## Updating

Pull a reviewed release tag, rebuild the application service, and inspect the service health before removing the previous image. Database migrations run during application startup.

## Backups

Back up the `database` and `module_storage` volumes before every deployment that includes a schema migration. Test restoration on a separate host. A database backup without module storage is incomplete.
