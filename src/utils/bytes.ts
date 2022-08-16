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
import BigNumber from 'bignumber.js';
import { NoSerializerFoundError, TypeError } from './errors';

/**
 * Convert string, number, or BigNumber to byte array
 * @param val - value to convert
 * @param big - enables force conversion to BigNumber
 * @returns Buffer
 */
// eslint-disable-next-line import/prefer-default-export
export function toBytes(val?: null | string | number | BigNumber, big = false): Buffer {
  // Encode a value to bytes.
  // If the value is an int it will be encoded as bytes big endian
  // Raises ValueError if the input is not an int or string

  if (val === undefined || val === null) return Buffer.from([]);
  if (Number.isInteger(val) || BigNumber.isBigNumber(val) || big) {
    if (!BigNumber.isBigNumber(val)) val = new BigNumber(val);
    if (!val.isInteger()) throw new TypeError(`Unexpected not integer value: ${val.toFixed()}`);
    let hexString = val.toString(16);
    if (hexString.length % 2 === 1) hexString = `0${hexString}`;
    return Buffer.from(hexString, 'hex');
  }
  if (typeof val === 'string') {
    return Buffer.from(val);
  }
  throw new NoSerializerFoundError();
}
