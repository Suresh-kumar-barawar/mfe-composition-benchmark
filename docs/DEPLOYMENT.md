# Deploying A, B and C on Vercel (free Hobby plan)

All three implementations are deployed on **one platform** so that hosting differences are
kept as small as possible. Vercel's Hobby plan is free for personal, non-commercial work
and needs no credit card.

| Vercel project | Implementation | Root Directory | Framework preset | Build Command |
|---|---|---|---|---|
| `mfe-a-module-federation` | A – Module Federation | `./` (repo root) | Other | `node tools/vercel-build.mjs a` |
| `mfe-b-single-spa` | B – Single-SPA | `./` (repo root) | Other | `node tools/vercel-build.mjs b` |
| `mfe-c-nextjs-rsc` | C – Next.js RSC | `c-nextjs-rsc/host` | Next.js | from `c-nextjs-rsc/host/vercel.json` |

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
3. **Project A:** *Add New… → Project* → import `mfe-composition-benchmark`.
   - Project Name: `mfe-a-module-federation`
   - Framework Preset: **Other**
   - Root Directory: leave as `./`
   - Build Command (Override): `node tools/vercel-build.mjs a`
   - Install Command (Override): `npm ci`
   - Output Directory: leave empty (the build writes `.vercel/output` itself)
   - *Deploy*.
4. **Project B:** same as A, with name `mfe-b-single-spa` and Build Command
   `node tools/vercel-build.mjs b`.
5. **Project C:** import the same repository again.
   - Project Name: `mfe-c-nextjs-rsc`
   - Root Directory: **`c-nextjs-rsc/host`** (Framework Preset then shows **Next.js**)
   - Leave Build / Install commands as they are (`vercel.json` sets them)
   - Make sure *Include files outside the root directory* is enabled (default), because
     the MFE packages live in sibling folders.
   - *Deploy*.
6. **Check** each production URL (`https://<project>.vercel.app`): Home, Shop, a product,
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
- The GitHub runner, Vercel's `iad1` region and the FakeStore API are all on the public
  internet; their distance adds latency on top of the throttling profiles.
