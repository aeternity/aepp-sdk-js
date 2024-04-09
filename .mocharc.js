module.exports = {
  require: 'tooling/babel-register.js',
  recursive: true,
  extension: '.js,.ts',
  timeout: process.env.NETWORK ? '500s' : '40s',
  ignore: 'test/environment/**',
  exit: true // TODO: fix in state channel tests
}
