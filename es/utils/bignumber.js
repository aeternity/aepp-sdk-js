import BN from 'bn.js'

export function parseBigNumber (number) {
  return new BN(number.toString()).toString(10)
}
