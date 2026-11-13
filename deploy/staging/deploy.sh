#!/usr/bin/env bash
set -euo pipefail
umask 077
[[ "$(basename "$PWD")" == weddingletter-staging ]] || { echo 'Run inside weddingletter-staging'; exit 1; }
tag="${1:-}"
[[ "$tag" =~ ^staging-[a-f0-9]{40}$ ]] || { echo 'Expected staging-<40-character SHA>'; exit 1; }
exec 9>.deploy.lock
flock -n 9 || { echo 'Another staging operation is running'; exit 1; }
export TAG="$tag"
shared=false
if grep -qx 'COMPOSE_FILE=docker-compose.yml:docker-compose.shared.yml' .env; then shared=true; fi
docker compose config --quiet
docker compose pull api web
if [[ "$shared" == true ]]; then
  docker network inspect weddingletter-staging-ingress >/dev/null
  docker compose up -d postgres api web
else
  docker compose run --rm --no-deps nginx nginx -t
  docker compose up -d --remove-orphans
  docker compose up -d --no-deps --force-recreate nginx
fi
for attempt in $(seq 1 40); do
  id="$(docker compose ps -q api)"
  if [[ -n "$id" && "$(docker inspect -f '{{.State.Health.Status}}' "$id")" == healthy ]]; then
    awk -v tag="$tag" '!/^TAG=/{print} END {print "TAG=" tag}' .env > .env.next
    chmod 600 .env.next
    mv .env.next .env
    echo "Healthy staging release: $tag"
    exit 0
  fi
  sleep 3
done
docker compose logs --tail=80 api
exit 1
