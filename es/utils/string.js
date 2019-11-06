/*
 * ISC License (ISC)
 * Copyright 2018 aeternity developers
 *
 *  Permission to use, copy, modify, and/or distribute this software for any
 *  purpose with or without fee is hereby granted, provided that the above
 *  copyright notice and this permission notice appear in all copies.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
 *  REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
 *  AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 *  INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
 *  LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
 *  OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
 *  PERFORMANCE OF THIS SOFTWARE.
 */

import * as R from 'ramda'

/**
 * Convert string from snake_case to PascalCase
 * @rtype (s: String) => String
 * @param {String} s - String to convert
 * @return {String} Converted string
 */
export function snakeToPascal (s) {
  return s.replace(/_./g, match => R.toUpper(match[1]))
}

/**
 * Convert string from snake_case to PascalCase
 * @rtype (s: String) => String
 * @param {String} s - String to convert
 * @return {String} Converted string
 */
export function snakeOrKebabToPascal (s) {
  return s.replace(/[_|-]./g, match => R.toUpper(match[1]))
}

/**
 * Convert string from PascalCase to snake_case
 * @rtype (s: String) => String
 * @param {String} s - String to convert
 * @return {String} Converted string
 */
export function pascalToSnake (s) {
  return s.replace(/[A-Z]/g, match => `_${R.toLower(match)}`)
}

/**
 * Check whether a string is valid hex.
 * @param {string} str String to validate.
 * @return {boolean} True if the string is valid hex, false otherwise.
 */
export function isHex (str) {
  return !!(str.length % 2 === 0 && str.match(/^[0-9a-f]+$/i))
}
