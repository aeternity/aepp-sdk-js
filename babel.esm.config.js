const config = require('./babel.config.json')

config.presets[0] = ['@babel/preset-env', { modules: false }]
config.plugins.push(['add-import-extension', { extension: 'mjs' }])
config.plugins.push('transform-default-named-imports')

module.exports = config
