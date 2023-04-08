const webpack = require('webpack');
const path = require('path');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const { dependencies } = require('./package.json');
const babelConfig = require('./babel.config');

function configure(filename, opts = {}) {
  const isNode = opts.target.includes('node');
  return (env) => ({
    entry: `./src/index${isNode ? '' : '-browser'}.ts`,
    mode: 'production',
    devtool: 'source-map',
    module: {
      rules: [
        {
          test: /\.(js|ts)$/,
          include: path.resolve(__dirname, 'src'),
          loader: 'babel-loader',
          options: { ...babelConfig, browserslistEnv: opts.target.split(':')[1] },
        },
      ],
    },
    optimization: {
      minimize: !isNode,
    },
    resolve: {
      extensions: ['.ts', '.js'],
      fallback: isNode ? {} : {
        buffer: require.resolve('buffer/'),
        child_process: false,
        os: false,
        path: false,
        'fs/promises': false,
        url: false,
      },
    },
    plugins: [
      ...isNode
        ? []
        : [new webpack.ProvidePlugin({
          process: 'process',
          Buffer: ['buffer', 'Buffer'],
        })],
      ...env.REPORT
        ? [new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          reportFilename: `${filename}.html`,
          openAnalyzer: false,
        })]
        : [],
    ],
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename,
      library: {
        name: 'Aeternity',
        type: 'umd',
      },
    },
    externals: Object.fromEntries(
      Object.keys(dependencies).map((dependency) => [dependency, dependency]),
    ),
    ...opts,
  });
}

module.exports = [
  configure('aepp-sdk.js', { target: 'browserslist:node' }),
  configure('aepp-sdk.browser.js', { target: 'browserslist:browser' }),
  configure('aepp-sdk.browser-script.js', { target: 'browserslist:browser', externals: undefined }),
];
