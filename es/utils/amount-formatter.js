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

const AE_MULT = 1e18

/**
 * AE amount formats
 * @type {{AE: string, AETTOS: string}}
 */
export const AE_AMOUNT_FORMATS = {
  AE: 'ae',
  AETTOS: 'aettos'
}

const AMOUNT_TO_AETTOS = {
  [AE_AMOUNT_FORMATS.AE]: v => asBigNumber(v).times(AE_MULT),
  [AE_AMOUNT_FORMATS.AETTOS]: asBigNumber
}

const AMOUNT_TO_AE = {
  [AE_AMOUNT_FORMATS.AE]: asBigNumber,
  [AE_AMOUNT_FORMATS.AETTOS]: v => asBigNumber(v).div(AE_MULT)
}

/**
 * Convert amount to AE
 * @param {String|Number|BigNumber} value amount to convert
 * @param {Object} [options={}] options
 * @param {String} [options.denomination='aettos'] denomination of amount, can be ['ae', 'aettos']
 * @return {BigNumber}
 */
export const toAe = (value, { denomination = AE_AMOUNT_FORMATS.AETTOS }) => {
  if (!AMOUNT_TO_AETTOS[denomination]) throw new Error(`Invalid denomination. Current: ${denomination}, available [${Object.keys(AE_AMOUNT_FORMATS)}]`)
  if (!isBigNumber(value)) throw new Error(`Value ${value} is not type of number`)
  return AMOUNT_TO_AE[denomination](value)
}

/**
 * Convert amount to aettos
 * @param {String|Number|BigNumber} value amount to convert
 * @param {Object} [options={}] options
 * @param {String} [options.denomination='aettos'] denomination of amount, can be ['ae', 'aettos']
 * @return {BigNumber}
 */
export const toAettos = (value, { denomination = AE_AMOUNT_FORMATS.AETTOS } = {}) => {
  if (!AMOUNT_TO_AETTOS[denomination]) throw new Error(`Invalid denomination. Current: ${denomination}, available [${Object.keys(AE_AMOUNT_FORMATS)}]`)
  if (!isBigNumber(value)) throw new Error(`Value ${value} is not type of number`)
  return AMOUNT_TO_AETTOS[denomination](value)
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
