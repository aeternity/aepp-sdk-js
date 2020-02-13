/*
 * ISC License (ISC)
 * Copyright (c) 2018 aeternity developers
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

import '../'
import { describe, it } from 'mocha'
import { AE_AMOUNT_FORMATS, formatAmount } from '../../es/utils/amount-formatter'
import { asBigNumber, parseBigNumber } from '../../es/utils/bignumber'

describe('Amount Formatter', function () {
  it('to aettos', async () => {
    [
      [1, AE_AMOUNT_FORMATS.AE, 1e18],
      [10, AE_AMOUNT_FORMATS.AE, 10e18],
      [100, AE_AMOUNT_FORMATS.AE, 100e18],
      [10012312, AE_AMOUNT_FORMATS.AE, 10012312e18],
      [1, AE_AMOUNT_FORMATS.AETTOS, 1]
    ].forEach(
      ([v, d, e]) => parseBigNumber(e).should.be.equal(formatAmount(v, { denomination: d }).toString(10))
    )
  })
  it('to Ae', () => {
    [
      [1, AE_AMOUNT_FORMATS.AETTOS, asBigNumber(1).div(1e18)],
      [10, AE_AMOUNT_FORMATS.AETTOS, asBigNumber(10).div(1e18)],
      [100, AE_AMOUNT_FORMATS.AETTOS, asBigNumber(100).div(1e18)],
      [10012312, AE_AMOUNT_FORMATS.AETTOS, asBigNumber(10012312).div(1e18)],
      [1, AE_AMOUNT_FORMATS.AE, 1]
    ].forEach(
      ([v, d, e]) => parseBigNumber(e).should.be.equal(formatAmount(v, { denomination: d, targetDenomination: AE_AMOUNT_FORMATS.AE }).toString(10))
    )
  })
  it('format', () => {
    [
      [1, AE_AMOUNT_FORMATS.AE, AE_AMOUNT_FORMATS.AETTOS, asBigNumber(1e18)],
      [10, AE_AMOUNT_FORMATS.AETTOS, AE_AMOUNT_FORMATS.AE, asBigNumber(10).div(1e18)],
      [1e18, AE_AMOUNT_FORMATS.AETTOS, AE_AMOUNT_FORMATS.AE, asBigNumber(1)],
      [10012312, AE_AMOUNT_FORMATS.AETTOS, AE_AMOUNT_FORMATS.AE, asBigNumber(10012312).div(1e18)],
      [1, AE_AMOUNT_FORMATS.AE, AE_AMOUNT_FORMATS.AE, 1],
      [1, AE_AMOUNT_FORMATS.PICO_AE, AE_AMOUNT_FORMATS.AE, asBigNumber(0.00000000000001)],
      [1, AE_AMOUNT_FORMATS.PICO_AE, AE_AMOUNT_FORMATS.AETTOS, asBigNumber(10000)],
      [1e4, AE_AMOUNT_FORMATS.AETTOS, AE_AMOUNT_FORMATS.PICO_AE, asBigNumber(1)],
      [0.0001, AE_AMOUNT_FORMATS.PICO_AE, AE_AMOUNT_FORMATS.AE, asBigNumber(0.000000000000000001)],
      [0.00000000000001, AE_AMOUNT_FORMATS.AE, AE_AMOUNT_FORMATS.PICO_AE, asBigNumber(1)],
      [0.0001, AE_AMOUNT_FORMATS.PICO_AE, AE_AMOUNT_FORMATS.AETTOS, asBigNumber(1)]
    ].forEach(
      ([v, dF, dT, e]) => parseBigNumber(e).should.be.equal(formatAmount(v, { denomination: dF, targetDenomination: dT }).toString(10))
    )
  })
})
