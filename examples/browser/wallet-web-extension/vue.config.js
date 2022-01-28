const path = require('path')

module.exports = {
  pages: {
    popup: {
      template: 'public/browser-extension.html',
      entry: './src/popup.js',
      title: 'Popup'
    }
  },
  pluginOptions: {
    browserExtension: {
      componentOptions: {
        background: {
          entry: 'src/background.js'
        },
        contentScripts: {
          entries: {
            'content-script': [
              'src/content-script.js'
            ]
          }
        }
      }
    }
  },
  // the workarounds that are only needed when sdk is not in the node_modules folder
  chainWebpack: config => {
    const sdkPath = path.join(__dirname, '..', '..', '..', 'es')
    config.resolve.alias.set('@aeternity/aepp-sdk', sdkPath)
    config.module.rule('mjs').include.add(sdkPath)
  }
}
