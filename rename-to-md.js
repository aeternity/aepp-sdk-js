const Rename = require('recursive-rename')
const path = require('path')

const rename = new Rename({
  src: 'html',
  dest: 'md',
  path: path.resolve(process.cwd(), './docs'),
  dry: true
})

rename.dive()