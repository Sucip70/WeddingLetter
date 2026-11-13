#!/usr/bin/env bash
# CI-only: validates configuration with dummy data, NEVER against server credentials.
set -euo pipefail
[[ "${CI:-}" == true ]] || { echo 'Run this validation on an isolated CI runner'; exit 1; }
repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
check_dir="$(mktemp -d)"
export POSTGRES_PASSWORD=validation_only API_IMAGE=example/api WEB_IMAGE=example/web
export TAG=production-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa STAGING_DOMAIN=staging.weddingletter.id
mkdir -p "$check_dir/production" "$check_dir/staging" "$check_dir/edge/nginx/templates" "$check_dir/edge/certs/staging" "$check_dir/edge/certs/production"
cp "$repo_root/deploy/production/docker-compose.yml" "$check_dir/production/"
cp "$repo_root/deploy/production/api.env.example" "$check_dir/production/api.env"
docker compose --env-file /dev/null -f "$check_dir/production/docker-compose.yml" config --quiet
cp "$repo_root/deploy/staging/docker-compose.yml" "$repo_root/deploy/staging/docker-compose.shared.yml" "$check_dir/staging/"
cp "$repo_root/deploy/staging/api.env.example" "$check_dir/staging/api.env"
docker compose --env-file /dev/null -f "$check_dir/staging/docker-compose.yml" config --quiet
docker compose --env-file /dev/null -f "$check_dir/staging/docker-compose.yml" -f "$check_dir/staging/docker-compose.shared.yml" config --quiet
cp "$repo_root/deploy/shared-edge/docker-compose.yml" "$check_dir/edge/"
cp "$repo_root/deploy/shared-edge/nginx/templates/"*.template "$check_dir/edge/nginx/templates/"
cp "$repo_root/deploy/staging/nginx/cloudflare-realip.conf" "$check_dir/edge/nginx/"
printf 'validation:not-a-real-password\n' > "$check_dir/edge/htpasswd"
openssl req -x509 -newkey rsa:2048 -nodes -subj /CN=validation.invalid -days 1 \
  -keyout "$check_dir/edge/certs/production/origin.key" -out "$check_dir/edge/certs/production/origin.pem" >/dev/null 2>&1
cp "$check_dir/edge/certs/production/"* "$check_dir/edge/certs/staging/"
for network in weddingletter-staging-ingress weddingletter-production-ingress; do
  docker network inspect "$network" >/dev/null 2>&1 || docker network create "$network" >/dev/null
done
docker compose --env-file /dev/null -f "$check_dir/edge/docker-compose.yml" config --quiet
# 'run' does not publish service ports. Templates and certificates are temporary CI fixtures.
docker compose --env-file /dev/null -f "$check_dir/edge/docker-compose.yml" run --rm --no-deps nginx nginx -t
for script in "$repo_root/deploy/production/deploy.sh" "$repo_root/deploy/staging/deploy.sh"; do bash -n "$script"; done
echo 'Compose, Nginx templates, and deployment shell syntax validated'
