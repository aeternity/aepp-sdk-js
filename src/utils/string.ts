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

/**
 * Convert string from snake_case to PascalCase
 * @param s - String to convert
 * @returns Converted string
 */
export function snakeToPascal(s: string): string {
  return s.replace(/_./g, (match) => match[1].toUpperCase());
}

/**
 * Convert string from PascalCase to snake_case
 * @param s - String to convert
 * @returns Converted string
 */
export function pascalToSnake(s: string): string {
  return s.replace(/[A-Z]/g, (match) => `_${match.toLowerCase()}`);
}

/**
 * Check whether a string is valid hex.
 * @param str - String to validate.
 * @returns True if the string is valid hex, false otherwise.
 */
export function isHex(str: string): boolean {
  return str.length % 2 === 0 && /^[0-9a-f]+$/i.test(str);
}

/**
 * Check whether a string is valid base-64.
 * @param str - String to validate.
 * @returns True if the string is valid base-64, false otherwise.
 */
export function isBase64(str: string): boolean {
  if (str.length % 4 > 0 || /[^0-9a-z+/=]/i.test(str)) return false;
  const index = str.indexOf('=');
  return index === -1 || /={1,2}/.test(str.slice(index));
}
