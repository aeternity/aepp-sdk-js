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

import { describe, it } from 'mocha'
import { expect } from 'chai'
import BigNumber from 'bignumber.js'
import '..'
import { AE_AMOUNT_FORMATS, formatAmount, toAe, toAettos } from '../../src/utils/amount-formatter'
import { parseBigNumber } from '../../src/utils/bignumber'
import { InvalidDenominationError, IllegalArgumentError } from '../../src/utils/errors'

describe('Amount Formatter', function () {
  it('to aettos', async () => {
    [
      [1, AE_AMOUNT_FORMATS.AE, 1e18],
      [10, AE_AMOUNT_FORMATS.AE, 10e18],
      [100, AE_AMOUNT_FORMATS.AE, 100e18],
      [10012312, AE_AMOUNT_FORMATS.AE, 10012312e18],
      [1, AE_AMOUNT_FORMATS.AETTOS, 1]
    ].forEach(
      ([v, d, e]) => expect(parseBigNumber(e)).to.be.equal(toAettos(v, { denomination: d.toString() }))
    )
  })
  it('to Ae', () => {
    [
      [1, AE_AMOUNT_FORMATS.AETTOS, new BigNumber(1).div(1e18)],
      [10, AE_AMOUNT_FORMATS.AETTOS, new BigNumber(10).div(1e18)],
      [100, AE_AMOUNT_FORMATS.AETTOS, new BigNumber(100).div(1e18)],
      [10012312, AE_AMOUNT_FORMATS.AETTOS, new BigNumber(10012312).div(1e18)],
      [1, AE_AMOUNT_FORMATS.AE, 1]
    ].forEach(
      ([v, d, e]) => expect(parseBigNumber(e)).to.be.equal(toAe(v, { denomination: d.toString() }))
    )
  })
  it('format', () => {
    [
      [1, AE_AMOUNT_FORMATS.AE, AE_AMOUNT_FORMATS.AETTOS, new BigNumber(1e18)],
      [10, AE_AMOUNT_FORMATS.AETTOS, AE_AMOUNT_FORMATS.AE, new BigNumber(10).div(1e18)],
      [1e18, AE_AMOUNT_FORMATS.AETTOS, AE_AMOUNT_FORMATS.AE, new BigNumber(1)],
      [10012312, AE_AMOUNT_FORMATS.AETTOS, AE_AMOUNT_FORMATS.AE, new BigNumber(10012312).div(1e18)],
      [1, AE_AMOUNT_FORMATS.AE, AE_AMOUNT_FORMATS.AE, 1],
      [1, AE_AMOUNT_FORMATS.PICO_AE, AE_AMOUNT_FORMATS.AE, new BigNumber(0.000000000001)],
      [1, AE_AMOUNT_FORMATS.PICO_AE, AE_AMOUNT_FORMATS.AETTOS, new BigNumber(1000000)],
      [1e6, AE_AMOUNT_FORMATS.AETTOS, AE_AMOUNT_FORMATS.PICO_AE, new BigNumber(1)],
      [0.0001, AE_AMOUNT_FORMATS.PICO_AE, AE_AMOUNT_FORMATS.AE, new BigNumber(0.0000000000000001)],
      [0.000000000001, AE_AMOUNT_FORMATS.AE, AE_AMOUNT_FORMATS.PICO_AE, new BigNumber(1)],
      [0.000001, AE_AMOUNT_FORMATS.PICO_AE, AE_AMOUNT_FORMATS.AETTOS, new BigNumber(1)],
      [0.000000000001, AE_AMOUNT_FORMATS.MICRO_AE, AE_AMOUNT_FORMATS.AETTOS, new BigNumber(1)],
      [0.000001, AE_AMOUNT_FORMATS.MICRO_AE, AE_AMOUNT_FORMATS.PICO_AE, new BigNumber(1)],
      [1, AE_AMOUNT_FORMATS.MILI_AE, AE_AMOUNT_FORMATS.AETTOS, new BigNumber(1000000000000000)],
      [1, AE_AMOUNT_FORMATS.AE, AE_AMOUNT_FORMATS.MILI_AE, new BigNumber(1000)],
      [1, AE_AMOUNT_FORMATS.NANO_AE, AE_AMOUNT_FORMATS.AE, new BigNumber(0.000000001)],
      [1, AE_AMOUNT_FORMATS.NANO_AE, AE_AMOUNT_FORMATS.AETTOS, new BigNumber(1000000000)],
      [1, AE_AMOUNT_FORMATS.FEMTO_AE, AE_AMOUNT_FORMATS.AETTOS, new BigNumber(1000)],
      [1, AE_AMOUNT_FORMATS.NANO_AE, AE_AMOUNT_FORMATS.FEMTO_AE, new BigNumber(1000000)]
    ].forEach(
      ([v, dF, dT, e]) => expect(parseBigNumber(e)).to.be.equal(formatAmount(v, { denomination: dF.toString(), targetDenomination: dT.toString() }))
    )
  })
  it('Invalid value', () => {
    [
      [true, [AE_AMOUNT_FORMATS.AE, AE_AMOUNT_FORMATS.AE], 'Value true is not type of number', IllegalArgumentError],
      [1, [AE_AMOUNT_FORMATS.AE, 'ASD'], 'Invalid target denomination: ASD', InvalidDenominationError],
      [1, ['ASD', AE_AMOUNT_FORMATS.AE], 'Invalid denomination: ASD', InvalidDenominationError]
    ].forEach(([v, [dF, dT], error]: any[]) => {
      expect(() => formatAmount(v, { denomination: dF, targetDenomination: dT })).to.throw(error)
    })
  })
})
