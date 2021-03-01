const fs = require('fs-extra')

fs.remove('es')
  .then(() => fs.move('es_src', 'es'))
