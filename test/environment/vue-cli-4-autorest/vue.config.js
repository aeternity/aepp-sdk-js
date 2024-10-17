const path = require('path');

module.exports = {
  // this workaround is only needed when sdk is not in the node_modules folder
  chainWebpack: (config) => {
    const sdkPath = path.join(__dirname, '..', '..', '..', 'es');
    config.module.rule('mjs').include.add(sdkPath);
  },
  transpileDependencies: ['@aeternity/aepp-calldata'],
};
