const createConfig = require('../webpack.base');

module.exports = createConfig({
  dirname: __dirname,
  name: 'plp',
  port: 3002,
  exposes: { './ListingPage': './src/ListingPage.jsx' },
});
