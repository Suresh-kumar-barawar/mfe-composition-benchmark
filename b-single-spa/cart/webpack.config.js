const createConfig = require('../webpack.base');

module.exports = createConfig({ dirname: __dirname, name: 'shop-cart', port: 3105, filename: 'shop-cart.js' });
