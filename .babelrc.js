module.exports = {
  presets: [[
    '@babel/preset-env', process.env.PRESERVE_ES_IMPORTS ? { 'modules': false } : {}
  ]],
  plugins: [
    '@babel/plugin-proposal-object-rest-spread',
    '@babel/plugin-transform-runtime',
    '@babel/plugin-proposal-export-default-from',
    'ramda'
  ]
}
