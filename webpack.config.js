const webpack = require('webpack')
const path = require('path')
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')

function configure (filename, opts = {}) {
  return (env, argv) => ({
    entry: './src/index.ts',
    mode: 'development', // automatically overriden by production flag
    devtool: argv.mode === 'production' ? 'source-map' : 'eval-source-map',
    module: {
      rules: [
        {
          test: /\.(js|ts)$/,
          include: path.resolve(__dirname, 'src'),
          loader: 'babel-loader'
        }
      ]
    },
    resolve: {
      extensions: ['.ts', '.js'],
      fallback: {
        buffer: require.resolve('buffer/')
      },
      alias: {
        'js-yaml': false
      }
    },
    plugins: [
      ...opts.target === 'node'
        ? []
        : [new webpack.ProvidePlugin({
            process: 'process',
            Buffer: ['buffer', 'Buffer']
          })],
      ...argv.report
        ? [new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            reportFilename: filename + '.html',
            openAnalyzer: false
          })]
        : []
    ],
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename,
      library: {
        name: 'Ae',
        type: 'umd'
      }
    },
    externals: Object.fromEntries([
      ...Object.keys(require('./package').dependencies),
      '@aeternity/argon2-browser/dist/argon2-bundled.min.js'
    ].map((dependency) => [dependency, dependency])),
    ...opts
  })
}

module.exports = [
  configure('aepp-sdk.js', { target: 'node' }),
  configure('aepp-sdk.browser.js'),
  configure('aepp-sdk.browser-script.js', { externals: undefined })
]
