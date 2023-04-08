const path = require('path');

module.exports = {
  pages: {
    popup: {
      template: 'public/browser-extension.html',
      entry: './src/popup.js',
      title: 'Popup',
    },
  },
  pluginOptions: {
    browserExtension: {
      componentOptions: {
        background: {
          entry: 'src/background.js',
        },
        contentScripts: {
          entries: {
            'content-script': [
              'src/content-script.js',
            ],
          },
        },
      },
    },
  },
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
