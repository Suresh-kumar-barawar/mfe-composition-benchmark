# Extra experiments

## 1. Footer layout shift in client-side composition ("reserve-main"), 15 Oct 2026

**Observation (final2 runs, phone screen 412 × 823):** A and B had CLS 0.15–0.17 on the Listing
page (above the 0.1 "good" limit) and 0.07 on Home/Detail; C had 0 (except Detail 0.076).
Lighthouse's `layout-shifts` audit names the **footer** as the element that moves (0.146 of
0.168). A and B render the shell (header, footer) first and the page content later, so the
footer first appears inside the screen and is pushed down when the products arrive. C sends
the finished page from the server. The effect only became visible after the phone header was
fixed on 15 Oct: before, the header overflowed the screen, the page was wider than the
viewport and the browser zoomed it out.

**Change tested:** `bench/experiments/reserve-main.css` – the content area reserves at least one
full screen height (`.app > main, .mfe-main { min-height: 100vh; }`), so the footer starts
below the visible area. Same rule for A, B and C. Not part of the main code.

**Method:** `bash bench/experiments/cls-reserve.sh 3` – same machine, A/B/C × Home/Listing/
Detail × Fast 4G/Broadband × 3 runs, once without and once with the rule (54 + 54 runs,
0 errors). Results: `bench/results/exp-cls-reserve/{baseline,reserve-main}`.

| CLS, median of 3 (Fast 4G) | Baseline A / B / C | reserve-main A / B / C |
|---|---|---|
| Home | 0.066 / 0.066 / 0 | 0.003 / 0.003 / 0 |
| Listing | 0.168 / 0.168 / 0 | 0.023 / 0.023 / 0 |
| Detail | 0.074 / 0.074 / 0.076 | 0 / 0 / 0 |

Broadband gives the same picture. FCP and LCP did not change beyond run-to-run noise.

**Conclusion:** the layout shift of client-side composition comes from content arriving after
the shell; reserving space for the content area removes it (A and B back under 0.03). Server-
side composition (C) avoids it by design.
