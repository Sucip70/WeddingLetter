#!/usr/bin/env bash
set -euo pipefail
if [[ "${1:-}" != "--confirm-weddingletter-staging" ]]; then
  echo 'Usage: bash reset-database.sh --confirm-weddingletter-staging'
  exit 1
fi
[[ -f api.env && -f docker-compose.yml ]] || { echo 'Run inside the staging Compose directory'; exit 1; }
grep -Eq '^R2_BUCKET_NAME=weddingletter-staging\r?$' api.env || { echo 'Target bucket is not staging'; exit 1; }
grep -Eq '^APP_BASE_URL=https://staging\.weddingletter\.id\r?$' api.env || { echo 'Target application is not staging'; exit 1; }
[[ -n "${ADMIN_EMAIL:-}" ]] || { echo 'Set ADMIN_EMAIL'; exit 1; }
mkdir -p backups
chmod 700 backups
backup="backups/before-reset-$(date -u +%Y%m%dT%H%M%SZ).dump"
umask 077
docker compose exec -T postgres pg_dump -U weddingletter -d weddingletter -Fc > "$backup"
[[ -s "$backup" ]] || { echo 'Backup is empty'; exit 1; }
docker compose exec -T postgres pg_restore --list < "$backup" > /dev/null
docker compose stop web api
docker compose exec -T postgres psql -v ON_ERROR_STOP=1 -U weddingletter -d weddingletter -c 'DROP SCHEMA public CASCADE; CREATE SCHEMA public;'
docker compose run --rm -e ADMIN_EMAIL="$ADMIN_EMAIL" api npm run staging:bootstrap
docker compose up -d api web
echo "Fresh staging ready. Backup saved at $backup. Publish the local catalog next."
