const path = require('path')
const { defineConfig } = require('@vue/cli-service')
const config = require('../../../webpack.config')

const sdkWebpackConfig = config[1]({}, {})

module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    port: 9001
  },
  configureWebpack: {
    resolve: {
      alias: {
        '@aeternity/aepp-sdk': path.join(__dirname, '..', '..', '..', 'es')
      },
      fallback: sdkWebpackConfig.resolve.fallback
    },
    plugins: [
      sdkWebpackConfig.plugins[0]
    ]
  }
})
