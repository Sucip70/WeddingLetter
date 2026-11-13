#!/usr/bin/env bash
set -euo pipefail
umask 077

[[ "$(basename "$PWD")" == weddingletter-production ]] || { echo 'Run inside weddingletter-production'; exit 1; }
tag="${1:-}"
[[ "$tag" =~ ^production-[a-f0-9]{40}$ ]] || { echo 'Expected production-<40-character commit SHA>'; exit 1; }
[[ -f .env && -f api.env ]] || { echo 'Prepare .env and api.env first'; exit 1; }
exec 9>.deploy.lock
flock -n 9 || { echo 'Another production operation is running'; exit 1; }
export TAG="$tag"

# Refuse accidental use of staging credentials/configuration.
for key in APP_BASE_URL WEB_BASE_URL; do
  grep -Eq "^${key}=\"?https://weddingletter.id\"?$" api.env || { echo "Check production $key"; exit 1; }
done
grep -Eq '^R2_BUCKET_NAME="?weddingletter-production"?$' api.env || { echo 'Wrong production R2 bucket'; exit 1; }
grep -Eq '^MIDTRANS_IS_PRODUCTION="?true"?$' api.env || { echo 'Production must use live Midtrans configuration'; exit 1; }
docker network inspect weddingletter-production-ingress >/dev/null
[[ -n "$(docker ps -q --filter label=com.docker.compose.project=weddingletter-edge --filter label=com.docker.compose.service=nginx)" ]] || { echo 'Complete shared-edge cutover first'; exit 1; }
available_mb="$(df -Pm . | awk 'NR==2 {print $4}')"
(( available_mb >= 4096 )) || { echo 'Need at least 4 GiB free before deployment'; exit 1; }
docker compose config --quiet
docker compose pull api web

# Preserve the last known healthy release. No automatic database downgrade.
old_tag="$(sed -n 's/^TAG=//p' .env | tail -n 1)"
if [[ "$old_tag" =~ ^production-[a-f0-9]{40}$ ]]; then printf '%s\n' "$old_tag" > .previous-tag; fi
db_id="$(docker compose ps -aq postgres)"
if [[ -n "$db_id" ]]; then
  [[ "$(docker inspect -f '{{.State.Running}}' "$db_id")" == true ]] || { echo 'Existing database is stopped; recover and back it up before deployment'; exit 1; }
  mkdir -p backups
  backup="backups/predeploy-$(date -u +%Y%m%dT%H%M%SZ)-${tag}.dump"
  docker compose exec -T postgres pg_dump -U weddingletter -d weddingletter_production -Fc > "${backup}.partial"
  mv "${backup}.partial" "$backup"
  echo "Database backup created: $backup (copy it off-server)"
fi

# API entrypoint applies Prisma migrations. Recreating services may briefly interrupt requests.
docker compose up -d postgres api web
for service in api web; do
  ready=false
  for attempt in $(seq 1 40); do
    id="$(docker compose ps -q "$service")"
    if [[ -n "$id" && "$(docker inspect -f '{{.State.Health.Status}}' "$id")" == healthy ]]; then ready=true; break; fi
    sleep 3
  done
  if [[ "$ready" != true ]]; then
    docker compose logs --tail=80 "$service"
    echo "Deployment failed health checks. Inspect migrations before rolling back to .previous-tag."
    exit 1
  fi
done

# Persist the exact release so later compose/admin commands do not switch to a floating tag.
awk -v tag="$tag" '!/^TAG=/{print} END {print "TAG=" tag}' .env > .env.next
chmod 600 .env.next
mv .env.next .env
echo "Healthy production release: $tag"
