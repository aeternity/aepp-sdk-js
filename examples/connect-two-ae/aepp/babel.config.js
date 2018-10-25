module.exports = {
  presets: ['@babel/preset-env'],
  ignore: [/[/\\]core-js/, /@babel[/\\]runtime/],
  plugins: [
    '@babel/plugin-proposal-object-rest-spread',
    '@babel/plugin-transform-runtime',
    '@babel/plugin-proposal-export-default-from'
  ]
}
