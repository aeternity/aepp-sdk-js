const path = require('path')

const common = (env, argv) => {
  return {
    entry: './src/index.js',
    mode: 'development',
    devtool: argv.mode === 'production' ? false : 'eval-source-map',
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
    }
  }
}

function configure (filename, opts = {}) {
  return (env, argv) => Object.assign({
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename
    }
  }, common(env, argv), opts)
}

module.exports = [
  configure('aepp-sdk.js', { target: 'node' }),
  configure('aepp-sdk.browser.js')
]
