# Qualitative comparison (A – Module Federation, B – Single-SPA, C – Next.js RSC)

Evidence comes from building, testing and deploying the same shop three times (Oct 2026).
Numbers marked *measured* were measured in this repository; the rest are observations made
while building the implementations.

## Summary table

| Dimension | A – Module Federation | B – Single-SPA | C – Next.js RSC |
|---|---|---|---|
| Where the page is composed | Browser (host shell loads remotes) | Browser (root config mounts apps by URL) | Server (one Next.js app renders MFE packages) |
| Separately built units *(measured)* | 5 (shell + 4 remotes) | 6 (root config + navbar + 4 apps) | 1 (host; MFEs are packages inside it) |
| Independent deployment of one MFE *(tested)* | **Yes** – changed Home, rebuilt only the Home remote (6.8 s); the running shell showed it on reload | **Yes** – rebuilt only the Home app (1.9 s); shown on reload, import map unchanged | **No** – the Home package is compiled into the app: full rebuild + restart (17.1 s) before it appeared |
| Clean build, all units *(measured, median of 3, 2 vCPU)* | 31.4 s (5 webpack builds) | 15.4 s (6 small builds + vendor) | 20.9 s (one Next.js build) |
| Composition-specific code *(measured, non-blank lines)* | 336 lines, 6 webpack configs, 5 packages | 416 lines, 8 webpack configs, 6 packages | 243 lines, 1 Next.js config, 6 packages |
| Shared dependencies | Webpack negotiates singletons at runtime (version ranges checked) | Import map, loaded once; versions must be kept in step by hand | One framework build; Next.js decides the React version |
| First HTML / SEO *(measured)* | Empty 363-byte shell, no products | 1.5 KB layout, no products (hidden "Page not found" heading) | Full content (14–30 KB, all product names and headings) |
| Error isolation *(tested)* | Good: remote server down → only its route shows a fallback | Good: app fails to load → global handler shows a fallback | Good: an MFE that throws while rendering → only its section shows a fallback (HTTP 200); an MFE cannot be "down" on its own because all run in one server |
| Runtime needed in production | Static files only (CDN) | Static files only (CDN) | A Node.js server / serverless functions |
| Deployment on Vercel | Needed a custom build script (`tools/vercel-build.mjs`) to publish 5 units as one site | Same custom script for 6 units | Zero-config (framework preset) |
| CI/CD pipelines if teams are separate | One per unit (5) | One per unit (6) | One for the app (MFE teams share it) |
| Running one MFE alone during development | Yes (each remote has a standalone mode) | No – apps need the root config | Not separately – MFE packages run inside the host |

## How the measurements were made

- **Build time:** `npm run a:build` / `b:build` / `c:build` from clean output folders, 3 times
  each, on the 2-vCPU cloud workspace (15 Oct 2026).
- **Independent deployment:** a visible text line was added to the Home MFE of each
  implementation; only that unit was rebuilt (A: `npm run build -w a-home`, B: `-w b-home`)
  while all other servers kept running unchanged; then the site was reloaded. For C the whole
  host had to be rebuilt and restarted. The change was reverted afterwards.
- **First HTML / SEO:** `curl` of `/`, `/products`, `/product/1` without running JavaScript.
- **Error isolation:** A/B – the cart MFE's server was stopped; C – `C_FAIL_MFE=<mfe>` makes one
  MFE throw while rendering (see README).

## Developer-experience observations

**A – Module Federation**
- Needs an asynchronous bootstrap file in every app so shared modules (React) are negotiated
  before any code runs – easy to forget, and the error message is not obvious.
- Remote URLs are fixed at build time (`A_*_URL`); moving a remote means rebuilding the shell.
- The shell downloads all four `remoteEntry.js` manifests on every page, even though only one
  page is shown – small with 4 MFEs, grows with more.

**B – Single-SPA**
- Integration errors appear only at runtime in the browser: webpack trimmed `import * as React`
  in production and every app crashed (`React.createElement is not a function`).
- React 19 no longer ships UMD files, so React had to be compiled into SystemJS modules
  ourselves (`root-config/webpack.vendor.js`). Upgrades of shared libraries are manual.
- Every app depends on the root config's import map, layout slots and routing rules.
- Loader chain: HTML → SystemJS → root config → single-spa → apps → React. Each step waits for
  the previous one, which is why B shows content later than A on 4G despite less JavaScript.

**C – Next.js React Server Components**
- Next.js always runs its own built-in React version (19.2 canary), not the one the team installs.
- Server/client boundary rules shape the code: functions cannot be passed from server to client
  components, so small client wrappers were needed (header search, listing filters, cart).
- Defaults matter for performance: link prefetching is on by default (switched off here for a
  fair comparison) and pages had to be forced to render per request (`dynamic = 'force-dynamic'`).
- Error isolation needs a Suspense boundary around each MFE, otherwise one failing MFE breaks
  the whole server response.
- Deployment is the simplest of the three, but all MFEs ship together.

**All three**
- Depending on a public third-party API was a risk: fakestoreapi.com blocks cloud/CI machines
  (HTTP 403 bot check), so the data and images were moved to our own catalogue API.
- Lab measurements need validation: headless Chrome under Lighthouse delayed the first paint
  of B and C until the runner was fixed (`docs/MEASUREMENT_VALIDATION.md`).
- Testing on a phone-sized screen found a shared header bug (cart link off screen), and after
  fixing it, a footer layout shift in A and B (`docs/EXPERIMENTS.md`).
