# Micro Frontend Composition Benchmark

Empirical comparison of **micro frontend (MFE) composition strategies** on the *same* e-commerce application, measured with Core Web Vitals (LCP, INP, CLS, FCP, TBT, TTI) and bundle size under simulated network conditions (Slow 3G, Fast 4G, Broadband).

Part of the M.Tech (Software Engineering) dissertation *"Performance Comparison of Micro Frontend Composition Strategies with Server-Side Rendering"*, BITS Pilani (WILP), by Suresh Kumar.

| # | Strategy | Composition happens | Folder | Status |
|---|----------|--------------------|--------|--------|
| A | Webpack 5 Module Federation | Build-time contracts, loaded at runtime by a host shell | `a-module-federation/` | ✅ Done |
| B | Single-SPA + SystemJS import maps | Runtime, in the browser, by URL | `b-single-spa/` | ✅ Done |
| C | Next.js 15 + React Server Components | Server-side, streamed HTML | `c-nextjs-rsc/` | 🕒 Planned |

## The application

A four-page shop, split into four MFE domains plus shared chrome:

| MFE | Route | Features |
|-----|-------|----------|
| Home | `/` | Hero, featured-products carousel (top rated), category grid |
| Product Listing (PLP) | `/products` | Category filter, sort, search, pagination (8 per page) |
| Product Detail (PDP) | `/product/:id` | Image, description, rating, quantity, add to cart |
| Cart | `/cart` | Quantity update, remove, totals, checkout |
| Header / Footer | all pages | Navigation, search, live cart badge |

**Data:** the public [FakeStore API](https://fakestoreapi.com). It has no search, price sort or pagination endpoints, so the listing page fetches the catalogue and applies these in the app (`shared/src/api.js → queryProducts`). Reviews are shown as FakeStore's rating and count only.

## Controlled variables (fair comparison)

To ensure measured differences come from the **composition strategy**, everything else is held constant:

- **Same UI code:** all implementations use the React components and CSS in `shared/` (`@mfe/shared`). Only routing/linking adapters differ.
- **Same data:** FakeStore API, same requests per page.
- **Same styling:** one plain CSS file, no web fonts, no CSS-in-JS.
- **Same hosting for client builds:** `tools/static-server.js` (gzip, identical cache headers, CORS) serves A and B.
- **Same compiler settings:** Babel preset-env targets and webpack 5 production mode.
- **Cross-MFE state:** the cart lives in `localStorage` and changes are broadcast with a `cart:updated` DOM event, so no MFE shares in-memory state.

## Repository structure

```
shared/                 @mfe/shared – FakeStore client, cart store, CSS, React view components
tools/                  static production server used by A and B
a-module-federation/    A: shell (host) + home, plp, pdp, cart remotes
b-single-spa/           B: root-config (import map) + navbar, home, plp, pdp, cart apps
```

### Ports

| App | A – Module Federation | B – Single-SPA |
|-----|----------------------|----------------|
| Entry (open this) | **3000** (shell) | **3100** (root-config) |
| Header/footer | in shell | 3101 (navbar) |
| Home | 3001 | 3102 |
| PLP | 3002 | 3103 |
| PDP | 3003 | 3104 |
| Cart | 3004 | 3105 |

## Running

Requires Node.js 20+.

```bash
npm install

# A – Module Federation → http://localhost:3000
npm run a:build && npm run a:start

# B – Single-SPA → http://localhost:3100
npm run b:build && npm run b:start

# Development mode (hot reload)
npm run a:dev
npm run b:dev

# Bundle analysis (writes dist/bundle-report.html per app)
npm run a:analyze
npm run b:analyze
```

`API_URL` (default `https://fakestoreapi.com`) and the remote URLs (`A_HOME_URL`, …, `B_CART_URL`) can be overridden at build time for cloud deployment.

## How each strategy composes the page

**A – Module Federation.** The shell owns routing, header and footer. Each page is a *remote* built and deployed separately; the shell loads its `remoteEntry.js` on first navigation (`React.lazy`). React, ReactDOM and React Router are shared **singletons** negotiated by webpack at runtime. Each remote is wrapped in its own error boundary. Remotes can also run standalone for development.

**B – Single-SPA.** `root-config` serves an HTML page with a SystemJS **import map** and registers every app with an activity function on the URL. Each app is a separate SystemJS module exposing `bootstrap/mount/unmount` (via `single-spa-react`). React, ReactDOM and single-spa are self-hosted by root-config and loaded once through the import map. A failed app load is handled by a global error handler that shows a fallback.

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

Mid-semester results (1 run per configuration, A vs B): `bench/results/midsem-run1/`.

## Error-isolation check

Stop one remote while the others keep running, then reload:

```bash
lsof -ti :3004 | xargs kill   # A: cart remote
lsof -ti :3105 | xargs kill   # B: cart app
```

Only the Cart page shows *"This section is temporarily unavailable"*; the rest of the site keeps working. Restart it with `npm run serve -w a-cart` / `npm run serve -w b-cart`.

## Roadmap

- [x] Shared UI, FakeStore client, cart store
- [x] A – Module Federation
- [x] B – Single-SPA
- [ ] C – Next.js 15 + React Server Components
- [x] Automated Lighthouse runner + single-run A vs B results
- [ ] Full repeated-run benchmark (evaluating Lighthouse CI / GitHub Actions / WebPageTest API)
- [ ] Cloud deployment on identical infrastructure
- [ ] Qualitative comparison and decision framework
