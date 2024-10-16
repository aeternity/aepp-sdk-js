const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './browser.js',
  mode: 'production',
  target: 'browserslist:browser',
  output: {
    path: path.resolve(__dirname, './browser'),
  },
  plugins: [new HtmlWebpackPlugin(), new webpack.ProvidePlugin({ Buffer: ['buffer', 'Buffer'] })],
  experiments: {
    topLevelAwait: true,
  },
  optimization: {
    minimize: false,
  },
};
