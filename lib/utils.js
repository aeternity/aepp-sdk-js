

/*
https://stackoverflow.com/questions/10073699/pad-a-number-with-leading-zeros-in-javascript
 */
function padLeft(s, width, fill) {
  return s.length >= width ? s : new Array(width - s.length + 1).join(fill ? fill : '\0') + s;
}
