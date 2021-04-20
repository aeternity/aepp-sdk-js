const config = require('./babel.config.json')

config.presets[0] = ['@babel/preset-env', { modules: false }]

module.exports = config
