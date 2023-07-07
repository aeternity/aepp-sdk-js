const { defineConfig } = require('@vue/cli-service');

module.exports = defineConfig({
  publicPath: process.env.PUBLIC_PATH ?? '/',
  devServer: {
    port: 9001,
  },
});
