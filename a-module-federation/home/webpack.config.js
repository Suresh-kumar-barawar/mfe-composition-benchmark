const createConfig = require('../webpack.base');

module.exports = createConfig({
  dirname: __dirname,
  name: 'home',
  port: 3001,
  exposes: { './HomePage': './src/HomePage.jsx' },
});
