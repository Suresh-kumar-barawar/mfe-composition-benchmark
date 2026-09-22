const createConfig = require('../webpack.base');
const { remoteUrl } = createConfig;

module.exports = createConfig({
  dirname: __dirname,
  name: 'shell',
  port: 3000,
  isShell: true,
  remotes: {
    home: `home@${remoteUrl('A_HOME_URL', 'http://localhost:3001')}/remoteEntry.js`,
    plp: `plp@${remoteUrl('A_PLP_URL', 'http://localhost:3002')}/remoteEntry.js`,
    pdp: `pdp@${remoteUrl('A_PDP_URL', 'http://localhost:3003')}/remoteEntry.js`,
    cart: `cart@${remoteUrl('A_CART_URL', 'http://localhost:3004')}/remoteEntry.js`,
  },
});
