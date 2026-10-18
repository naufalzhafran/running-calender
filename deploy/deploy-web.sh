#!/usr/bin/env bash
# Uploads web/ as a new release on the VPS and switches the `current` symlink.
#   DEPLOY_HOST=user@your-vps ./deploy/deploy-web.sh
set -euo pipefail

: "${DEPLOY_HOST:?set DEPLOY_HOST, e.g. DEPLOY_HOST=user@your-vps}"
WEB_DIR="${WEB_DIR:-/var/www/running-calendar}"
KEEP_RELEASES="${KEEP_RELEASES:-5}"

cd "$(dirname "$0")/.."
release="$(date -u +%Y%m%d%H%M%S)-$(git rev-parse --short HEAD)"

ssh "$DEPLOY_HOST" "mkdir -p '$WEB_DIR/releases'"
rsync -az --chmod=D755,F644 web/ "$DEPLOY_HOST:$WEB_DIR/releases/$release/"

# Relative symlink so it also resolves inside the API container (/web/current).
ssh "$DEPLOY_HOST" "cd '$WEB_DIR' \
  && ln -sfn 'releases/$release' current.tmp \
  && mv -Tf current.tmp current \
  && ls -1dt releases/* | tail -n +$((KEEP_RELEASES + 1)) | xargs -r rm -rf"

echo "Deployed web release $release"
