import _field from './field';
import _uInt from './u-int';
import _shortUInt from './short-u-int';
import _coinAmount from './coin-amount';
import _address from './address';
import _addresses from './addresses';
import _deposit from './deposit';
import _entry from './entry';
import _enumeration from './enumeration';
import _fee from './fee';
import _gasLimit from './gas-limit';
import _gasPrice from './gas-price';
import _mptrees from './mptrees';
import _name from './name';
import _nameFee from './name-fee';
import _nameId from './name-id';
import _pointers from './pointers';
import _shortUIntConst from './short-u-int-const';

// TODO: remove after fixing https://github.com/Gerrit0/typedoc-plugin-missing-exports/issues/15
const field = _field;
const uInt = _uInt;
const shortUInt = _shortUInt;
const coinAmount = _coinAmount;
const address = _address;
const addresses = _addresses;
const deposit = _deposit;
const entry = _entry;
const enumeration = _enumeration;
const fee = _fee;
const gasLimit = _gasLimit;
const gasPrice = _gasPrice;
const mptrees = _mptrees;
const name = _name;
const nameFee = _nameFee;
const nameId = _nameId;
const pointers = _pointers;
const shortUIntConst = _shortUIntConst;

type BinaryData = Buffer | Buffer[] | Buffer[][] | Array<[Buffer, Array<[Buffer, Buffer[]]>]>;
export interface Field {
  serialize: (value: any, options: any) => BinaryData;
  deserialize: (value: BinaryData, options: any) => any;
}

export {
  field,
  uInt,
  shortUInt,
  coinAmount,
  address,
  addresses,
  deposit,
  entry,
  enumeration,
  fee,
  gasLimit,
  gasPrice,
  mptrees,
  name,
  nameFee,
  nameId,
  pointers,
  shortUIntConst,
};
