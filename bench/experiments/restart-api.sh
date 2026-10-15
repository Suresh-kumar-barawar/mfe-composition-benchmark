#!/usr/bin/env bash
# Restart the catalogue API (:3300) with extra environment, e.g. API_DELAY_MS=150.
cd "$(dirname "$0")/../.."
# The API runs as "node server.js" inside catalog-api/; stop whatever listens on :3300.
for pid in $(lsof -t -iTCP:3300 -sTCP:LISTEN 2>/dev/null) $(pgrep -f "start -w catalog-ap[i]"); do kill "$pid" 2>/dev/null; done
for _ in $(seq 1 40); do curl -s -o /dev/null http://localhost:3300/products || break; sleep 0.5; done
mkdir -p logs
env "$@" nohup npm run api:start > logs/api.log 2>&1 &
for _ in $(seq 1 40); do curl -s -o /dev/null http://localhost:3300/products && break; sleep 0.5; done
echo "API restarted ${*:-(no delay)}"
