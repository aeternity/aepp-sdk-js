module.exports = {
  require: [
    '@babel/register',
    'ts-node/register'
  ],
  recursive: true,
  extension: '.js,.ts',
  timeout: '40s',
  exit: true // TODO: fix in state channel tests
}
