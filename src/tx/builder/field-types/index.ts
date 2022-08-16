import _field from './field';
import _uInt from './u-int';
import _shortUInt from './short-u-int';
import _coinAmount from './coin-amount';
import _address from './address';
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
const address = _address;
const deposit = _deposit;
const fee = _fee;
const gasLimit = _gasLimit;
const gasPrice = _gasPrice;
const name = _name;
const nameFee = _nameFee;
const nameId = _nameId;

export interface Field {
  serialize: (value: any, options: any) => Buffer;
  deserialize: (value: Buffer) => any;
}

export {
  field,
  uInt,
  shortUInt,
  coinAmount,
  address,
  deposit,
  fee,
  gasLimit,
  gasPrice,
  name,
  nameFee,
  nameId,
};
