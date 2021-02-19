/**
 * Big Number Helpers
 * @module @aeternity/aepp-sdk/es/utils/bignumber
 * @example import { parseBigNumber, asBigNumber, isBigNumber, ceil } from '@aeternity/aepp-sdk/es/utils/bignumber'
 */
import BigNumber from 'bignumber.js'

/**
 * Convert number to string
 * @param {String|Number|BigNumber} number number to convert
 * @return {String}
 */
export const parseBigNumber = (number: string | number | BigNumber) => new BigNumber(number.toString()).toString(10)

/**
 * Convert number to BigNumber instance
 * @param {String|Number|BigNumber} number number to convert
 * @return {BigNumber}
 */
export const asBigNumber = (number: string | number | BigNumber) => new BigNumber(number.toString())

/**
 * Check if value is BigNumber, Number or number string representation
 * @param {String|Number|BigNumber} number number to convert
 * @return {Boolean}
 */
export const isBigNumber = (number: string | number | BigNumber) => !isNaN(number as number) || Number.isInteger(number) || BigNumber.isBigNumber(number)

/**
 * BigNumber ceil operation
 * @param {BigNumber} bigNumber
 * @return {BigNumber}
 */
export const ceil = (bigNumber: BigNumber) => bigNumber.integerValue(BigNumber.ROUND_CEIL)
