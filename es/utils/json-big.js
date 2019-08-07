import BigNumber from 'bignumber.js'

/* eslint-disable */
export default {
  stringify: (function () {
    'use strict';

    function f(n) {
      // Format integers to have at least two digits.
      return n < 10 ? '0' + n : n;
    }

    var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
      escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
      gap,
      indent,
      meta = {    // table of character substitutions
        '\b': '\\b',
        '\t': '\\t',
        '\n': '\\n',
        '\f': '\\f',
        '\r': '\\r',
        '"' : '\\"',
        '\\': '\\\\'
      },
      rep;


    function quote(string) {

// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can safely slap some quotes around it.
// Otherwise we must also replace the offending characters with safe escape
// sequences.

      escapable.lastIndex = 0;
      return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
        var c = meta[a];
        return typeof c === 'string'
          ? c
          : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
      }) + '"' : '"' + string + '"';
    }


    function str(key, holder) {

// Produce a string from holder[key].

      var i,          // The loop counter.
        k,          // The member key.
        v,          // The member value.
        length,
        mind = gap,
        partial,
        value = holder[key],
        isBigNumber = value != null && (value instanceof BigNumber || BigNumber.isBigNumber(value) || BigNumber(value).toString(10) === value);

// If the value has a toJSON method, call it to obtain a replacement value.

      if (value && typeof value === 'object' &&
        typeof value.toJSON === 'function') {
        value = value.toJSON(key);
      }

// If we were called with a replacer function, then call the replacer to
// obtain a replacement value.

      if (typeof rep === 'function') {
        value = rep.call(holder, key, value);
      }

// What happens next depends on the value's type.

      switch (typeof value) {
        case 'string':
          if (isBigNumber) {
            return value;
          } else {
            return quote(value);
          }

        case 'number':

// JSON numbers must be finite. Encode non-finite numbers as null.

          return isFinite(value) ? String(value) : 'null';

        case 'boolean':
        case 'null':

// If the value is a boolean or null, convert it to a string. Note:
// typeof null does not produce 'null'. The case is included here in
// the remote chance that this gets fixed someday.

          return String(value);

// If the type is 'object', we might be dealing with an object or an array or
// null.

        case 'object':

// Due to a specification blunder in ECMAScript, typeof null is 'object',
// so watch out for that case.

          if (!value) {
            return 'null';
          }

// Make an array to hold the partial results of stringifying this object value.

          gap += indent;
          partial = [];

// Is the value an array?

          if (Object.prototype.toString.apply(value) === '[object Array]') {

// The value is an array. Stringify every element. Use null as a placeholder
// for non-JSON values.

            length = value.length;
            for (i = 0; i < length; i += 1) {
              partial[i] = str(i, value) || 'null';
            }

// Join all of the elements together, separated with commas, and wrap them in
// brackets.

            v = partial.length === 0
              ? '[]'
              : gap
                ? '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']'
                : '[' + partial.join(',') + ']';
            gap = mind;
            return v;
          }

// If the replacer is an array, use it to select the members to be stringified.

          if (rep && typeof rep === 'object') {
            length = rep.length;
            for (i = 0; i < length; i += 1) {
              if (typeof rep[i] === 'string') {
                k = rep[i];
                v = str(k, value);
                if (v) {
                  partial.push(quote(k) + (gap ? ': ' : ':') + v);
                }
              }
            }
          } else {

// Otherwise, iterate through all of the keys in the object.

            Object.keys(value).forEach(function(k) {
              var v = str(k, value);
              if (v) {
                partial.push(quote(k) + (gap ? ': ' : ':') + v);
              }
            });
          }

// Join all of the member texts together, separated with commas,
// and wrap them in braces.

          v = partial.length === 0
            ? '{}'
            : gap
              ? '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}'
              : '{' + partial.join(',') + '}';
          gap = mind;
          return v;
      }
    }

// If the JSON object does not yet have a stringify method, give it one.

    return function (value, replacer, space) {

// The stringify method takes a value and an optional replacer, and an optional
// space parameter, and returns a JSON text. The replacer can be a function
// that can replace values, or an array of strings that will select the keys.
// A default replacer method can be provided. Use of the space parameter can
// produce text that is more easily readable.

      var i;
      gap = '';
      indent = '';

// If the space parameter is a number, make an indent string containing that
// many spaces.

      if (typeof space === 'number') {
        for (i = 0; i < space; i += 1) {
          indent += ' ';
        }

// If the space parameter is a string, it will be used as the indent string.

      } else if (typeof space === 'string') {
        indent = space;
      }

// If there is a replacer, it must be a function or an array.
// Otherwise, throw an error.

      rep = replacer;
      if (replacer && typeof replacer !== 'function' &&
        (typeof replacer !== 'object' ||
          typeof replacer.length !== 'number')) {
        throw new Error('JSON.stringify');
      }

// Make a fake root object containing our value under the key of ''.
// Return the result of stringifying the value.

      return str('', {'': value});
    };
  }()),
  parse: ((options) => {
    // This is a function that can parse a JSON text, producing a JavaScript
    // data structure. It is a simple, recursive descent parser. It does not use
    // eval or regular expressions, so it can be used as a model for implementing
    // a JSON parser in other languages.

    // We are defining the function inside of another function to avoid creating
    // global letiables.

    // Default options one can override by passing options to the parse()
    const _options = {
      'strict': false, // not being strict means do not generate syntax errors for "duplicate key"
      'storeAsString': false // toggles whether the values should be stored as BigNumber (default) or a string
    }

    const escapee = {
      '"': '"',
      '\\': '\\',
      '/': '/',
      b: '\b',
      f: '\f',
      n: '\n',
      r: '\r',
      t: '\t'
    }

    // If there are options, then use them to override the default _options
    if (options !== undefined && options !== null) {
      if (options.strict === true) {
        _options.strict = true
      }
      if (options.storeAsString === true) {
        _options.storeAsString = true
      }
    }

    let at
    // The index of the current character

    let ch
    // The current character

    let text

    let error = function (m) {
      // Call error when something is wrong.

      throw {
        name: 'SyntaxError',
        message: m,
        at: at,
        text: text
      }
    }

    let next = function (c) {
      // If a c parameter is provided, verify that it matches the current character.

      if (c && c !== ch) {
        error('Expected \'' + c + '\' instead of \'' + ch + '\'')
      }

      // Get the next character. When there are no more characters,
      // return the empty string.

      ch = text.charAt(at)
      at += 1
      return ch
    }

    let number = function () {
      // Parse a number value.

      let number

      let string = ''

      if (ch === '-') {
        string = '-'
        next('-')
      }
      while (ch >= '0' && ch <= '9') {
        string += ch
        next()
      }
      if (ch === '.') {
        string += '.'
        while (next() && ch >= '0' && ch <= '9') {
          string += ch
        }
      }
      if (ch === 'e' || ch === 'E') {
        string += ch
        next()
        if (ch === '-' || ch === '+') {
          string += ch
          next()
        }
        while (ch >= '0' && ch <= '9') {
          string += ch
          next()
        }
      }
      number = +string
      if (!isFinite(number)) {
        error('Bad number')
      } else {
        // if (number > 9007199254740992 || number < -9007199254740992)
        // Bignumber has stricter check: everything with length > 15 digits disallowed
        if (string.length > 15) { return string }
        return number
      }
    }

    let string = function () {
      // Parse a string value.

      let hex

      let i

      let string = ''

      let uffff

      // When parsing for string values, we must look for " and \ characters.

      if (ch === '"') {
        while (next()) {
          if (ch === '"') {
            next()
            return string
          }
          if (ch === '\\') {
            next()
            if (ch === 'u') {
              uffff = 0
              for (i = 0; i < 4; i += 1) {
                hex = parseInt(next(), 16)
                if (!isFinite(hex)) {
                  break
                }
                uffff = uffff * 16 + hex
              }
              string += String.fromCharCode(uffff)
            } else if (typeof escapee[ch] === 'string') {
              string += escapee[ch]
            } else {
              break
            }
          } else {
            string += ch
          }
        }
      }
      error('Bad string')
    }

    let white = function () {
      // Skip whitespace.

      while (ch && ch <= ' ') {
        next()
      }
    }

    let word = function () {
      // true, false, or null.

      switch (ch) {
        case 't':
          next('t')
          next('r')
          next('u')
          next('e')
          return true
        case 'f':
          next('f')
          next('a')
          next('l')
          next('s')
          next('e')
          return false
        case 'n':
          next('n')
          next('u')
          next('l')
          next('l')
          return null
      }
      error('Unexpected \'' + ch + '\'')
    }

    let value
    // Place holder for the value function.

    let array = function () {
      // Parse an array value.

      let array = []

      if (ch === '[') {
        next('[')
        white()
        if (ch === ']') {
          next(']')
          return array // empty array
        }
        while (ch) {
          array.push(value())
          white()
          if (ch === ']') {
            next(']')
            return array
          }
          next(',')
          white()
        }
      }
      error('Bad array')
    }

    let object = function () {
      // Parse an object value.

      let key

      let object = {}

      if (ch === '{') {
        next('{')
        white()
        if (ch === '}') {
          next('}')
          return object // empty object
        }
        while (ch) {
          key = string()
          white()
          next(':')
          if (_options.strict === true && Object.hasOwnProperty.call(object, key)) {
            error('Duplicate key "' + key + '"')
          }
          object[key] = value()
          white()
          if (ch === '}') {
            next('}')
            return object
          }
          next(',')
          white()
        }
      }
      error('Bad object')
    }

    value = function () {
      // Parse a JSON value. It could be an object, an array, a string, a number,
      // or a word.

      white()
      switch (ch) {
        case '{':
          return object()
        case '[':
          return array()
        case '"':
          return string()
        case '-':
          return number()
        default:
          return ch >= '0' && ch <= '9' ? number() : word()
      }
    }

    // Return the json_parse function. It will have access to all of the above
    // functions and letiables.

    return function (source, reviver) {
      let result

      text = source + ''
      at = 0
      ch = ' '
      result = value()
      white()
      if (ch) {
        error('Syntax error')
      }

      // If there is a reviver function, we recursively walk the new structure,
      // passing each name/value pair to the reviver function for possible
      // transformation, starting with a temporary root object that holds the result
      // in an empty key. If there is not a reviver function, we simply return the
      // result.

      return typeof reviver === 'function'
        ? (function walk (holder, key) {
          let k; let v; let value = holder[key]
          if (value && typeof value === 'object') {
            Object.keys(value).forEach(function (k) {
              v = walk(value, k)
              if (v !== undefined) {
                value[k] = v
              } else {
                delete value[k]
              }
            })
          }
          return reviver.call(holder, key, value)
        }({ '': result }, ''))
        : result
    }
  })()
}
