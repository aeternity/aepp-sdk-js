const config = require('./babel.config');

config.presets
  .filter((plugin) => Array.isArray(plugin))
  .find(([name]) => name === '@babel/preset-env')[1].modules = false;

config.plugins.push(
  ['add-import-extension', { extension: 'mjs' }],
  [
    'import-globals',
    {
      Buffer: { moduleName: 'buffer', exportName: 'Buffer' },
    },
  ],
  ['transform-default-named-imports', { exclude: ['@scure/bip39'] }],
);
config.plugins = config.plugins.filter((p) => p !== 'babel-plugin-transform-import-meta');

module.exports = config;
