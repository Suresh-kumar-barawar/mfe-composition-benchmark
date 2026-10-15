# Decision framework: which micro frontend composition strategy?

Based on the measurements in this repository (final runs: `bench/results/final2-vercel`,
`final2-local`; experiments: `docs/EXPERIMENTS.md`; qualitative: `docs/QUALITATIVE.md`).
All three were built from the same UI code, data and hosting, so differences come from the
composition strategy.

## 1. What the evidence says (short)

| Question | A – Module Federation | B – Single-SPA | C – Next.js RSC |
|---|---|---|---|
| How fast does something appear? (FCP, Fast 4G) | 1.0 s | 1.4 s | **0.47 s** |
| How fast does the main content appear? (LCP Home, Fast 4G) | 2.7 s | 2.8 s | **1.4 s** |
| Does the layout jump? (CLS, phone) | up to 0.17 – needs reserved space | up to 0.17 – needs reserved space | **0** (by design) |
| Does the page react quickly to clicks? (INP) | 32 ms | 24 ms | 24 ms – all "good" |
| Main-thread blocking during load (TBT) | **0 ms** | **0 ms** | ~100 ms (hydration) |
| Moving to another page (time to result) | 0.85 s | 0.85 s | **0.26–0.48 s** |
| Filtering/sorting data already on the page | **0.07–0.27 s** | **0.07–0.26 s** | 0.27–0.56 s (server round trip) |
| JavaScript downloaded | 112 KB | **86 KB** | 111 KB |
| Content visible to crawlers without JavaScript | No | No | **Yes** |
| Deploy one MFE without the others | **Yes** | **Yes** | No |
| Needs a server at runtime | No (static/CDN) | No (static/CDN) | Yes |
| Mix frameworks (React + Vue …) | Possible, with effort | **Designed for it** | No (React only) |

Two cross-cutting findings:
- **Images matter more than the strategy on slow networks:** `next/image` cut C's Slow 3G LCP
  from 29 s to 3.6 s (EXPERIMENTS §2). Optimise images whatever strategy is chosen.
- **Client-side composition needs reserved space:** A and B's footer jump (CLS 0.17) disappeared
  with one CSS rule (EXPERIMENTS §1).

## 2. Decision guide

Answer the questions in order; the first "yes" usually decides.

1. **Is first-load speed or SEO critical** (public shop, landing pages, content sites, users on
   mobile networks)?
   → **C – server-side composition (React Server Components).** Fastest first and largest paint
   on every network, no layout shift, full HTML for crawlers. Accept: one deployable app (teams
   share a release), a Node.js/serverless runtime, React-only, ~100 ms more main-thread work.
   If team independence is also required, consider **Next.js Multi-Zones** (several Next.js
   apps under one domain; full page load between zones) – discussed, not measured here.

2. **Must each team deploy on its own, at any time, without a shared build?**
   → client-side composition: **A or B**.
   - Mostly **one framework (React)**, wanting the simplest setup, standalone development of each
     MFE and shared libraries negotiated automatically → **A – Module Federation**. It also paints
     earlier than B (about 0.4 s on 4G) because it loads its pieces in parallel.
   - **Several frameworks**, or migrating an old app piece by piece → **B – Single-SPA**. Smallest
     JavaScript, but a longer loading chain (later first paint) and more integration bugs that only
     show at runtime.
   - In both cases: reserve space for content (no footer jump), and add server-side rendering of
     the shell or critical pages if SEO matters.

3. **Is the app behind a login (dashboard, admin, internal tool) with frequent in-page interaction**
   (filters, sorting, editing data already loaded)?
   → **A** (or B). SEO does not matter there, in-page interactions are fastest when the data is
   already in the browser, and static hosting is cheapest. All three responded to clicks well
   within the 200 ms INP limit, so responsiveness alone does not decide.

4. **Hosting constraint: static files/CDN only, no server?** → **A or B** (C needs a runtime).

## 3. Rule of thumb

| Situation | Recommended |
|---|---|
| Public, content- or catalogue-heavy site; SEO; mobile users | **C** (+ Multi-Zones if many teams) |
| Many independent React teams; app behind login | **A** |
| Mixed frameworks or gradual migration of a legacy frontend | **B** |
| Any of the above on slow networks | Optimise images first – bigger effect than the strategy |

## 4. Limits of this evidence

- One small shop (4 pages, 20 products); larger apps with more MFEs may change the balance (e.g.
  A loads every remote manifest on every page).
- Lab measurements (Lighthouse + scripted sessions, throttled), not field data from real users.
- C uses Next.js's built-in React 19.2 canary; A and B use React 19.2.8.
- Deployed results come from Vercel (A/B on its CDN, C serverless in one region) measured from a
  GitHub runner; other hosts would give other absolute numbers.
