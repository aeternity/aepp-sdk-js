import field from './field';
import uInt from './u-int';
import coinAmount from './coin-amount';

import deposit from './deposit';
import gasPrice from './gas-price';
import name from './name';
import nameFee from './name-fee';
import nameId from './name-id';

export type Field = typeof field | typeof uInt | typeof coinAmount | typeof deposit | typeof gasPrice
  | typeof name | typeof nameFee | typeof nameId;

export {
  field,
  uInt,
  coinAmount,

  deposit,
  gasPrice,
  name,
  nameFee,
  nameId,
};
