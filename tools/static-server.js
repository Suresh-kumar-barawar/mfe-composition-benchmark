/**
 * Identical production server for all client-rendered builds (Implementations A and B),
 * so hosting differences do not affect the benchmark.
 *   node tools/static-server.js <dir> <port> [--spa]
 * - gzip compression for every response
 * - long cache only for content-hashed assets (name.1a2b3c4d.js); everything else
 *   (HTML, remoteEntry.js, Single-SPA import-map entries) is revalidated
 * - CORS enabled (remotes are loaded cross-origin by the shell)
 * - --spa: unknown routes fall back to index.html (client-side routing)
 */
const path = require('path');
const express = require('express');
const compression = require('compression');

const [dirArg, portArg, ...flags] = process.argv.slice(2);
if (!dirArg || !portArg) {
  console.error('Usage: node static-server.js <dir> <port> [--spa]');
  process.exit(1);
}
const root = path.resolve(dirArg);
const port = Number(portArg);
const spa = flags.includes('--spa');

const app = express();
app.use(compression());
app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  next();
});
app.use(
  express.static(root, {
    setHeaders(res, file) {
      const hashed = /\.[0-9a-f]{8}\.(js|css)$/.test(path.basename(file));
      res.set('Cache-Control', hashed ? 'public, max-age=31536000, immutable' : 'no-cache');
    },
  })
);
if (spa) app.get('*', (req, res) => res.sendFile(path.join(root, 'index.html')));

app.listen(port, () => console.log(`Serving ${root} on http://localhost:${port}${spa ? ' (SPA)' : ''}`));
