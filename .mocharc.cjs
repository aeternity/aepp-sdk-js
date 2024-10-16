module.exports = {
  'node-option': ['import=tsx'],
  recursive: true,
  extension: '.ts',
  timeout: process.env.NETWORK ? '30s' : '6s',
  ignore: 'test/environment/**',
};
