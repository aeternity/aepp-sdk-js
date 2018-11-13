import BigNumber from 'bignumber.js';

export async function parseBigNumber(number) {
  return (new BigNumber(number)).toString(10)
}

