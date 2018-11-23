import BN from 'bn.js'

export async function parseBigNumber (number) {
  return new BN(number).toString(10)
}
