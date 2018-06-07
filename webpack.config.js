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
          include: path.resolve(__dirname, 'src'),
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
      library: 'Ae',
      libraryTarget: 'umd'
    }
  }, opts)
}

module.exports = [
  configure('aepp-sdk.js', { target: 'node' }),
  configure('aepp-sdk.browser.js')
]
