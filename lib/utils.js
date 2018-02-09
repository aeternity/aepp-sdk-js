const sha256 = require('sha256')


/*
https://stackoverflow.com/questions/10073699/pad-a-number-with-leading-zeros-in-javascript
 */
function padLeft(s, width, fill) {
  return s.length >= width ? s : new Array(width - s.length + 1).join(fill ? fill : '\0') + s;
}



const _nameHash = (name) => {
  if (!name) {
    return padLeft('', 32)
  } else {
    let firstColon = name.indexOf('.')
    let label = name.substr(0,firstColon)
    let remainder = name.substr(firstColon + 1)
    return sha256(_nameHash(remainder) + sha256(label))
  }
}