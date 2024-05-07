module.exports = {
  require: 'tooling/babel-register.js',
  recursive: true,
  extension: '.js,.ts',
  timeout: process.env.NETWORK ? '500s' : '6s',
  ignore: 'test/environment/**',
}
