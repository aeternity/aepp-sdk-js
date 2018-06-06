const path = require('path')
const R = require('ramda')

function configure (filename, opts = {}) {
  return (env, argv) => R.mergeDeepLeft({
    entry: './src/index.js',
    mode: 'development', // automatically overriden by production flag
    devtool: argv.mode === 'production' ? 'source-map' : 'eval-source-map',
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          loader: 'babel-loader!standard-loader?error=true'
        },
        {
          test: /^assets\/swagger\/.*\.json$/,
          loader: 'import-glob-loader'
        }
      ]
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename,
      library: 'Ae'
    }
  }, opts)
}

module.exports = [
  configure('aepp-sdk.js', { target: 'node', output: { libraryTarget: 'umd' }}),
  configure('aepp-sdk.browser.js')
]
