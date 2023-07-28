import abiVersion from './abi-version';
import address from './address';
import array from './array';
import boolean from './boolean';
import coinAmount from './coin-amount';
import ctVersion from './ct-version';
import deposit from './deposit';
import encoded from './encoded';
import entry from './entry';
import enumeration from './enumeration';
import fee from './fee';
import field from './field';
import gasLimit from './gas-limit';
import gasPrice from './gas-price';
import map from './map';
import mptree from './mptree';
import name from './name';
import nameFee from './name-fee';
import nameId from './name-id';
import nonce from './nonce';
import pointers from './pointers';
import raw from './raw';
import shortUInt from './short-u-int';
import shortUIntConst from './short-u-int-const';
import string from './string';
import ttl from './ttl';
import uInt from './u-int';
import wrapped from './wrapped';

export type BinaryData = Buffer | Buffer[] | Buffer[][]
| Array<[Buffer, Array<[Buffer, Buffer[]]>]>;
export interface Field {
  serialize: (value: any, options: any, parameters: any) => BinaryData;
  prepare?: (value: any, options: any, parameters: any) => Promise<any>;
  deserialize: (value: BinaryData, options: any) => any;
  recursiveType?: boolean;
}

export {
  abiVersion,
  address,
  array,
  boolean,
  coinAmount,
  ctVersion,
  deposit,
  encoded,
  entry,
  enumeration,
  fee,
  field,
  gasLimit,
  gasPrice,
  map,
  mptree,
  name,
  nameFee,
  nameId,
  nonce,
  pointers,
  raw,
  shortUInt,
  shortUIntConst,
  string,
  ttl,
  uInt,
  wrapped,
};
