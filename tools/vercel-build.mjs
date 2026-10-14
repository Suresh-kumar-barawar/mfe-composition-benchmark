/**
 * Builds Implementation A or B for static hosting on Vercel (free Hobby plan) using the
 * Vercel Build Output API (.vercel/output). Used as the "Build Command" of the Vercel
 * project; C is deployed as a normal Next.js project and does not need this script.
 *
 *   node tools/vercel-build.mjs a     # Module Federation  -> .vercel/output
 *   node tools/vercel-build.mjs b     # Single-SPA         -> .vercel/output
 *
 * Every micro frontend is still built separately (5 builds for A, 6 for B, as locally),
 * but they are published on one site under /mfe/<name>/ so that one Vercel project per
 * implementation is enough (3 projects in total instead of 12). The entry app (A's shell,
 * B's root-config) is served at "/".
 *
 * Response headers mirror tools/static-server.js, which serves A and B locally:
 *   - files with an 8-character content hash (name.1a2b3c4d.js/.css): cached for a year
 *   - everything else (HTML, remoteEntry.js, import-map entries): Cache-Control no-cache
 *   - unknown routes fall back to index.html (client-side routing)
 * Compression (gzip/brotli) and HTTP/2 are provided by Vercel's CDN.
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const which = (process.argv[2] || '').toLowerCase();

const PLANS = {
  a: {
    script: 'a:build',
    entry: 'a-module-federation/shell',
    mfes: { home: 'a-module-federation/home', plp: 'a-module-federation/plp', pdp: 'a-module-federation/pdp', cart: 'a-module-federation/cart' },
    env: (m) => ({ A_HOME_URL: m('home'), A_PLP_URL: m('plp'), A_PDP_URL: m('pdp'), A_CART_URL: m('cart') }),
  },
  b: {
    script: 'b:build',
    entry: 'b-single-spa/root-config',
    mfes: {
      navbar: 'b-single-spa/navbar',
      home: 'b-single-spa/home',
      plp: 'b-single-spa/plp',
      pdp: 'b-single-spa/pdp',
      cart: 'b-single-spa/cart',
    },
    env: (m) => ({ B_NAVBAR_URL: m('navbar'), B_HOME_URL: m('home'), B_PLP_URL: m('plp'), B_PDP_URL: m('pdp'), B_CART_URL: m('cart') }),
  },
};

const plan = PLANS[which];
if (!plan) {
  console.error('Usage: node tools/vercel-build.mjs <a|b>');
  process.exit(1);
}

// 1. Build every unit with root-relative MFE URLs (same origin, path prefix per MFE).
const mfeUrl = (name) => `/mfe/${name}`;
execSync(`npm run ${plan.script}`, { cwd: ROOT, stdio: 'inherit', env: { ...process.env, ...plan.env(mfeUrl) } });

// 2. Assemble the static output: entry app at "/", each MFE at /mfe/<name>/.
const out = path.join(ROOT, '.vercel', 'output');
const stat = path.join(out, 'static');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(stat, { recursive: true });
fs.cpSync(path.join(ROOT, plan.entry, 'dist'), stat, { recursive: true });
for (const [name, dir] of Object.entries(plan.mfes)) {
  fs.cpSync(path.join(ROOT, dir, 'dist'), path.join(stat, 'mfe', name), { recursive: true });
}
// Bundle-analyzer artefacts are not part of the site.
for (const f of fs.readdirSync(stat, { recursive: true })) {
  if (/(bundle-report\.html|stats\.json)$/.test(f)) fs.rmSync(path.join(stat, f));
}

// 3. Routing and headers (Build Output API v3).
const HASHED = '.*\\.[0-9a-f]{8}\\.(?:js|css)$';
const config = {
  version: 3,
  routes: [
    { src: `/(${HASHED})`, headers: { 'Cache-Control': 'public, max-age=31536000, immutable', 'Access-Control-Allow-Origin': '*' }, continue: true },
    { src: `/((?!${HASHED}).*)`, headers: { 'Cache-Control': 'no-cache', 'Access-Control-Allow-Origin': '*' }, continue: true },
    { handle: 'filesystem' },
    { src: '/mfe/.*', status: 404 }, // a missing MFE file is an error, not a page
    { src: '/.*', dest: '/index.html' }, // client-side routes (/products, /product/1, /cart)
  ],
};
fs.writeFileSync(path.join(out, 'config.json'), JSON.stringify(config, null, 2));

const files = fs.readdirSync(stat, { recursive: true }).filter((f) => fs.statSync(path.join(stat, f)).isFile());
console.log(`\nVercel output for ${which.toUpperCase()}: ${files.length} files in ${path.relative(ROOT, out)}`);
