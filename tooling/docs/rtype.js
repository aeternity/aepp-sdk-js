const R = require('ramda')

exports.handlers = {
  newDoclet (e) {
    const rtype = R.find(R.propEq('title', 'rtype'), e.doclet.tags || [])
    if (rtype) {
      e.doclet.rtype = rtype.value
      e.doclet.tags = R.reject(R.propEq('title', 'rtype'), e.doclet.tags)
    }
  }
}
