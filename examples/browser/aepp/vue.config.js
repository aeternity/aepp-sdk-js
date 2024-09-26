const { defineConfig } = require('@vue/cli-service');
const webpack = require('webpack');

module.exports = defineConfig({
  publicPath: process.env.PUBLIC_PATH ?? '/',
  devServer: {
    port: 9001,
  },
  configureWebpack: {
    plugins: [new webpack.ProvidePlugin({ Buffer: ['buffer', 'Buffer'] })],
  },
});
