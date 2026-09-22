const createConfig = require('../webpack.base');

module.exports = createConfig({
  dirname: __dirname,
  name: 'cart',
  port: 3004,
  exposes: { './CartPage': './src/CartPage.jsx' },
});
