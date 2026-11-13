const { readFileSync } = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const read = (file) => readFileSync(path.join(__dirname, '..', file), 'utf8');

test('production is manually dispatched and restricted to the production branch', () => {
  const workflow = read('.github/workflows/production.yml');
  const triggers = workflow.split('on:')[1].split('concurrency:')[0];
  assert.match(triggers, /workflow_dispatch:/);
  assert.doesNotMatch(triggers, /\bpush:/);
  assert.match(workflow, /test "\$GITHUB_REF" = refs\/heads\/production/);
  assert.match(workflow, /DEPLOY PRODUCTION/);
  assert.match(workflow, /environment: production/);
  assert.match(workflow, /PRODUCTION_SSH_KNOWN_HOSTS/);
  assert.match(workflow, /StrictHostKeyChecking=yes/);
});

test('staging and production deployments cannot run concurrently on this VPS', () => {
  for (const env of ['production', 'staging']) {
    assert.match(read(`.github/workflows/${env}.yml`), /group: weddingletter-vps/);
    assert.match(read(`.github/workflows/${env}.yml`), /cancel-in-progress: false/);
  }
});

test('only the shared edge publishes host ports; production database is isolated', () => {
  const compose = read('deploy/production/docker-compose.yml');
  assert.doesNotMatch(compose, /\n\s+ports:/);
  assert.match(compose, /name: weddingletter-production\n/);
  assert.match(compose, /POSTGRES_DB: weddingletter_production/);
  assert.match(compose, /weddingletter-production-ingress/);
  assert.doesNotMatch(compose.split('  api:')[0], /ingress:/);
  const edge = read('deploy/shared-edge/docker-compose.yml');
  assert.match(edge, /"80:80"/);
  assert.match(edge, /"443:443"/);
  assert.match(edge, /weddingletter-staging-ingress/);
  assert.match(edge, /weddingletter-production-ingress/);
  assert.match(read('deploy/shared-edge/nginx/templates/default.conf.template'), /ssl_reject_handshake on/);
});

test('staging remains protected and production routes to production-only aliases', () => {
  const stage = read('deploy/shared-edge/nginx/templates/staging.conf.template');
  const prod = read('deploy/shared-edge/nginx/templates/production.conf.template');
  assert.match(stage, /auth_basic "WeddingLetter staging"/);
  assert.match(stage, /noindex, nofollow/);
  assert.match(stage, /http:\/\/staging-web:3000/);
  assert.match(stage, /http:\/\/staging-api:4000/);
  assert.doesNotMatch(prod, /http:\/\/staging-/);
  assert.doesNotMatch(prod, /auth_basic "|noindex, nofollow/);
  assert.match(prod, /http:\/\/production-web:3000/);
  assert.match(prod, /http:\/\/production-api:4000/);
  for (const config of [stage, prod]) {
    assert.match(config, /resolver 127\.0\.0\.11/);
    assert.match(config, /location = \/payments\/midtrans\/notification/);
  }
});

test('shared staging ingress is opt-in, not an automatic live cutover', () => {
  const script = read('deploy/staging/deploy.sh');
  assert.match(script, /shared=false/);
  assert.match(script, /COMPOSE_FILE=docker-compose.yml:docker-compose.shared.yml/);
  assert.match(read('deploy/staging/docker-compose.shared.yml'), /profiles: \[legacy-ingress\]/);
  assert.match(script, /docker compose up -d postgres api web/);
});

test('production backs up before migration/start and persists an immutable healthy release', () => {
  const script = read('deploy/production/deploy.sh');
  assert.ok(script.indexOf('pg_dump ') < script.indexOf('docker compose up -d'));
  assert.match(script, /production-\[a-f0-9\]\{40\}/);
  assert.match(script, /\.previous-tag/);
  assert.match(script, /weddingletter-production-ingress/);
  assert.match(script, /MIDTRANS_IS_PRODUCTION/);
  assert.match(script, /mv .env.next .env/);
  for (const env of ['production', 'staging']) {
    const deploy = read(`deploy/${env}/deploy.sh`);
    assert.doesNotMatch(deploy, /down -v|volume prune|system prune|image prune/);
    assert.equal(deploy.includes('\r'), false);
  }
});
