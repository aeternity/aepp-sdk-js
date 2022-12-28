import _address from './address';
import _array from './array';
import _coinAmount from './coin-amount';
import _deposit from './deposit';
import _encoded from './encoded';
import _entry from './entry';
import _enumeration from './enumeration';
import _fee from './fee';
import _field from './field';
import _gasLimit from './gas-limit';
import _gasPrice from './gas-price';
import _mptree from './mptree';
import _name from './name';
import _nameFee from './name-fee';
import _nameId from './name-id';
import _pointers from './pointers';
import _raw from './raw';
import _shortUInt from './short-u-int';
import _shortUIntConst from './short-u-int-const';
import _string from './string';
import _uInt from './u-int';

// TODO: remove after fixing https://github.com/Gerrit0/typedoc-plugin-missing-exports/issues/15
const address = _address;
const array = _array;
const coinAmount = _coinAmount;
const deposit = _deposit;
const encoded = _encoded;
const entry = _entry;
const enumeration = _enumeration;
const fee = _fee;
const field = _field;
const gasLimit = _gasLimit;
const gasPrice = _gasPrice;
const mptree = _mptree;
const name = _name;
const nameFee = _nameFee;
const nameId = _nameId;
const pointers = _pointers;
const raw = _raw;
const shortUInt = _shortUInt;
const shortUIntConst = _shortUIntConst;
const string = _string;
const uInt = _uInt;

type BinaryData = Buffer | Buffer[] | Buffer[][] | Array<[Buffer, Array<[Buffer, Buffer[]]>]>;
export interface Field {
  serialize: (value: any, options: any) => BinaryData;
  deserialize: (value: BinaryData, options: any) => any;
}

export {
  address,
  array,
  coinAmount,
  deposit,
  encoded,
  entry,
  enumeration,
  fee,
  field,
  gasLimit,
  gasPrice,
  mptree,
  name,
  nameFee,
  nameId,
  pointers,
  raw,
  shortUInt,
  shortUIntConst,
  string,
  uInt,
};
