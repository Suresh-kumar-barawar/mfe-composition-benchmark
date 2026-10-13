# Measurement validation: headless-Chrome paint artefact (found 14 Oct 2026)

## What we saw

In the first check run after adding Implementation C (`bench/results/check-r19-artefact/`,
1 run per configuration, React 19.2, Lighthouse 12.8.2, Chromium 141 headless), C's First
Contentful Paint was **2.37 s on Fast 4G but 1.2 s on Slow 3G**, on every page — including
the Cart page, which fetches no data. A slower network cannot paint earlier, so we checked
the measurement before using any number.

## Evidence

1. **Lighthouse network log (C, Cart, Fast 4G):** HTML received at 0.20 s, CSS at 0.39 s, all
   scripts by 0.60 s, `load` at 0.71 s — but FCP reported at 2.38 s. The main thread was idle
   after 0.7 s (no long tasks). The filmstrip screenshots were blank until ~2.3 s.
2. **Varying one throttling setting at a time** (C, Cart, 4x CPU), FCP vs. latency was not
   monotonic: 20 ms → 0.15 s, 100–170 ms → ~2.3 s, 250 ms → 0.69 s, 400 ms → 0.98 s.
   Bandwidth made no difference. B showed the same ~2.4 s floor (FCP after `load`); A did not.
3. **The browser's own FCP** (`tests/browser-fcp.mjs`: Playwright, same DevTools network and
   CPU throttling, `PerformanceObserver`, no Lighthouse) on Fast 4G: **B 1.44 s, C 0.47 s**
   (Lighthouse had reported 2.39 s and 2.37 s). Tracing, screenshot tracing and mobile screen
   emulation did not reproduce the delay in this probe.
4. **Chrome flags** (`bench/validate/lighthouse-fcp.mjs`). The combination
   `--disable-renderer-backgrounding --disable-backgrounding-occluded-windows
   --disable-background-timer-throttling --hide-scrollbars
   --enable-features=CDPScreenshotNewSurface` made Lighthouse agree with the browser, repeatably,
   in both the normal and the headless-shell Chromium builds:

   | Cart page, Lighthouse FCP (ms) | Fast 4G | Slow 3G | Broadband |
   |---|---|---|---|
   | A before → after | 1142 → 1108 / 1120 | – → 3903 / 3908 | – → 504 / 559 |
   | B before → after | 2382 → 1533 / 1457 | – → 4624 / 4565 | – → 574 / 526 |
   | C before → after | 2368 → 538 / 489 | – → 1222 / 1209 | – → 192 / 272 |

   With the fix, FCP rises with latency for every implementation, and B/C match the
   in-browser values. A is unchanged (its own JavaScript kept the page producing frames).
   Single flags alone (only the screenshot feature, only the backgrounding flags, disabling
   PaintHolding / field trials) did not fix it reliably.

## Interpretation

Under Lighthouse, headless Chrome treated the audited tab like a background/occluded tab and
throttled frame production, and the screenshot capture used for the filmstrip interfered with
the first frame. Pages whose network work finished early (C's server HTML; B once its loader
chain completed) then waited for a later frame (~2.3–2.4 s) before painting. This is a
property of the lab setup, not of the applications.

## Consequences

- `bench/run.mjs` now always starts Chrome with the flags above; they are written to each
  run's `meta.json` (`chromeFlags`).
- **Mid-semester result to correct in the final report:** B's Fast 4G FCP (2.38–2.49 s) was
  inflated by this artefact. B is still slower than A on Fast 4G (≈1.45 s vs ≈1.1 s on the
  Cart page) because of its loading chain, but not "about twice as slow". A's mid-semester
  numbers are not affected. All final numbers come from runs with the fixed runner.
- Validation step for the final report: spot-check FCP of each implementation with
  `tests/browser-fcp.mjs` against the Lighthouse value.
