exports.handlers = {
  newDoclet (e) {
    const rtype = (e.doclet.tags || []).find(({ title }) => title === 'rtype')
    if (rtype) {
      e.doclet.rtype = rtype.value
      e.doclet.tags = e.doclet.tags.filter(({ title }) => title !== 'rtype')
    }
  }
}
