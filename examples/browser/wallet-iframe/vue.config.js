const path = require('path')
const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  devServer: {
    port: 9000
  },
  configureWebpack: {
    resolve: {
      alias: {
        '@aeternity/aepp-sdk': path.join(__dirname, '..', '..', '..', 'es')
      }
    }
  }
})
