const path = require('path')
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')

function configure (filename, opts = {}) {
  return (env, argv) => ({
    entry: './src/index.js',
    mode: 'development', // automatically overriden by production flag
    devtool: argv.mode === 'production' ? 'source-map' : 'eval-source-map',
    module: {
      rules: [
        {
          test: /\.(js|ts)$/,
          include: path.resolve(__dirname, 'src'),
          loader: 'babel-loader'
        },
        {
          test: /\.js$/,
          include: path.resolve(__dirname, 'node_modules/rlp'),
          loader: 'babel-loader',
          options: { presets: ['@babel/preset-env'] }
        }
      ]
    },
    resolve: {
      extensions: ['.ts', '.js'],
      fallback: {
        buffer: require.resolve('buffer/'),
        path: require.resolve('path-browserify'),
        stream: require.resolve('stream-browserify'),
        crypto: require.resolve('crypto-browserify')
      }
    },
    plugins: argv.report ? [
      new BundleAnalyzerPlugin({
        analyzerMode: 'static',
        reportFilename: filename + '.html',
        openAnalyzer: false
      })
    ] : [],
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename,
      library: 'Ae',
      libraryTarget: 'umd'
    },
    externals: Object
      .keys(require('./package').dependencies)
      .reduce((p, dependency) => ({
        ...p,
        [dependency]: {
          commonjs: dependency,
          commonjs2: dependency
        }
      }), {}),
    ...opts
  })
}

module.exports = [
  configure('aepp-sdk.js', { target: 'node' }),
  configure('aepp-sdk.browser.js'),
  configure('aepp-sdk.browser-script.js', { externals: undefined })
]
