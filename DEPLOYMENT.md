# Production deployment

## Requirements

- A Linux or WSL 2 host reachable on TCP ports 80 and 443
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

Caddy obtains and renews certificates, then routes every configured hostname to the application. MySQL and uploaded module archives are stored in named volumes.

## Updating

Pull a reviewed release tag, rebuild the application service, and inspect the service health before removing the previous image. Database migrations run during application startup.

## Backups

Back up the `database` and `module_storage` volumes before every deployment that includes a schema migration. Test restoration on a separate host. A database backup without module storage is incomplete.
