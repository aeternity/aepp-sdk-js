import SchemaTypes from '../SchemaTypes.js';
import address from '../field-types/address.js';
import nameId from '../field-types/name-id.js';
import shortUIntConst from '../field-types/short-u-int-const.js';
import { Encoded, Encoding, decode, encode } from '../../../utils/encoder.js';

/**
 * @category delegation signature
 */
export enum DelegationTag {
  /**
   * Delegation of all AENS names to a contract
   */
  AensWildcard = 1,
  /**
   * Delegation of an AENS name to a contract
   */
  AensName = 2,
  /**
   * Delegation of AENS preclaim to a contract
   */
  AensPreclaim = 3,
  /**
   * Delegation of oracle operations to a contract
   */
  Oracle = 4,
  /**
   * Delegation of oracle query to a contract
   */
  OracleResponse = 5,
}

const oracleAddressField = address(Encoding.OracleAddress);
/**
 * Oracle query ID to reply by a contract
 */
const queryIdField = {
  serialize(value: Encoded.OracleQueryId): Buffer {
    return oracleAddressField.serialize(encode(decode(value), Encoding.OracleAddress));
  },
  deserialize(value: Buffer): Encoded.OracleQueryId {
    return encode(decode(oracleAddressField.deserialize(value)), Encoding.OracleQueryId);
  },
} as const;

/**
 * Address of a contract to delegate permissions to
 */
const contractAddress = address(Encoding.ContractAddress);

/**
 * @see {@link https://github.com/aeternity/protocol/blob/8a9d1d1206174627f6aaef86159dc9c643080653/contracts/fate.md#from-ceres-serialized-signature-data}
 */
export const schemas = [
  {
    tag: shortUIntConst(DelegationTag.AensWildcard),
    version: shortUIntConst(1, true),
    accountAddress: address(Encoding.AccountAddress),
    contractAddress,
  },
  {
    tag: shortUIntConst(DelegationTag.AensName),
    version: shortUIntConst(1, true),
    accountAddress: address(Encoding.AccountAddress),
    /**
     * AENS name to manage by a contract
     */
    nameId,
    contractAddress,
  },
  {
    tag: shortUIntConst(DelegationTag.AensPreclaim),
    version: shortUIntConst(1, true),
    accountAddress: address(Encoding.AccountAddress),
    contractAddress,
  },
  {
    tag: shortUIntConst(DelegationTag.Oracle),
    version: shortUIntConst(1, true),
    accountAddress: address(Encoding.AccountAddress),
    contractAddress,
  },
  {
    tag: shortUIntConst(DelegationTag.OracleResponse),
    version: shortUIntConst(1, true),
    queryId: queryIdField,
    contractAddress,
  },
] as const;

type Schemas = SchemaTypes<typeof schemas>;
export type DlgParams = Schemas['TxParams'];
export type DlgUnpacked = Schemas['TxUnpacked'];
