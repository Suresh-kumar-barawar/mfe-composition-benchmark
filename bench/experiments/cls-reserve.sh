#!/usr/bin/env bash
# CLS experiment: baseline vs. "reserve-main" (content area >= 100vh) on the same machine.
#   bash bench/experiments/cls-reserve.sh [runs]      (default 3; needs Chromium via CHROME_PATH)
# Builds A, B, C twice (baseline, then with bench/experiments/reserve-main.css appended to the
# shared CSS), measures Home/Listing/Detail on Fast 4G and Broadband, restores the CSS.
set -euo pipefail
cd "$(dirname "$0")/../.."
RUNS=${1:-3}
OUT=bench/results/exp-cls-reserve
CSS=shared/src/styles.css
cp "$CSS" /tmp/styles.backup.css
trap 'cp /tmp/styles.backup.css "$CSS"' EXIT

build() { npm run a:build >/dev/null && npm run b:build >/dev/null && NEXT_TELEMETRY_DISABLED=1 npm run c:build >/dev/null; }
restart_c() { pkill -f "next-serve[r]" || true; pkill -f "next star[t]" || true; sleep 2;
  NEXT_TELEMETRY_DISABLED=1 nohup npm run c:start > logs/c-exp.log 2>&1 &
  for _ in $(seq 1 60); do curl -s -o /dev/null http://localhost:3200/ && return; sleep 0.5; done; }
measure() { (cd bench && node run.mjs --runs "$RUNS" --impl A,B,C --network fast-4g,broadband --pages home,plp,pdp --out "../$OUT/$1") }

mkdir -p logs
echo "== baseline"; build; restart_c; measure baseline
echo "== reserve-main"; cat bench/experiments/reserve-main.css >> "$CSS"; build; restart_c; measure reserve-main
cp /tmp/styles.backup.css "$CSS"; echo "== restored $CSS"; build; restart_c
for v in baseline reserve-main; do python3 bench/analyze.py "$OUT/$v" >/dev/null; done
echo "done -> $OUT"
