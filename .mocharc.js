module.exports = {
  require: 'tooling/babel-register.js',
  recursive: true,
  extension: '.js,.ts',
  timeout: '40s',
  exit: true // TODO: fix in state channel tests
}
