const config = require('./babel.config.js')

config.presets
  .filter(plugin => Array.isArray(plugin))
  .find(([name]) => name === '@babel/preset-env')[1].modules = false

config.plugins.push(['add-import-extension', { extension: 'mjs' }])
config.plugins.push('transform-default-named-imports')

module.exports = config
