/**
 * Big Number Helpers
 */
import BigNumber from 'bignumber.js';

/**
 * Check if value is BigNumber, Number, BigInt or number string representation
 * @param number - number to check
 */
export const isBigNumber = (number: string | number | bigint | BigNumber): boolean => {
  if (typeof number === 'bigint') return true;
  return ['number', 'object', 'string'].includes(typeof number)
    // eslint-disable-next-line no-restricted-globals
    && (!isNaN(number as number) || Number.isInteger(number) || BigNumber.isBigNumber(number));
};

/**
 * BigNumber ceil operation
 */
export const ceil = (bigNumber: BigNumber): BigNumber => bigNumber
  .integerValue(BigNumber.ROUND_CEIL);
