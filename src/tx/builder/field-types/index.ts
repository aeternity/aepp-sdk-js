import _field from './field';
import _uInt from './u-int';
import _shortUInt from './short-u-int';
import _coinAmount from './coin-amount';

import _deposit from './deposit';
import _fee from './fee';
import _gasLimit from './gas-limit';
import _gasPrice from './gas-price';
import _name from './name';
import _nameFee from './name-fee';
import _nameId from './name-id';

// TODO: remove after fixing https://github.com/Gerrit0/typedoc-plugin-missing-exports/issues/15
const field = _field;
const uInt = _uInt;
const shortUInt = _shortUInt;
const coinAmount = _coinAmount;

const deposit = _deposit;
const fee = _fee;
const gasLimit = _gasLimit;
const gasPrice = _gasPrice;
const name = _name;
const nameFee = _nameFee;
const nameId = _nameId;

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
