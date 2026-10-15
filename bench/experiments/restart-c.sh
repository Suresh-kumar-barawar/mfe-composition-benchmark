#!/usr/bin/env bash
# Restart C (next start, :3200) with extra environment, e.g.:
#   bash bench/experiments/restart-c.sh C_NEXT_IMAGE=1
#   bash bench/experiments/restart-c.sh            # normal mode
cd "$(dirname "$0")/../.."
for pid in $(lsof -t -iTCP:3200 -sTCP:LISTEN 2>/dev/null) $(pgrep -f "next-serve[r]") $(pgrep -f "next star[t] -p 3200"); do kill "$pid" 2>/dev/null; done
for _ in $(seq 1 40); do curl -s -o /dev/null http://localhost:3200/ || break; sleep 0.5; done
mkdir -p logs
env NEXT_TELEMETRY_DISABLED=1 "$@" nohup npm run c:start > logs/c.log 2>&1 &
for _ in $(seq 1 80); do curl -s -o /dev/null http://localhost:3200/ && break; sleep 0.5; done
echo "C restarted ${*:-(normal mode)}"
