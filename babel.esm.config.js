import config from './babel.config.js';

config.presets
  .filter((plugin) => Array.isArray(plugin))
  .find(([name]) => name === '@babel/preset-env')[1].modules = false;

config.plugins.push(
  ['add-import-extension', { extension: 'js' }],
  [
    'import-globals',
    {
      Buffer: { moduleName: 'buffer', exportName: 'Buffer' },
    },
  ],
);
config.plugins = config.plugins.filter((p) => p !== 'babel-plugin-transform-import-meta');

export default config;
