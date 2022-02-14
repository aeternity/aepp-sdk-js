const path = require('path')
const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  devServer: {
    port: 9001
  },
  configureWebpack: {
    resolve: {
      alias: {
        '@aeternity/aepp-sdk': path.join(__dirname, '..', '..', '..', 'es')
      }
    }
  }
})
