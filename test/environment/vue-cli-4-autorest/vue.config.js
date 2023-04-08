const path = require('path');

module.exports = {
  // required for `instanceof RestError`
  configureWebpack: {
    resolve: {
      alias: {
        '@azure/core-client': '@azure/core-client/dist-esm/src/index.js',
        '@azure/core-rest-pipeline': '@azure/core-rest-pipeline/dist-esm/src/index.js',
      },
    },
  },
  // this workaround is only needed when sdk is not in the node_modules folder
  chainWebpack: (config) => {
    const sdkPath = path.join(__dirname, '..', '..', '..', 'es');
    config.module.rule('mjs').include.add(sdkPath);
  },
};
