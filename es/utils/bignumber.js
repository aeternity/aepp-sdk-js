const bignum = require('bignum')

export async function parseBigNumber (number) {
  return bignum(number).toString(10)
}
