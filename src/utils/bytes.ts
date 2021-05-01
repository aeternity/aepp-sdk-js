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
import BigNumber from 'bignumber.js'
import { isBase64, isHex } from './string'

/**
 * Bytes module
 * @module @aeternity/aepp-sdk/es/utils/bytes
 * @example import { Crypto } from '@aeternity/aepp-sdk'
 */

const pad = (left: boolean, length: number, input: Buffer): Buffer => {
  const fill = length - input.length
  if (fill <= 0) return input
  const fillArray = new Uint8Array(fill)
  fillArray.fill(0, fill)
  return Buffer.concat(left ? [fillArray, input] : [input, fillArray])
}

/**
 * Left pad the input data with 0 bytes
 * @param length to pad to
 * @param input data to pad
 * @return the padded data
 */
export const leftPad = pad.bind(null, true)

/**
 * Right pad the input data with 0 bytes
 * @param length to pad to
 * @param input data to pad
 * @return the padded data
 */
export const rightPad = pad.bind(null, false)

/**
 * Convert bignumber to byte array
 * @param {BigNumber} x bignumber instance
 * @return Buffer
 */
export function bigNumberToByteArray (x: BigNumber): Buffer {
  if (!x.isInteger()) throw new Error(`Unexpected not integer value: ${x.toFixed()}`)
  let hexString = x.toString(16)
  if (hexString.length % 2 === 1) hexString = '0' + hexString
  return Buffer.from(hexString, 'hex')
}

/**
 * Convert string, number, or BigNumber to byte array
 * @param {null|string|number|BigNumber} val
 * @param {boolean} big enables force conversion to BigNumber
 * @return Buffer
 */
export function toBytes (val?: null | string | number | BigNumber, big: boolean = false): Buffer {
  // Encode a value to bytes.
  // If the value is an int it will be encoded as bytes big endian
  // Raises ValueError if the input is not an int or string

  if (val === undefined || val === null) return Buffer.from([])
  if (Number.isInteger(val) || BigNumber.isBigNumber(val) || big) {
    if (!BigNumber.isBigNumber(val)) val = new BigNumber(val)
    return bigNumberToByteArray(val)
  }
  if (typeof val === 'string') {
    return Buffer.from(val)
  }
  throw new Error('Byte serialization not supported')
}

/**
 * Convert a string to a Buffer.  If encoding is not specified, hex-encoding
 * will be used if the input is valid hex.  If the input is valid base64 but
 * not valid hex, base64 will be used.  Otherwise, utf8 will be used.
 * @param {string} str String to be converted.
 * @param {string} [enc] Encoding of the input string.
 * @return {buffer} Buffer containing the input data.
 */
export function str2buf (str: string, enc?: BufferEncoding): Buffer {
  return Buffer.from(
    str,
    enc ?? (isHex(str) ? 'hex' : undefined) ?? (isBase64(str) ? 'base64' : undefined)
  )
}
