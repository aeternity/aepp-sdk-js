const path = require('path')

module.exports = (env, argv) => {
  return {
    entry: './src/index.js',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'aepp-sdk.js',
      library: 'AeternityClient',
      libraryTarget: 'umd',
      umdNamedDefine: true,
      globalObject: 'typeof self !== \'undefined\' ? self : this'
    },
    mode: 'development',
    target: 'node',
    node: { process: false },
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
    },
    externals: {
      crypto: 'crypto'
    }
  }
}
