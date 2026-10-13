/**
 * Builds React, ReactDOM and ReactDOM/client as self-hosted SystemJS modules.
 * React 19 dropped the UMD files (umd/*.production.min.js) that the import map used with React 18,
 * so we compile them ourselves. They are still served from the root-config server (no public CDN).
 *   webpack --config webpack.vendor.js --env out=dist/vendor
 * react-dom and react-dom/client mark React (and ReactDOM) as externals so that every app shares
 * one React instance, exactly as with the old UMD files.
 */
const path = require('path');

const vendor = (name, externals) => (env = {}) => ({
  name,
  mode: 'production',
  entry: { [name]: `./vendor-src/${name}.js` },
  output: {
    path: path.resolve(__dirname, env.out || 'dist/vendor'),
    filename: '[name].production.min.js',
    library: { type: 'system' },
    uniqueName: `shop-vendor-${name}`,
  },
  externals,
  module: { rules: [{ parser: { system: false } }] },
  optimization: { splitChunks: false },
  performance: { hints: false },
});

module.exports = [
  vendor('react', []),
  vendor('react-dom', ['react']),
  vendor('react-dom-client', ['react', 'react-dom']),
];
