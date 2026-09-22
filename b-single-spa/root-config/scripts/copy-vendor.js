/**
 * Copies the shared runtime libraries (React, ReactDOM, single-spa, SystemJS) into the
 * root-config output so they are self-hosted on the same server, not a public CDN.
 *   node scripts/copy-vendor.js <outDir>
 */
const fs = require('fs');
const path = require('path');

function pkgDir(name) {
  let dir = __dirname;
  while (dir !== path.dirname(dir)) {
    const candidate = path.join(dir, 'node_modules', name);
    if (fs.existsSync(path.join(candidate, 'package.json'))) return candidate;
    dir = path.dirname(dir);
  }
  throw new Error(`Cannot find package ${name}`);
}

const files = {
  'react.production.min.js': ['react', 'umd/react.production.min.js'],
  'react-dom.production.min.js': ['react-dom', 'umd/react-dom.production.min.js'],
  'single-spa.min.js': ['single-spa', 'lib/es2015/system/single-spa.min.js'],
  'system.min.js': ['systemjs', 'dist/system.min.js'],
  'amd.min.js': ['systemjs', 'dist/extras/amd.min.js'],
};

const out = path.resolve(process.argv[2] || 'dist/vendor');
fs.mkdirSync(out, { recursive: true });
for (const [target, [pkg, rel]] of Object.entries(files)) {
  fs.copyFileSync(path.join(pkgDir(pkg), rel), path.join(out, target));
}
console.log(`Vendor libraries copied to ${out}`);
