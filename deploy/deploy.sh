#!/usr/bin/env bash
# Run on the VPS from the repo: pulls, rebuilds the API and replaces the static site in $WEB_DIR/current.
#   ./deploy/deploy.sh            # git pull, then deploy
#   NO_PULL=1 ./deploy/deploy.sh  # deploy the working tree as is
set -euo pipefail

WEB_DIR="${WEB_DIR:-/var/www/running-calendar}"
API_PORT="${API_PORT:-8080}"

cd "$(dirname "$0")/.."

if [ -z "${NO_PULL:-}" ]; then
  git pull --ff-only
fi

echo "==> Building and starting the API"
docker compose up -d --build

echo "==> Publishing web"
# Migrate from the old releases/ + current symlink layout.
if [ -L "$WEB_DIR/current" ]; then rm "$WEB_DIR/current"; fi
rm -rf "$WEB_DIR/releases"
mkdir -p "$WEB_DIR/current"
rsync -a --delete --chmod=D755,F644 web/ "$WEB_DIR/current/"

echo "==> Health check"
for _ in $(seq 1 15); do
  if curl -fsS -o /dev/null "http://127.0.0.1:$API_PORT/api/events"; then
    echo "Deployed $(git rev-parse --short HEAD)"
    exit 0
  fi
  sleep 1
done
echo "API did not become healthy; see: docker compose logs api" >&2
exit 1
