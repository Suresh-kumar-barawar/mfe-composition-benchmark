const createConfig = require('../webpack.base');

module.exports = createConfig({
  dirname: __dirname,
  name: 'pdp',
  port: 3003,
  exposes: { './DetailPage': './src/DetailPage.jsx' },
});
