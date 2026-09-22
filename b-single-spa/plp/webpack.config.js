const createConfig = require('../webpack.base');

module.exports = createConfig({ dirname: __dirname, name: 'shop-plp', port: 3103, filename: 'shop-plp.js' });
