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

/**
 * Amount Formatter
 * @module @aeternity/aepp-sdk/es/utils/amount-formatter
 * @example import { format, toAettos, AE_AMOUNT_FORMATS } from '@aeternity/aepp-sdk/es/utils/amount-formatter'
 */
import { asBigNumber, isBigNumber } from './bignumber'
import { BigNumber } from 'bignumber.js'

/**
 * AE amount formats
 */
export const AE_AMOUNT_FORMATS = {
  AE: 'ae',
  MILI_AE: 'miliAE',
  MICRO_AE: 'microAE',
  NANO_AE: 'nanoAE',
  PICO_AE: 'picoAE',
  FEMTO_AE: 'femtoAE',
  AETTOS: 'aettos'
}

/**
 * DENOMINATION_MAGNITUDE
 */
export const DENOMINATION_MAGNITUDE = {
  [AE_AMOUNT_FORMATS.AE]: 0,
  [AE_AMOUNT_FORMATS.MILI_AE]: -3,
  [AE_AMOUNT_FORMATS.MICRO_AE]: -6,
  [AE_AMOUNT_FORMATS.NANO_AE]: -9,
  [AE_AMOUNT_FORMATS.PICO_AE]: -12,
  [AE_AMOUNT_FORMATS.FEMTO_AE]: -15,
  [AE_AMOUNT_FORMATS.AETTOS]: -18
}

/**
 * Convert amount to AE
 * @param {String|Number|BigNumber} value amount to convert
 * @param {Object} [options={}] options
 * @param {String} [options.denomination='aettos'] denomination of amount, can be ['ae', 'aettos']
 * @return {String}
 */
export const toAe = (value, { denomination = AE_AMOUNT_FORMATS.AETTOS } = {}) => formatAmount(value, { denomination, targetDenomination: AE_AMOUNT_FORMATS.AE })

/**
 * Convert amount to aettos
 * @param {String|Number|BigNumber} value amount to convert
 * @param {Object} [options={}] options
 * @param {String} [options.denomination='ae'] denomination of amount, can be ['ae', 'aettos']
 * @return {String}
 */
export const toAettos = (value, { denomination = AE_AMOUNT_FORMATS.AE } = {}) => formatAmount(value, { denomination })

/**
 * Convert amount from one to other denomination
 * @param {String|Number|BigNumber} value amount to convert
 * @param {Object} [options={}] options
 * @param {String} [options.denomination='aettos'] denomination of amount, can be ['ae', 'aettos']
 * @param {String} [options.targetDenomination='aettos'] target denomination, can be ['ae', 'aettos']
 * @return {String}
 */
export const formatAmount = (value, { denomination = AE_AMOUNT_FORMATS.AETTOS, targetDenomination = AE_AMOUNT_FORMATS.AETTOS } = {}) => {
  if (!Object.values(AE_AMOUNT_FORMATS).includes(denomination)) throw new Error(`Invalid denomination. Current: ${denomination}, available [${Object.keys(AE_AMOUNT_FORMATS)}]`)
  if (!Object.values(AE_AMOUNT_FORMATS).includes(targetDenomination)) throw new Error(`Invalid target denomination. Current: ${targetDenomination}, available [${Object.keys(AE_AMOUNT_FORMATS)}]`)
  if (!isBigNumber(value)) throw new Error(`Value ${value} is not type of number`)

  return asBigNumber(value)
    .shiftedBy(DENOMINATION_MAGNITUDE[denomination] - DENOMINATION_MAGNITUDE[targetDenomination])
    .toFixed()
}

const prefixes = [
  { name: 'exa', magnitude: 18 },
  { name: 'giga', magnitude: 9 },
  { name: '', magnitude: 0 },
  { name: 'pico', magnitude: -12 }
]

const getNearestPrefix = exponent => prefixes.reduce((p, n) => (
  Math.abs(n.magnitude - exponent) < Math.abs(p.magnitude - exponent) ? n : p))

const getLowerBoundPrefix = exponent => prefixes
  .find(p => p.magnitude <= exponent) || prefixes[prefixes.length - 1]

export default (value) => {
  if (!BigNumber.isBigNumber(value)) value = BigNumber(value)

  const { name, magnitude } = (value.e < 0 ? getNearestPrefix : getLowerBoundPrefix)(value.e)
  const v = value
    .shiftedBy(-magnitude)
    .precision(9 + Math.min(value.e - magnitude, 0))
    .toFixed()
  return `${v}${name ? ' ' : ''}${name}`
}
