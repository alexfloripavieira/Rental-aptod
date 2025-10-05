#!/usr/bin/env bash
set -euo pipefail

# Remote deploy script to be executed via SSH (from CI or manually)
# Usage (on your machine):
#   ssh -i LightsailDefaultKey-us-east-1.pem ubuntu@<IP> 'bash -s' < scripts/deploy_lightsail.sh

APP_DIR=${APP_DIR:-$HOME/Rental-aptod}
BRANCH=${BRANCH:-main}

echo "[deploy] Target dir: $APP_DIR (branch: $BRANCH)"

if [ ! -d "$APP_DIR/.git" ]; then
  echo "[deploy] Cloning repository into $APP_DIR"
  git clone https://github.com/${GITHUB_REPOSITORY:-alexfloripavieira/Rental-aptod}.git "$APP_DIR"
fi

cd "$APP_DIR"

echo "[deploy] Checking out branch $BRANCH"
git fetch origin "$BRANCH" || true
git checkout "$BRANCH" || git checkout main
git pull --rebase --autostash || true

if [ ! -f .env ]; then
  echo "[deploy][warn] .env not found. Create $APP_DIR/.env before first deploy." >&2
fi

echo "[deploy] Compose up (production profile)"
docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile production up -d --build

echo "[deploy] Pruning old images (safe)"
docker image prune -f || true

echo "[deploy] Health check"
docker compose exec -T backend curl -sS http://localhost:8000/api/v1/health/
echo "[deploy] Done."

