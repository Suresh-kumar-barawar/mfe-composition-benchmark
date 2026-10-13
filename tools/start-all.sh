#!/usr/bin/env bash
# Starts the production builds of A, B and C in the background and waits until every
# server answers. Used by the GitHub Actions workflows (and handy locally).
#   bash tools/start-all.sh            # after npm run a:build && npm run b:build && npm run c:build
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p logs
nohup npm run a:start > logs/a.log 2>&1 &
nohup npm run b:start > logs/b.log 2>&1 &
NEXT_TELEMETRY_DISABLED=1 nohup npm run c:start > logs/c.log 2>&1 &
wait_for() {
  for _ in $(seq 1 120); do
    if curl -s -o /dev/null "$1"; then return 0; fi
    sleep 0.5
  done
  echo "Timed out waiting for $1" >&2
  return 1
}
for url in http://localhost:3000/ http://localhost:3001/remoteEntry.js http://localhost:3002/remoteEntry.js \
           http://localhost:3003/remoteEntry.js http://localhost:3004/remoteEntry.js \
           http://localhost:3100/ http://localhost:3101/shop-navbar.js http://localhost:3102/shop-home.js \
           http://localhost:3103/shop-plp.js http://localhost:3104/shop-pdp.js http://localhost:3105/shop-cart.js \
           http://localhost:3200/; do
  wait_for "$url"
done
echo "A (3000-3004), B (3100-3105) and C (3200) are up."
