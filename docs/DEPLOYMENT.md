# Deploying A, B and C on Vercel (free Hobby plan)

All three implementations are deployed on **one platform** so that hosting differences are
kept as small as possible. Vercel's Hobby plan is free for personal, non-commercial work
and needs no credit card.

**Live deployment (14 Oct 2026, account "Suresh Kumar's projects", Hobby):**

| Part | URL |
|---|---|
| Catalogue API | https://mfe-composition-benchmark.vercel.app (Vercel project `mfe-composition-benchmark`) |
| A – Module Federation | https://mfe-a-module-federation.vercel.app |
| B – Single-SPA | https://mfe-b-single-spa.vercel.app |
| C – Next.js RSC | https://mfe-c-nextjs-rsc.vercel.app |

All four deploy automatically on every push to `main`. A, B and C have
`API_URL=https://mfe-composition-benchmark.vercel.app`.

| Vercel project | Implementation | Root Directory | Framework preset | Build Command |
|---|---|---|---|---|
| `mfe-catalog-api` | Catalogue API (FakeStore data + images) | `catalog-api` | Other | from `catalog-api/vercel.json` |
| `mfe-a-module-federation` | A – Module Federation | `./` (repo root) | Other | `node tools/vercel-build.mjs a` |
| `mfe-b-single-spa` | B – Single-SPA | `./` (repo root) | Other | `node tools/vercel-build.mjs b` |
| `mfe-c-nextjs-rsc` | C – Next.js RSC | `c-nextjs-rsc/host` | Next.js | from `c-nextjs-rsc/host/vercel.json` |

## Data: our catalogue API

All three apps read products from `catalog-api/`, our self-hosted copy of the FakeStore API
data and images (same routes, same JSON). The public `fakestoreapi.com` cannot be used in the
cloud: it answers data-centre machines (GitHub's runners, and very likely Vercel's servers that
render C) with **HTTP 403 "Just a moment…"**. Each of A, B and C gets the setting
`API_URL=https://mfe-catalog-api.vercel.app` (your actual URL), read at build time.

## How each implementation is hosted

- **A and B (static, client-side composition).** `tools/vercel-build.mjs` still builds every
  micro frontend separately (5 builds for A, 6 for B), then publishes them on one site:
  the entry app (A's shell, B's root-config) at `/` and each MFE under `/mfe/<name>/`.
  It writes the Vercel *Build Output API* folder `.vercel/output` with the same cache rules as
  our local server (`tools/static-server.js`): hashed files cached for a year, everything else
  `no-cache`, unknown routes fall back to `index.html`.
- **C (server-side composition).** A normal Next.js project. Pages are rendered on every
  request by a Vercel serverless function (default region: Washington, D.C., `iad1`).

This is how each strategy would normally be run in production (CDN for client-side
composition, a server for server-side composition). The controlled, same-machine comparison
is the `local` benchmark (see below); the Vercel numbers show real-world behaviour.

## Steps (about 15 minutes, works from a phone browser)

1. **Merge the work into `main`.** Vercel only makes *production* deployments public. Branch
   (preview) deployments are behind a Vercel login by default, so Lighthouse could not
   measure them. Merge `impl-c` (which contains `react19`) into `main` first.
2. **Create the account:** go to vercel.com → *Sign Up* → *Hobby* → *Continue with GitHub*
   with the account **Suresh-kumar-barawar**. Allow the Vercel GitHub app to access
   `mfe-composition-benchmark`.
3. **Catalogue API first:** *Add New… → Project* → import `mfe-composition-benchmark`.
   - Project Name: `mfe-catalog-api`
   - Vercel's import screen detects several apps and suggests one "Services" project –
     ignore that; use *Import single project* on the `catalog-api` row.
   - Root Directory: **`catalog-api`**, Framework Preset: **Other** (not Express)
   - Leave the other settings (`catalog-api/vercel.json` sets them) → *Deploy*.
   - (In our deployment this project kept the default name `mfe-composition-benchmark`.)
   - Check `https://mfe-catalog-api.vercel.app/products` shows 20 products and
     `https://mfe-catalog-api.vercel.app/products/1` one product. Note the URL.
4. **Project A:** *Add New… → Project* → import `mfe-composition-benchmark`.
   - Project Name: `mfe-a-module-federation`
   - Framework Preset: **Other**
   - Root Directory: leave as `./`
   - Build Command (Override): `node tools/vercel-build.mjs a`
   - Install Command (Override): `npm ci`
   - Output Directory: leave empty (the build writes `.vercel/output` itself)
   - Environment Variables: `API_URL` = the catalogue API URL from step 3 (no trailing slash)
   - *Deploy*.
5. **Project B:** same as A, with name `mfe-b-single-spa`, Build Command
   `node tools/vercel-build.mjs b` and the same `API_URL`.
6. **Project C:** import the same repository again.
   - Project Name: `mfe-c-nextjs-rsc`
   - Root Directory: **`c-nextjs-rsc/host`** (Framework Preset then shows **Next.js**)
   - Leave Build / Install commands as they are (`vercel.json` sets them)
   - Environment Variables: the same `API_URL`
   - Make sure *Include files outside the root directory* is enabled (default), because
     the MFE packages live in sibling folders.
   - *Deploy*.
7. **Check** each production URL (`https://<project>.vercel.app`): Home, Shop, a product,
   add to cart, Cart. The footer shows which composition strategy is running.

## Measuring the deployed sites

Our cloud workspace cannot open `*.vercel.app` (network policy), so the benchmark of the
deployed sites runs on a **GitHub Actions** runner (free for public repositories):

- GitHub → *Actions* → **Benchmark** → *Run workflow*:
  `target = deployed`, `a_url / b_url / c_url` = the three production URLs,
  `warmup = 1` (wakes C's serverless function and fills the CDN before each audit; the
  browser cache is still cold), `runs = 5`, `label = vercel-run1`.
- The same workflow with `target = local` builds A, B and C on the runner and measures them
  on `localhost` — the controlled comparison (same machine, same server conditions).
- Results are committed to the branch `bench-results/<label>` and uploaded as an artifact.

## Things that differ from the local setup (threats to validity)

- A and B are same-origin on Vercel (`/mfe/<name>/`); locally every MFE has its own port.
- Vercel serves with HTTP/2 and Brotli; locally Express serves HTTP/1.1 with gzip.
- C runs on a serverless function (possible cold start → use `warmup = 1`).
- The GitHub runner, Vercel's `iad1` region and the catalogue API are all on the public internet;
  their distance adds latency on top of the throttling profiles.
- If `API_URL` is changed, A, B and C must be redeployed (it is built into the bundles).
