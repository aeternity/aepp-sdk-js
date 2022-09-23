const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

module.exports = {
  entry: './browser.mjs',
  mode: 'production',
  target: 'browserslist:browser',
  output: {
    path: path.resolve(__dirname, './browser'),
  },
  plugins: [
    new HtmlWebpackPlugin(),
    new webpack.ProvidePlugin({ Buffer: ['buffer', 'Buffer'] }),
  ],
  experiments: {
    topLevelAwait: true,
  },
  optimization: {
    minimize: false,
  },
};
