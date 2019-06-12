module.exports = {
  parser: 'postcss',
  plugins: {
    'postcss-import': {},
    'tailwindcss': './tailwind.js',
    // 'postcss-cssnext': {},
    'autoprefixer': {'browsers': 'last 2 versions'},
    'cssnano': {
      'preset': [
        'default',
        {'discardComments': {'removeAll': true}}
      ]
    }
    // 'postcss-cssnext': options.cssnext ? options.cssnext : false,
    // 'autoprefixer': env == 'production' ? options.autoprefixer : false,
    // 'cssnano': env === 'production' ? options.cssnano : false
  }
}
