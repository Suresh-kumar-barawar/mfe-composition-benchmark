#!/usr/bin/env bash
# C-only experiments, same machine, Home/Listing/Detail x 3 networks.
#   bash bench/experiments/c-variants.sh next-image [runs]    baseline vs C_NEXT_IMAGE=1 (API without delay)
#   bash bench/experiments/c-variants.sh data-cache [runs] [api_delay_ms]
#        baseline vs C_DATA_CACHE=1, catalogue API delayed (default 150 ms per response) in both
#        variants so it behaves like a backend across a network – otherwise caching saves nothing.
# Needs the apps built and running (tools/start-all.sh); C and the API are restarted.
set -euo pipefail
cd "$(dirname "$0")/../.."
EXP=${1:?next-image or data-cache}
RUNS=${2:-3}
DELAY=0; [ "$EXP" = data-cache ] && DELAY=${3:-150}
OUT=bench/results/exp-c-$EXP
measure() { (cd bench && node run.mjs --runs "$RUNS" --impl C --network slow-3g,fast-4g,broadband --pages home,plp,pdp --out "../$OUT/$1") }
FLAG=C_NEXT_IMAGE=1; [ "$EXP" = data-cache ] && FLAG=C_DATA_CACHE=1

bash bench/experiments/restart-api.sh API_DELAY_MS="$DELAY"
curl -s -o /dev/null -w "API response time: %{time_total}s\n" http://localhost:3300/products
rm -rf c-nextjs-rsc/host/.next/cache/fetch-cache   # start without cached data
echo "== baseline"; bash bench/experiments/restart-c.sh;          measure baseline
echo "== $EXP";     bash bench/experiments/restart-c.sh "$FLAG";  measure "$EXP"
bash bench/experiments/restart-c.sh
bash bench/experiments/restart-api.sh
for v in baseline "$EXP"; do python3 bench/analyze.py "$OUT/$v" >/dev/null; done
printf '{"api_delay_ms": %s, "runs": %s}\n' "$DELAY" "$RUNS" > "$OUT/settings.json"
echo "done -> $OUT"
