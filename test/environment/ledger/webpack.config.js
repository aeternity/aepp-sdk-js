import path from 'path';
import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';

export default {
  entry: './browser.js',
  mode: 'production',
  target: 'browserslist:browser',
  output: {
    path: path.resolve(import.meta.dirname, './browser'),
  },
  plugins: [new HtmlWebpackPlugin(), new webpack.ProvidePlugin({ Buffer: ['buffer', 'Buffer'] })],
  experiments: {
    topLevelAwait: true,
  },
  optimization: {
    minimize: false,
  },
};
