#!/usr/bin/env bash
# Uploads web/ to the VPS, replacing $WEB_DIR/current.
#   DEPLOY_HOST=user@your-vps ./deploy/deploy-web.sh
set -euo pipefail

: "${DEPLOY_HOST:?set DEPLOY_HOST, e.g. DEPLOY_HOST=user@your-vps}"
WEB_DIR="${WEB_DIR:-/var/www/running-calendar}"

cd "$(dirname "$0")/.."

ssh "$DEPLOY_HOST" "mkdir -p '$WEB_DIR/current'"
rsync -az --delete --chmod=D755,F644 web/ "$DEPLOY_HOST:$WEB_DIR/current/"

echo "Deployed web $(git rev-parse --short HEAD)"
