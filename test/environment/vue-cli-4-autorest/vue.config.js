const path = require('path');

module.exports = {
  // this workaround is only needed when sdk is not in the node_modules folder
  chainWebpack: (config) => {
    const sdkPath = path.join(__dirname, '..', '..', '..', 'es');
    config.module.rule('mjs').include.add(sdkPath);
    // aepp-calldata ships its code as .cjs, which vue cli 4 doesn't transpile by default
    config.module.rule('js').test(/\.(c|m)?jsx?$/);
  },
  transpileDependencies: ['@aeternity/aepp-calldata'],
};
