/**
 * Big Number Helpers
 * @module @aeternity/aepp-sdk/es/utils/bignumber
 * @example import { parseBigNumber, asBigNumber, isBigNumber, ceil } from '@aeternity/aepp-sdk/es/utils/bignumber'
 */
import { BigNumber } from 'bignumber.js'

/**
 * Convert number to string
 * @param {String|Number|BigNumber} number number to convert
 * @return {String}
 */
export function parseBigNumber (number) {
  return BigNumber(number.toString()).toString(10)
}

/**
 * Convert number to BigNumber instance
 * @param {String|Number|BigNumber} number number to convert
 * @return {BigNumber}
 */
export function asBigNumber (number) {
  return BigNumber(number.toString())
}

/**
 * Check if value is BigNumber, Number or number string representation
 * @param {String|Number|BigNumber} number number to convert
 * @return {Boolean}
 */
export function isBigNumber (number) {
  return !isNaN(number) || Number.isInteger(number) || BigNumber.isBigNumber(number)
}

/**
 * BigNumber ceil operation
 * @param {String|Number|BigNumber} bigNumber
 * @return {BigNumber}
 */
export function ceil (bigNumber) {
  return bigNumber.integerValue(BigNumber.ROUND_CEIL)
}

export default { ceil, isBigNumber, asBigNumber, parseBigNumber }
