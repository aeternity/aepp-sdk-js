module.exports = {
  require: 'tooling/babel-register.js',
  recursive: true,
  extension: '.js,.ts',
  timeout: '40s',
  ignore: 'test/environment/**',
  exit: true // TODO: fix in state channel tests
}
