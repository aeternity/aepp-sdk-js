import { BigNumber } from 'bignumber.js'

export function parseBigNumber (number) {
  return BigNumber(number.toString()).toString(10)
}
