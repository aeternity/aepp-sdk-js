import SchemaTypes from '../SchemaTypes';
import address from '../field-types/address';
import nameId from '../field-types/name-id';
import shortUIntConst from '../field-types/short-u-int-const';
import {
  Encoded, Encoding, decode, encode,
} from '../../../utils/encoder';

/**
 * @category delegation signature
 */
export enum DelegationTag {
  AensWildcard = 1,
  AensName = 2,
  AensPreclaim = 3,
  Oracle = 4,
  OracleResponse = 5,
}

const oracleAddressField = address(Encoding.OracleAddress);
const queryIdField = {
  serialize(value: Encoded.OracleQueryId): Buffer {
    return oracleAddressField.serialize(encode(decode(value), Encoding.OracleAddress));
  },
  deserialize(value: Buffer): Encoded.OracleQueryId {
    return encode(decode(oracleAddressField.deserialize(value)), Encoding.OracleQueryId);
  },
} as const;

/**
 * @see {@link https://github.com/aeternity/protocol/blob/8a9d1d1206174627f6aaef86159dc9c643080653/contracts/fate.md#from-ceres-serialized-signature-data}
 */
export const schemas = [{
  tag: shortUIntConst(DelegationTag.AensWildcard),
  version: shortUIntConst(1, true),
  accountAddress: address(Encoding.AccountAddress),
  contractAddress: address(Encoding.ContractAddress),
}, {
  tag: shortUIntConst(DelegationTag.AensName),
  version: shortUIntConst(1, true),
  accountAddress: address(Encoding.AccountAddress),
  nameId,
  contractAddress: address(Encoding.ContractAddress),
}, {
  tag: shortUIntConst(DelegationTag.AensPreclaim),
  version: shortUIntConst(1, true),
  accountAddress: address(Encoding.AccountAddress),
  contractAddress: address(Encoding.ContractAddress),
}, {
  tag: shortUIntConst(DelegationTag.Oracle),
  version: shortUIntConst(1, true),
  accountAddress: address(Encoding.AccountAddress),
  contractAddress: address(Encoding.ContractAddress),
}, {
  tag: shortUIntConst(DelegationTag.OracleResponse),
  version: shortUIntConst(1, true),
  queryId: queryIdField,
  contractAddress: address(Encoding.ContractAddress),
}] as const;

type Schemas = SchemaTypes<typeof schemas>;
export type DlgParams = Schemas['TxParams'];
export type DlgUnpacked = Schemas['TxUnpacked'];
