export { default as abiVersion } from './abi-version';
export { default as address } from './address';
export { default as array } from './array';
export { default as boolean } from './boolean';
export { default as coinAmount } from './coin-amount';
export { default as ctVersion } from './ct-version';
export { default as encoded } from './encoded';
export { default as entry } from './entry';
export { default as enumeration } from './enumeration';
export { default as fee } from './fee';
export { default as field } from './field';
export { default as gasLimit } from './gas-limit';
export { default as gasPrice } from './gas-price';
export { default as map } from './map';
export { default as mptree } from './mptree';
export { default as name } from './name';
export { default as nameFee } from './name-fee';
export { default as nameId } from './name-id';
export { default as nonce } from './nonce';
export { default as pointers } from './pointers';
export { default as pointers2 } from './pointers2';
export { default as queryFee } from './query-fee';
export { default as raw } from './raw';
export { default as shortUInt } from './short-u-int';
export { default as shortUIntConst } from './short-u-int-const';
export { default as string } from './string';
export { default as ttl } from './ttl';
export { default as uInt } from './u-int';
export { default as withDefault } from './with-default';
export { default as withFormatting } from './with-formatting';
export { default as wrapped } from './wrapped';

export type BinaryData = Buffer | Buffer[] | Buffer[][]
| Array<[Buffer, Array<[Buffer, Buffer[]]>]>;
export interface Field {
  serialize: (value: any, options: any, parameters: any) => BinaryData;
  prepare?: (value: any, options: any, parameters: any) => Promise<any>;
  deserialize: (value: BinaryData, options: any) => any;
  recursiveType?: boolean;
}
