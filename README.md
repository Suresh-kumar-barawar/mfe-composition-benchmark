# Micro Frontend Composition Benchmark

Empirical comparison of **micro frontend (MFE) composition strategies** on the *same* e-commerce application, measured with Core Web Vitals (LCP, INP, CLS, FCP, TBT, TTI) and bundle size under simulated network conditions (Slow 3G, Fast 4G, Broadband).

Part of the M.Tech (Software Engineering) dissertation *"Performance Comparison of Micro Frontend Composition Strategies with Server-Side Rendering"*, BITS Pilani (WILP), by Suresh Kumar.

**Paper (preprint):** Kumar, S. (2026). *Where should micro frontends be composed? An empirical comparison of Module Federation, Single-SPA and React Server Components.* Zenodo. https://doi.org/10.5281/zenodo.23541919 — see `CITATION.cff`. Code licensed under MIT (`LICENSE`).

**Code and data (v1.0.0, archived):** [![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.23547577.svg)](https://doi.org/10.5281/zenodo.23547577)

| # | Strategy | Composition happens | Folder | Status |
|---|----------|--------------------|--------|--------|
| A | Webpack 5 Module Federation | Build-time contracts, loaded at runtime by a host shell | `a-module-federation/` | ✅ Done |
| B | Single-SPA + SystemJS import maps | Runtime, in the browser, by URL | `b-single-spa/` | ✅ Done |
| C | Next.js 15 + React Server Components | Server-side, streamed HTML | `c-nextjs-rsc/` | ✅ Done |

## The application

A four-page shop, split into four MFE domains plus shared chrome:

| MFE | Route | Features |
|-----|-------|----------|
| Home | `/` | Hero, featured-products carousel (top rated), category grid |
| Product Listing (PLP) | `/products` | Category filter, sort, search, pagination (8 per page) |
| Product Detail (PDP) | `/product/:id` | Image, description, rating, quantity, add to cart |
| Cart | `/cart` | Quantity update, remove, totals, checkout |
| Header / Footer | all pages | Navigation, search, live cart badge |

**Data:** our catalogue API `catalog-api/` (port 3300, `npm run api:start`), which serves a copy of the open-source [FakeStore API](https://fakestoreapi.com) data — 20 products in 4 categories with their product images — on FakeStore's routes and JSON format. We host it ourselves because the public fakestoreapi.com blocks requests from cloud and CI machines (HTTP 403 bot check) and its response time varies (see *Lessons learned* below). FakeStore has no search, price sort or pagination endpoints, so the listing page fetches the catalogue and applies these in the app (`shared/src/api.js → queryProducts`). Reviews are shown as the rating and count only.

## Controlled variables (fair comparison)

To ensure measured differences come from the **composition strategy**, everything else is held constant:

- **Same UI code:** all implementations use the React components and CSS in `shared/` (`@mfe/shared`). Only routing/linking adapters differ.
- **Same data:** the catalogue API, same requests per page.
- **Same styling:** one plain CSS file, no web fonts, no CSS-in-JS.
- **Same hosting for client builds:** `tools/static-server.js` (gzip, identical cache headers, CORS) serves A and B; C is served by `next start` (gzip).
- **Same React:** React 19.2 everywhere. Next.js 15.5's App Router always runs its own built-in React 19.2 build, so A and B are pinned to `~19.2.8`.
- **Same images:** plain `<img>` from the shared components in all three (no `next/image` in the main comparison).
- **Same data freshness:** every page load fetches the catalogue again (A/B in the browser, C on the server with `cache: 'no-store'` and `dynamic = 'force-dynamic'`).
- **No prefetching:** C's link adapter sets `prefetch={false}`, because A and B do not prefetch other pages.
- **Same compiler settings:** Babel preset-env targets and webpack 5 production mode.
- **Cross-MFE state:** the cart lives in `localStorage` and changes are broadcast with a `cart:updated` DOM event, so no MFE shares in-memory state.

## Repository structure

```
shared/                 @mfe/shared – catalogue API client, cart store, CSS, React view components
tools/                  static production server used by A and B
a-module-federation/    A: shell (host) + home, plp, pdp, cart remotes
b-single-spa/           B: root-config (import map) + navbar, home, plp, pdp, cart apps
c-nextjs-rsc/           C: host (Next.js App Router) + home, plp, pdp, cart MFE packages + common adapters
bench/                  Lighthouse runner (run.mjs) and analysis (analyze.py)
tests/                  functional.mjs – 14-behaviour headless-browser check for A, B and C
catalog-api/            catalogue API: FakeStore data + images, same routes (Express; also deployable to Vercel)
docs/                   DEPLOYMENT.md, MEASUREMENT_VALIDATION.md, EXPERIMENTS.md, QUALITATIVE.md, DECISION_FRAMEWORK.md
.github/workflows/      ci.yml (build + tests on every push), benchmark.yml (manual benchmark runs)
```

### Ports

| App | A – Module Federation | B – Single-SPA | C – Next.js RSC |
|-----|----------------------|----------------|-----------------|
| Entry (open this) | **3000** (shell) | **3100** (root-config) | **3200** (host) |
| Header/footer | in shell | 3101 (navbar) | in host layout |
| Home | 3001 | 3102 | package `c-home` |
| PLP | 3002 | 3103 | package `c-plp` |
| PDP | 3003 | 3104 | package `c-pdp` |
| Cart | 3004 | 3105 | package `c-cart` |

## Running

Requires Node.js 20+. Start the catalogue API first (all three apps read from it). All implementations use **React 19** (Next.js 15's App Router requires it; A and B were moved from React 18 so the React version is the same in all three).

```bash
npm install

# Catalogue API (data + images) → http://localhost:3300
npm run api:start

# A – Module Federation → http://localhost:3000
npm run a:build && npm run a:start

# B – Single-SPA → http://localhost:3100
npm run b:build && npm run b:start

# C – Next.js RSC → http://localhost:3200
npm run c:build && npm run c:start

# Functional check (14 behaviours) against the running apps
cd tests && npm install && node functional.mjs        # --impl A,B,C

# Development mode (hot reload)
npm run a:dev
npm run b:dev
npm run c:dev

# Bundle analysis (writes dist/bundle-report.html per app)
npm run a:analyze
npm run b:analyze
```

`API_URL` (default `http://localhost:3300`, the catalogue API) and the remote URLs (`A_HOME_URL`, …, `B_CART_URL`) can be overridden at build time for cloud deployment.

## How each strategy composes the page

**A – Module Federation.** The shell owns routing, header and footer. Each page is a *remote* built and deployed separately; the shell loads its `remoteEntry.js` on first navigation (`React.lazy`). React, ReactDOM and React Router are shared **singletons** negotiated by webpack at runtime. Each remote is wrapped in its own error boundary. Remotes can also run standalone for development.

**B – Single-SPA.** `root-config` serves an HTML page with a SystemJS **import map** and registers every app with an activity function on the URL. Each app is a separate SystemJS module exposing `bootstrap/mount/unmount` (via `single-spa-react`). React, ReactDOM and single-spa are self-hosted by root-config and loaded once through the import map. React 19 no longer ships UMD files, so `root-config/webpack.vendor.js` compiles `react`, `react-dom` and `react-dom/client` into SystemJS modules (`dist/vendor/`). A failed app load is handled by a global error handler that shows a fallback.

**C – React Server Components.** One Next.js 15 App Router *host* composes four MFE *packages* on the server. `c-home`, `c-plp` and `c-pdp` are async Server Components that fetch their own FakeStore data on the server and stream into the page through their own `<Suspense>` boundary (the hero, header and footer are sent first). Only interactive parts are client components: search box, cart badge, listing filters, add-to-cart and the cart page (`c-cart`, because the cart lives in `localStorage`). The host wraps every MFE in an error boundary + Suspense boundary, like A's shell. Each MFE is its own package with its own owner, but all four are deployed together as one Next.js app — that is the main trade-off of server-side composition.

Extra experiments (not part of the main comparison): `C_DATA_CACHE=1` caches catalogue API responses for 5 minutes (Next.js data cache).

## Benchmarking (automated Lighthouse runs)

`bench/run.mjs` launches a fresh cold-cache headless Chrome for every
implementation × page × network profile × run and records FCP, LCP, TBT, CLS, TTI,
Speed Index, JS bytes and request counts with **real DevTools throttling** (4x CPU).
Implementations are interleaved (A, B, A, B …) so external drift affects them equally.

```bash
cd bench && npm install && cd ..
npm run a:start & npm run b:start &              # apps must be running
npm run bench -- --runs 1 --impl A,B             # add --network slow-3g,fast-4g,broadband --pages home,plp,pdp,cart
npm run bench:analyze -- bench/results/<run>     # summary.csv + charts/*.png
```

| Profile | Down | Up | Latency |
|---|---|---|---|
| Slow 3G | 400 Kbps | 400 Kbps | 400 ms |
| Fast 4G | 9 Mbps | 1.5 Mbps | 170 ms |
| Broadband | 40 Mbps | 10 Mbps | 20 ms |

Mid-semester results (1 run per configuration, A vs B, **React 18**): `bench/results/midsem-run1/`.

**Measurement fix (Oct 2026):** the runner now starts Chrome with flags that stop headless Chrome from holding back the first frame under Lighthouse; before, B's and C's FCP on Fast 4G was over-reported (~2.4 s instead of ~1.4 s / ~0.5 s). See [`docs/MEASUREMENT_VALIDATION.md`](docs/MEASUREMENT_VALIDATION.md). The mid-semester B values on Fast 4G were affected. Check runs with A, B and C: `bench/results/check-r19-artefact/` (before the fix), `bench/results/check-r19-run2/` (after).

On GitHub: *Actions → Benchmark → Run workflow* runs the same benchmark on a GitHub runner (`target=local`: builds everything on the runner with the catalogue API; `target=deployed`: measures deployed URLs).

## Error-isolation check

Stop one remote while the others keep running, then reload:

```bash
lsof -ti :3004 | xargs kill   # A: cart remote
lsof -ti :3105 | xargs kill   # B: cart app
```

Only the Cart page shows *"This section is temporarily unavailable"*; the rest of the site keeps working. Restart it with `npm run serve -w a-cart` / `npm run serve -w b-cart`.

In C all MFEs run in one Next.js process, so an MFE cannot be switched off on its own. Instead, start C with `C_FAIL_MFE=<home|plp|pdp|cart> npm run c:start`: that MFE throws while rendering, only its page shows the fallback (HTTP 200), and header, footer and the other pages keep working.

## Deployment (free hosting)

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md): one Vercel (Hobby, free) project per implementation. A and B are built with `node tools/vercel-build.mjs a|b` (every MFE still built separately, published under `/mfe/<name>/`), C is a normal Next.js project rooted at `c-nextjs-rsc/host`.

## Lessons learned (developer experience)

- **Third-party API in the critical path.** Up to mid-semester the apps called the public fakestoreapi.com directly. When the builds moved to GitHub Actions, every request got HTTP 403 ("Just a moment…" bot check): the API blocks data-centre machines, which would also include Vercel's servers that render C. We moved the same data and images into our own catalogue API (`catalog-api/`) with an identical contract, so no application code changed — only `API_URL`. This also removes the external API's variable latency from the measurements.
- **Measuring paint in headless Chrome.** See [`docs/MEASUREMENT_VALIDATION.md`](docs/MEASUREMENT_VALIDATION.md).

## Roadmap

- [x] Shared UI, catalogue API client, cart store
- [x] A – Module Federation
- [x] B – Single-SPA
- [x] C – Next.js 15 + React Server Components (React 19.2 in all three)
- [x] Functional test (14 behaviours) passing on A, B and C
- [x] Automated Lighthouse runner + single-run A vs B results
- [ ] Full repeated-run benchmark (evaluating Lighthouse CI / GitHub Actions / WebPageTest API)
- [ ] Cloud deployment (Vercel free plan, scripts ready)
- [x] Final benchmark: 180 runs deployed + 180 runs local, INP sessions (`bench/results/final2-*`)
- [x] Experiments: footer layout shift, `next/image`, data cache (`docs/EXPERIMENTS.md`)
- [x] Qualitative comparison and decision framework (`docs/QUALITATIVE.md`, `docs/DECISION_FRAMEWORK.md`)
- [ ] Final report
