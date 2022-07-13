import field from './field';
import uInt from './u-int';
import shortUInt from './short-u-int';
import coinAmount from './coin-amount';

import deposit from './deposit';
import fee from './fee';
import gasLimit from './gas-limit';
import gasPrice from './gas-price';
import name from './name';
import nameFee from './name-fee';
import nameId from './name-id';

export type Field = typeof field | typeof uInt | typeof shortUInt | typeof coinAmount
  | typeof deposit | typeof fee | typeof gasLimit | typeof gasPrice | typeof name | typeof nameFee
  | typeof nameId;

export {
  field,
  uInt,
  shortUInt,
  coinAmount,

  deposit,
  fee,
  gasLimit,
  gasPrice,
  name,
  nameFee,
  nameId,
};
