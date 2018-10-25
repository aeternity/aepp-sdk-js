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
 * Left pad the input data with 0 bytes
 * @param length to pad to
 * @param inputBuffer data to pad
 * @return the padded data
 */
export function leftPad (length, inputBuffer) {
  let fill = length - inputBuffer.length
  if (fill > 0) {
    let fillArray = new Uint8Array(fill)
    fillArray.fill(0, fill)
    return Buffer.concat([fillArray, inputBuffer])
  } else {
    return inputBuffer
  }
}

/**
 * Right pad the input data with 0 bytes
 * @param length to pad to
 * @param inputBuffer data to pad
 * @return the padded data
 */
export function rightPad (length, inputBuffer) {
  let fill = length - inputBuffer.length
  if (fill > 0) {
    let fillArray = new Uint8Array(fill)
    fillArray.fill(0, fill)
    return Buffer.concat([inputBuffer, fillArray])
  } else {
    return inputBuffer
  }
}

function bitSize (num) {
  return num.toString(2).length
}

function dec2hex (n) {
  return n ? [n % 256].concat(dec2hex(~~(n / 256))) : []
}

export function toBigEndian (s, n) {
  const hexar = dec2hex(n)
  return hexar.map(h => (h < 16 ? '0x0' : '0x') + h.toString(16))
    .concat(Array(4 - hexar.length).fill('0x00')).slice(0, s).reverse()
}

export function toBytes (val) {
  // """
  // Encode a value to bytes.
  // If the value is an int it will be encoded as bytes big endian
  // Raises ValueError if the input is not an int or string

  if (Number.isInteger(val)) {
    const s = Math.ceil(bitSize(val) / 8)
    return Buffer.from(toBigEndian(s, val))
  } else if (typeof val === 'string') {
    return val
  } else {
    throw new Error('Byte serialization not supported')
  }
}
