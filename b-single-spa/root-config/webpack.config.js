const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const createConfig = require('../webpack.base');

// App URLs are injected into the import map at build time (local ports by default, cloud URLs later).
const url = (envVar, fallback) => process.env[envVar] || fallback;
const urls = {
  navbar: url('B_NAVBAR_URL', 'http://localhost:3101'),
  home: url('B_HOME_URL', 'http://localhost:3102'),
  plp: url('B_PLP_URL', 'http://localhost:3103'),
  pdp: url('B_PDP_URL', 'http://localhost:3104'),
  cart: url('B_CART_URL', 'http://localhost:3105'),
};

module.exports = createConfig({
  dirname: __dirname,
  name: 'shop-root-config',
  port: 3100,
  filename: 'shop-root-config.js',
  extraPlugins: [
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'src', 'index.ejs'),
      inject: false, // the root config is loaded by SystemJS, not by a <script> tag
      templateParameters: { urls },
    }),
  ],
  devServer: { static: path.join(__dirname, 'public') },
});
