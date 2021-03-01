const fs = require('fs-extra')

fs.move('es', 'es_src')
  .then(() => fs.remove('es'))
  .then(() => fs.move('dist/es', 'es'))
