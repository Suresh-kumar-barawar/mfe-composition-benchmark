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

## 2. Image optimisation in C (`next/image`), 15 Oct 2026

**Question:** how much does Next.js's built-in image optimisation change C's results? It is
kept out of the main comparison because A and B use the same plain `<img>` tags.

**Change tested:** `C_NEXT_IMAGE=1` (runtime switch, `c-common/src/NextImg.jsx`): product images
are rendered with `next/image`, which resizes them for the screen (`sizes`), converts them to
WebP/AVIF, lazy-loads off-screen images and preloads the important one. Everything else unchanged.

**Method:** `bash bench/experiments/c-variants.sh next-image 3` – C only, same machine,
Home/Listing/Detail × Slow 3G/Fast 4G/Broadband × 3 runs, baseline vs `next/image`
(27 + 27 runs, 0 errors). Results: `bench/results/exp-c-next-image/`.

| C, median of 3 | Baseline (plain `<img>`) | `next/image` |
|---|---|---|
| LCP Home, Slow 3G | 29.4 s | **3.6 s** |
| LCP Listing, Slow 3G | 27.4 s | **4.1 s** |
| LCP Detail, Slow 3G | 8.8 s | **3.2 s** |
| LCP Home / Listing, Fast 4G | 1.45 / 1.51 s | **1.02 / 1.10 s** |
| Bytes downloaded, Home | 1,276 KB | **245 KB** |
| Bytes downloaded, Detail | 395 KB | **153 KB** |
| FCP, TBT, CLS | – | unchanged (within noise) |

A single product image shrinks from about 270 KB (PNG) to about 20 KB (WebP).

**Conclusion:** on slow networks image weight, not the composition strategy, dominates the
largest paint. Optimising images cut C's Slow 3G LCP by about 8× – far more than any difference
between the three strategies. The same gain is available to A and B with an image CDN or
pre-resized images; `next/image` makes it a built-in default for C.

## 3. Server-side data caching in C (`C_DATA_CACHE=1`), 15 Oct 2026

**Question:** C fetches the catalogue on the server for every request. How much does caching
those API responses (Next.js data cache, revalidated every 5 minutes) help?

**Method:** `bash bench/experiments/c-variants.sh data-cache 3 150` – the catalogue API is given
a 150 ms delay per response in **both** variants (like a backend across a network; checked:
153 ms), C only, Home/Listing/Detail × 3 networks × 3 runs (27 + 27 runs, 0 errors).
Results: `bench/results/exp-c-data-cache/`. Without cache C's HTML finished after ~184 ms
(first bytes after 18 ms, products streamed when the API answered); with cache after ~20 ms.

| C, median of 3 | Baseline (fetch every request) | Data cache |
|---|---|---|
| TTFB (all pages, all networks) | 9–21 ms | 9–24 ms |
| LCP Broadband Home / Listing / Detail | 0.94 / 0.83 / 0.70 s | **0.78 / 0.75 / 0.61 s** |
| LCP Fast 4G Home / Listing / Detail | 1.43 / 1.53 / 0.99 s | 1.45 / 1.54 / 0.96 s |
| LCP Slow 3G | 29.4 / 27.4 / 8.8 s | 29.4 / 27.4 / 8.8 s |

**Conclusion:** because C streams the page (Suspense), a slow backend does not delay the first
bytes or the first paint – the shell is sent immediately and products follow. Caching only
removes the backend wait from the moment the products appear, which is visible on fast
networks (Broadband LCP −80 to −160 ms, about the API delay) and lost in the noise on 3G/4G,
where the network and the images dominate.

*Note:* an earlier attempt at this experiment ran without the API delay (the restart helper
did not stop the old API process); it was discarded. The `next/image` experiment above ran with
the same no-delay API for both of its variants, so its comparison is valid.
