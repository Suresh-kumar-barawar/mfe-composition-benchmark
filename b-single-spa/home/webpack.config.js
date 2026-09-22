const createConfig = require('../webpack.base');

module.exports = createConfig({ dirname: __dirname, name: 'shop-home', port: 3102, filename: 'shop-home.js' });
