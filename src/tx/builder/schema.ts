/**
 * Transaction Schema for TxBuilder
 */
// # RLP version number
// # https://github.com/aeternity/protocol/blob/master/serializations.md#binary-serialization

import BigNumber from 'bignumber.js';
import { Tag } from './constants';
import {
  Field, uInt, shortUInt, coinAmount, name, nameId, nameFee, deposit, gasLimit, gasPrice, fee,
  address, addresses, pointers, enumeration, mptrees,
} from './field-types';
import { Encoded, Encoding } from '../../utils/encoder';
import { UnionToIntersection } from '../../utils/other';
import { AddressEncodings } from './field-types/address';

export enum ORACLE_TTL_TYPES {
  delta = 0,
  block = 1,
}

// # TRANSACTION DEFAULT TTL
export const TX_TTL = 0;
// # ORACLE
export const QUERY_FEE = 30000;
export const ORACLE_TTL = { type: ORACLE_TTL_TYPES.delta, value: 500 };
export const QUERY_TTL = { type: ORACLE_TTL_TYPES.delta, value: 10 };
export const RESPONSE_TTL = { type: ORACLE_TTL_TYPES.delta, value: 10 };
// # CONTRACT
export const DRY_RUN_ACCOUNT = {
  pub: 'ak_11111111111111111111111111111111273Yts',
  amount: 100000000000000000000000000000000000n,
} as const;

export type TxField = [
  name: string,
  type: FIELD_TYPES | Field,
  prefix?: Encoding | Encoding[],
];

/**
 * @category transaction builder
 * @see {@link https://github.com/aeternity/protocol/blob/0f6dee3d9d1e8e2469816798f5c7587a6c918f94/contracts/contract_vms.md#virtual-machines-on-the-%C3%A6ternity-blockchain}
 */
export enum VM_VERSIONS {
  NO_VM = 0,
  SOPHIA = 1,
  SOPHIA_IMPROVEMENTS_MINERVA = 3,
  SOPHIA_IMPROVEMENTS_FORTUNA = 4,
  FATE = 5,
  SOPHIA_IMPROVEMENTS_LIMA = 6,
  FATE_2 = 7,
}

/**
 * @category transaction builder
 * @see {@link https://github.com/aeternity/protocol/blob/0f6dee3d9d1e8e2469816798f5c7587a6c918f94/contracts/contract_vms.md#virtual-machines-on-the-%C3%A6ternity-blockchain}
 */
export enum ABI_VERSIONS {
  NO_ABI = 0,
  SOPHIA = 1,
  FATE = 3,
}

export enum CallReturnType {
  Ok = 0,
  Error = 1,
  Revert = 2,
}

/**
 * @category transaction builder
 */
export enum PROTOCOL_VERSIONS {
  IRIS = 5,
}

// First abi/vm by default
export const PROTOCOL_VM_ABI = {
  [PROTOCOL_VERSIONS.IRIS]: {
    [Tag.ContractCreateTx]: {
      vmVersion: [VM_VERSIONS.FATE_2], abiVersion: [ABI_VERSIONS.FATE],
    },
    // TODO: Ensure that AEVM (SOPHIA?) is still available here
    [Tag.ContractCallTx]: {
      vmVersion: [], abiVersion: [ABI_VERSIONS.FATE, ABI_VERSIONS.SOPHIA],
    },
    [Tag.OracleRegisterTx]: {
      vmVersion: [], abiVersion: [ABI_VERSIONS.NO_ABI, ABI_VERSIONS.SOPHIA],
    },
  },
} as const;

type PrefixType<Prefix> = Prefix extends Encoding
  ? Encoded.Generic<Prefix>
  : Prefix extends readonly Encoding[]
    ? Encoded.Generic<Prefix[number]>
    : Encoded.Generic<any>;

/**
 * @category transaction builder
 */
export interface CtVersion {
  vmVersion: VM_VERSIONS;
  abiVersion: ABI_VERSIONS;
}

/**
 * @category transaction builder
 */
export enum FIELD_TYPES {
  string,
  binary,
  bool,
  hex,
  rlpBinary,
  rlpBinaries,
  rawBinary,
  signatures,
  offChainUpdates,
  callStack,
  proofOfInclusion,
  ctVersion,
  sophiaCodeTypeInfo,
  payload,
  stateTree,
}

interface BuildFieldTypes<Prefix extends undefined | Encoding | readonly Encoding[]> {
  [FIELD_TYPES.string]: string;
  [FIELD_TYPES.binary]: PrefixType<Prefix>;
  [FIELD_TYPES.bool]: Boolean;
  [FIELD_TYPES.hex]: string;
  [FIELD_TYPES.rlpBinary]: any;
  [FIELD_TYPES.rlpBinaries]: any[];
  [FIELD_TYPES.rawBinary]: Uint8Array;
  [FIELD_TYPES.signatures]: Uint8Array[];
  [FIELD_TYPES.offChainUpdates]: any;
  [FIELD_TYPES.callStack]: any;
  [FIELD_TYPES.proofOfInclusion]: any;
  [FIELD_TYPES.ctVersion]: CtVersion;
  [FIELD_TYPES.sophiaCodeTypeInfo]: any;
  [FIELD_TYPES.payload]: string | undefined;
  [FIELD_TYPES.stateTree]: any;
}

type TxElem = readonly [string, FIELD_TYPES | Field]
| readonly [string, FIELD_TYPES, Encoding | readonly Encoding[]];

type BuildTxArgBySchemaType<
  Type extends FIELD_TYPES | Field,
  Prefix extends undefined | Encoding | readonly Encoding[],
> =
  Type extends Field
    ? Parameters<Type['serialize']>[0]
    : Type extends FIELD_TYPES
      ? BuildFieldTypes<Prefix>[Type]
      : never;

type NullablePartial<
  T,
  NK extends keyof T = { [K in keyof T]: undefined extends T[K] ? K : never }[keyof T],
> = Partial<Pick<T, NK>> & Omit<T, NK>;

type BuildTxArgBySchema<SchemaLine> =
  UnionToIntersection<
  SchemaLine extends ReadonlyArray<infer Elem>
    ? Elem extends TxElem
      ? NullablePartial<{ [k in Elem[0]]: BuildTxArgBySchemaType<Elem[1], Elem[2]> }>
      : never
    : never
  >;

export type RawTxObject<Tx extends TxSchema> = {
  [k in keyof Tx]-?: Tx[k] extends BigNumber ? string : Tx[k]
};

const BASE_TX = [
  ['tag', shortUInt],
  ['VSN', shortUInt],
] as const;

/**
 * @see {@link https://github.com/aeternity/protocol/blob/c007deeac4a01e401238412801ac7084ac72d60e/serializations.md#accounts-version-1-basic-accounts}
 */
export const TX_SCHEMA = {
  [Tag.Account]: {
    1: [
      ...BASE_TX,
      ['nonce', shortUInt],
      ['balance', uInt],
    ],
    2: [
      ...BASE_TX,
      ['flags', uInt],
      ['nonce', shortUInt],
      ['balance', uInt],
      ['gaContract', address<Encoding.ContractAddress | Encoding.Name>()],
      ['gaAuthFun', FIELD_TYPES.binary, Encoding.ContractBytearray],
    ],
  },
  [Tag.SignedTx]: {
    1: [
      ...BASE_TX,
      ['signatures', FIELD_TYPES.signatures],
      ['encodedTx', FIELD_TYPES.rlpBinary],
    ],
  },
  [Tag.SpendTx]: {
    1: [
      ...BASE_TX,
      ['senderId', address<Encoding.AccountAddress>()],
      ['recipientId', address<Encoding.AccountAddress | Encoding.Name>()],
      ['amount', coinAmount],
      ['fee', fee],
      ['ttl', shortUInt],
      ['nonce', shortUInt],
      ['payload', FIELD_TYPES.payload],
    ],
  },
  [Tag.Name]: {
    1: [
      ...BASE_TX,
      ['accountId', address<Encoding.AccountAddress>()],
      ['nameTtl', shortUInt],
      ['status', FIELD_TYPES.binary],
      ['clientTtl', shortUInt],
      ['pointers', pointers],
    ],
  },
  [Tag.NamePreclaimTx]: {
    1: [
      ...BASE_TX,
      ['accountId', address<Encoding.AccountAddress>()],
      ['nonce', shortUInt],
      ['commitmentId', address<Encoding.Commitment>()],
      ['fee', fee],
      ['ttl', shortUInt],
    ],
  },
  [Tag.NameClaimTx]: {
    2: [
      ...BASE_TX,
      ['accountId', address<Encoding.AccountAddress>()],
      ['nonce', shortUInt],
      ['name', name],
      ['nameSalt', uInt],
      ['nameFee', nameFee],
      ['fee', fee],
      ['ttl', shortUInt],
    ],
  },
  [Tag.NameUpdateTx]: {
    1: [
      ...BASE_TX,
      ['accountId', address<Encoding.AccountAddress>()],
      ['nonce', shortUInt],
      ['nameId', nameId],
      ['nameTtl', shortUInt],
      ['pointers', pointers],
      ['clientTtl', shortUInt],
      ['fee', fee],
      ['ttl', shortUInt],
    ],
  },
  [Tag.NameTransferTx]: {
    1: [
      ...BASE_TX,
      ['accountId', address<Encoding.AccountAddress>()],
      ['nonce', shortUInt],
      ['nameId', nameId],
      ['recipientId', address<Encoding.AccountAddress | Encoding.Name>()],
      ['fee', fee],
      ['ttl', shortUInt],
    ],
  },
  [Tag.NameRevokeTx]: {
    1: [
      ...BASE_TX,
      ['accountId', address<Encoding.AccountAddress>()],
      ['nonce', shortUInt],
      ['nameId', nameId],
      ['fee', fee],
      ['ttl', shortUInt],
    ],
  },
  [Tag.Contract]: {
    1: [
      ...BASE_TX,
      ['owner', address<Encoding.AccountAddress>()],
      ['ctVersion', FIELD_TYPES.ctVersion],
      ['code', FIELD_TYPES.binary, Encoding.ContractBytearray],
      ['log', FIELD_TYPES.binary, Encoding.ContractBytearray],
      ['active', FIELD_TYPES.bool],
      ['referers', addresses<Encoding.AccountAddress>()],
      ['deposit', deposit],
    ],
  },
  [Tag.ContractCreateTx]: {
    1: [
      ...BASE_TX,
      ['ownerId', address<Encoding.AccountAddress>()],
      ['nonce', shortUInt],
      ['code', FIELD_TYPES.binary, Encoding.ContractBytearray],
      ['ctVersion', FIELD_TYPES.ctVersion],
      ['fee', fee],
      ['ttl', shortUInt],
      ['deposit', deposit],
      ['amount', coinAmount],
      ['gasLimit', gasLimit],
      ['gasPrice', gasPrice],
      ['callData', FIELD_TYPES.binary, Encoding.ContractBytearray],
    ],
  },
  [Tag.ContractCallTx]: {
    1: [
      ...BASE_TX,
      ['callerId', address<Encoding.AccountAddress>()],
      ['nonce', shortUInt],
      ['contractId', address<Encoding.ContractAddress | Encoding.Name>()],
      ['abiVersion', enumeration<ABI_VERSIONS>()],
      ['fee', fee],
      ['ttl', shortUInt],
      ['amount', coinAmount],
      ['gasLimit', gasLimit],
      ['gasPrice', gasPrice],
      ['callData', FIELD_TYPES.binary, Encoding.ContractBytearray],
    ],
  },
  [Tag.ContractCall]: {
    1: [
      ...BASE_TX,
      ['callerId', address<Encoding.AccountAddress>()],
      ['callerNonce', shortUInt],
      ['height', shortUInt],
      ['contractId', address<Encoding.ContractAddress>()],
      ['gasPrice', gasPrice],
      ['gasUsed', shortUInt],
      ['returnValue', FIELD_TYPES.binary, Encoding.ContractBytearray],
      ['returnType', enumeration<CallReturnType>()],
      // TODO: add serialization for
      //  <log> :: [ { <address> :: id, [ <topics> :: binary() ], <data> :: binary() } ]
      ['log', FIELD_TYPES.rawBinary],
    ],
  },
  [Tag.Oracle]: {
    1: [
      ...BASE_TX,
      ['accountId', address<Encoding.AccountAddress>()],
      ['queryFormat', FIELD_TYPES.string],
      ['responseFormat', FIELD_TYPES.string],
      ['queryFee', coinAmount],
      ['oracleTtlValue', shortUInt],
      ['abiVersion', enumeration<ABI_VERSIONS>()],
    ],
  },
  [Tag.OracleRegisterTx]: {
    1: [
      ...BASE_TX,
      ['accountId', address<Encoding.AccountAddress>()],
      ['nonce', shortUInt],
      ['queryFormat', FIELD_TYPES.string],
      ['responseFormat', FIELD_TYPES.string],
      ['queryFee', coinAmount],
      ['oracleTtlType', enumeration<ORACLE_TTL_TYPES>()],
      ['oracleTtlValue', shortUInt],
      ['fee', fee],
      ['ttl', shortUInt],
      ['abiVersion', enumeration<ABI_VERSIONS>()],
    ],
  },
  [Tag.OracleExtendTx]: {
    1: [
      ...BASE_TX,
      ['oracleId', address<Encoding.OracleAddress | Encoding.Name>()],
      ['nonce', shortUInt],
      ['oracleTtlType', enumeration<ORACLE_TTL_TYPES>()],
      ['oracleTtlValue', shortUInt],
      ['fee', fee],
      ['ttl', shortUInt],
    ],
  },
  [Tag.OracleQueryTx]: {
    1: [
      ...BASE_TX,
      ['senderId', address<Encoding.AccountAddress>()],
      ['nonce', shortUInt],
      ['oracleId', address<Encoding.OracleAddress | Encoding.Name>()],
      ['query', FIELD_TYPES.string],
      ['queryFee', coinAmount],
      ['queryTtlType', enumeration<ORACLE_TTL_TYPES>()],
      ['queryTtlValue', shortUInt],
      ['responseTtlType', enumeration<ORACLE_TTL_TYPES>()],
      ['responseTtlValue', shortUInt],
      ['fee', fee],
      ['ttl', shortUInt],
    ],
  },
  [Tag.OracleResponseTx]: {
    1: [
      ...BASE_TX,
      ['oracleId', address<Encoding.OracleAddress>()],
      ['nonce', shortUInt],
      ['queryId', FIELD_TYPES.binary, Encoding.OracleQueryId],
      ['response', FIELD_TYPES.string],
      ['responseTtlType', enumeration<ORACLE_TTL_TYPES>()],
      ['responseTtlValue', shortUInt],
      ['fee', fee],
      ['ttl', shortUInt],
    ],
  },
  [Tag.ChannelCreateTx]: {
    2: [
      ...BASE_TX,
      ['initiator', address<Encoding.AccountAddress>()],
      ['initiatorAmount', uInt],
      ['responder', address<Encoding.AccountAddress>()],
      ['responderAmount', uInt],
      ['channelReserve', uInt],
      ['lockPeriod', uInt],
      ['ttl', shortUInt],
      ['fee', fee],
      ['initiatorDelegateIds', FIELD_TYPES.string],
      ['responderDelegateIds', FIELD_TYPES.string],
      ['stateHash', FIELD_TYPES.binary, Encoding.State],
      ['nonce', shortUInt],
    ],
  },
  [Tag.ChannelCloseMutualTx]: {
    1: [
      ...BASE_TX,
      ['channelId', address<Encoding.Channel>()],
      ['fromId', address<Encoding.AccountAddress>()],
      ['initiatorAmountFinal', uInt],
      ['responderAmountFinal', uInt],
      ['ttl', shortUInt],
      ['fee', fee],
      ['nonce', shortUInt],
    ],
  },
  [Tag.ChannelCloseSoloTx]: {
    1: [
      ...BASE_TX,
      ['channelId', address<Encoding.Channel>()],
      ['fromId', address<Encoding.AccountAddress>()],
      ['payload', FIELD_TYPES.binary, Encoding.Transaction],
      ['poi', FIELD_TYPES.binary, Encoding.Poi],
      ['ttl', shortUInt],
      ['fee', fee],
      ['nonce', shortUInt],
    ],
  },
  [Tag.ChannelSlashTx]: {
    1: [
      ...BASE_TX,
      ['channelId', address<Encoding.Channel>()],
      ['fromId', address<Encoding.AccountAddress>()],
      ['payload', FIELD_TYPES.binary, Encoding.Transaction],
      ['poi', FIELD_TYPES.binary, Encoding.Poi],
      ['ttl', shortUInt],
      ['fee', fee],
      ['nonce', shortUInt],
    ],
  },
  [Tag.ChannelDepositTx]: {
    1: [
      ...BASE_TX,
      ['channelId', address<Encoding.Channel>()],
      ['fromId', address<Encoding.AccountAddress>()],
      ['amount', uInt],
      ['ttl', shortUInt],
      ['fee', fee],
      ['stateHash', FIELD_TYPES.binary, Encoding.State],
      ['round', shortUInt],
      ['nonce', shortUInt],
    ],
  },
  [Tag.ChannelWithdrawTx]: {
    1: [
      ...BASE_TX,
      ['channelId', address<Encoding.Channel>()],
      ['toId', address<Encoding.AccountAddress>()],
      ['amount', uInt],
      ['ttl', shortUInt],
      ['fee', fee],
      ['stateHash', FIELD_TYPES.binary, Encoding.State],
      ['round', shortUInt],
      ['nonce', shortUInt],
    ],
  },
  [Tag.ChannelSettleTx]: {
    1: [
      ...BASE_TX,
      ['channelId', address<Encoding.Channel>()],
      ['fromId', address<Encoding.AccountAddress>()],
      ['initiatorAmountFinal', uInt],
      ['responderAmountFinal', uInt],
      ['ttl', shortUInt],
      ['fee', fee],
      ['nonce', shortUInt],
    ],
  },
  [Tag.ChannelForceProgressTx]: {
    1: [
      ...BASE_TX,
      ['channelId', address<Encoding.Channel>()],
      ['fromId', address<Encoding.AccountAddress>()],
      ['payload', FIELD_TYPES.binary, Encoding.Transaction],
      ['round', shortUInt],
      ['update', FIELD_TYPES.binary, Encoding.ContractBytearray],
      ['stateHash', FIELD_TYPES.binary, Encoding.State],
      ['offChainTrees', FIELD_TYPES.stateTree],
      ['ttl', shortUInt],
      ['fee', fee],
      ['nonce', shortUInt],
    ],
  },
  [Tag.ChannelOffChainTx]: {
    2: [
      ...BASE_TX,
      ['channelId', address<Encoding.Channel>()],
      ['round', shortUInt],
      ['stateHash', FIELD_TYPES.binary, Encoding.State],
    ],
  },
  [Tag.Channel]: {
    3: [
      ...BASE_TX,
      ['initiator', address<Encoding.AccountAddress>()],
      ['responder', address<Encoding.AccountAddress>()],
      ['channelAmount', uInt],
      ['initiatorAmount', uInt],
      ['responderAmount', uInt],
      ['channelReserve', uInt],
      ['initiatorDelegateIds', addresses<AddressEncodings>()],
      ['responderDelegateIds', addresses<AddressEncodings>()],
      ['stateHash', FIELD_TYPES.hex],
      ['round', shortUInt],
      ['soloRound', uInt],
      ['lockPeriod', uInt],
      ['lockedUntil', uInt],
      ['initiatorAuth', FIELD_TYPES.binary, Encoding.ContractBytearray],
      ['responderAuth', FIELD_TYPES.binary, Encoding.ContractBytearray],
    ],
  },
  [Tag.ChannelSnapshotSoloTx]: {
    1: [
      ...BASE_TX,
      ['channelId', address<Encoding.Channel>()],
      ['fromId', address<Encoding.AccountAddress>()],
      ['payload', FIELD_TYPES.binary, Encoding.Transaction],
      ['ttl', shortUInt],
      ['fee', fee],
      ['nonce', shortUInt],
    ],
  },
  [Tag.ChannelOffChainUpdateTransfer]: {
    1: [
      ...BASE_TX,
      ['from', address<Encoding.AccountAddress>()],
      ['to', address<Encoding.AccountAddress>()],
      ['amount', uInt],
    ],
  },
  [Tag.ChannelOffChainUpdateDeposit]: {
    1: [
      ...BASE_TX,
      ['from', address<Encoding.AccountAddress>()],
      ['amount', uInt],
    ],
  },
  [Tag.ChannelOffChainUpdateWithdraw]: {
    1: [
      ...BASE_TX,
      ['from', address<Encoding.AccountAddress>()],
      ['amount', uInt],
    ],
  },
  [Tag.ChannelOffChainUpdateCreateContract]: {
    1: [
      ...BASE_TX,
      ['owner', address<Encoding.AccountAddress>()],
      ['ctVersion', FIELD_TYPES.ctVersion],
      ['code', FIELD_TYPES.binary, Encoding.ContractBytearray],
      ['deposit', uInt],
      ['callData', FIELD_TYPES.binary, Encoding.ContractBytearray],
    ],
  },
  [Tag.ChannelOffChainUpdateCallContract]: {
    1: [
      ...BASE_TX,
      ['caller', address<Encoding.AccountAddress>()],
      ['contract', address<Encoding.ContractAddress>()],
      ['abiVersion', enumeration<ABI_VERSIONS>()],
      ['amount', uInt],
      ['callData', FIELD_TYPES.binary, Encoding.ContractBytearray],
      ['callStack', FIELD_TYPES.callStack],
      ['gasPrice', gasPrice],
      ['gasLimit', gasLimit],
    ],
  },
  [Tag.ChannelClientReconnectTx]: {
    1: [
      ...BASE_TX,
      ['channelId', address<Encoding.Channel>()],
      ['round', shortUInt],
      ['role', FIELD_TYPES.string],
      ['pubkey', address<Encoding.AccountAddress>()],
    ],
  },
  [Tag.TreesPoi]: {
    1: [
      ...BASE_TX,
      ['accounts', mptrees(Encoding.AccountAddress, Tag.Account)],
      ['calls', mptrees(Encoding.Bytearray, Tag.ContractCall)],
      ['channels', mptrees(Encoding.Channel, Tag.Channel)],
      ['contracts', mptrees(Encoding.ContractAddress, Tag.Contract)],
      ['ns', mptrees(Encoding.Name, Tag.Name)],
      ['oracles', mptrees(Encoding.OracleAddress, Tag.Oracle)],
    ],
  },
  [Tag.StateTrees]: {
    1: [
      ...BASE_TX,
      ['contracts', FIELD_TYPES.rlpBinary],
      ['calls', FIELD_TYPES.rlpBinary],
      ['channels', FIELD_TYPES.rlpBinary],
      ['ns', FIELD_TYPES.rlpBinary],
      ['oracles', FIELD_TYPES.rlpBinary],
      ['accounts', FIELD_TYPES.rlpBinary],
    ],
  },
  [Tag.Mtree]: {
    1: [
      ...BASE_TX,
      ['values', FIELD_TYPES.rlpBinaries],
    ],
  },
  [Tag.MtreeValue]: {
    1: [
      ...BASE_TX,
      ['key', FIELD_TYPES.hex],
      ['value', FIELD_TYPES.rawBinary],
    ],
  },
  [Tag.ContractsMtree]: {
    1: [
      ...BASE_TX,
      ['contracts', FIELD_TYPES.rlpBinary],
    ],
  },
  [Tag.CallsMtree]: {
    1: [
      ...BASE_TX,
      ['calls', FIELD_TYPES.rlpBinary],
    ],
  },
  [Tag.ChannelsMtree]: {
    1: [
      ...BASE_TX,
      ['channels', FIELD_TYPES.rlpBinary],
    ],
  },
  [Tag.NameserviceMtree]: {
    1: [
      ...BASE_TX,
      ['mtree', FIELD_TYPES.rlpBinary],
    ],
  },
  [Tag.OraclesMtree]: {
    1: [
      ...BASE_TX,
      ['otree', FIELD_TYPES.rlpBinary],
    ],
  },
  [Tag.AccountsMtree]: {
    1: [
      ...BASE_TX,
      ['accounts', FIELD_TYPES.rlpBinary],
    ],
  },
  [Tag.GaAttachTx]: {
    1: [
      ...BASE_TX,
      ['ownerId', address<Encoding.AccountAddress>()],
      ['nonce', shortUInt],
      ['code', FIELD_TYPES.binary, Encoding.ContractBytearray],
      ['authFun', FIELD_TYPES.rawBinary],
      ['ctVersion', FIELD_TYPES.ctVersion],
      ['fee', fee],
      ['ttl', shortUInt],
      ['gasLimit', gasLimit],
      ['gasPrice', gasPrice],
      ['callData', FIELD_TYPES.binary, Encoding.ContractBytearray],
    ],
  },
  [Tag.GaMetaTx]: {
    2: [
      ...BASE_TX,
      ['gaId', address<Encoding.AccountAddress>()],
      ['authData', FIELD_TYPES.binary, Encoding.ContractBytearray],
      ['abiVersion', enumeration<ABI_VERSIONS>()],
      ['fee', fee],
      ['gasLimit', gasLimit],
      ['gasPrice', gasPrice],
      ['tx', FIELD_TYPES.rlpBinary],
    ],
  },
  [Tag.PayingForTx]: {
    1: [
      ...BASE_TX,
      ['payerId', address<Encoding.AccountAddress>()],
      ['nonce', shortUInt],
      ['fee', fee],
      ['tx', FIELD_TYPES.rlpBinary],
    ],
  },
  [Tag.CompilerSophia]: {
    3: [
      ...BASE_TX,
      ['sourceCodeHash', FIELD_TYPES.rawBinary],
      ['typeInfo', FIELD_TYPES.sophiaCodeTypeInfo],
      ['byteCode', FIELD_TYPES.rawBinary],
      ['compilerVersion', FIELD_TYPES.string],
      ['payable', FIELD_TYPES.bool],
    ],
  },
} as const;

export type TxTypeSchemas = {
  [key in Tag]: BuildTxArgBySchema<
    typeof TX_SCHEMA[key][keyof typeof TX_SCHEMA[key]]
  >
};

export type TxSchema = TxTypeSchemas[Tag];
export type TxParamsCommon = Partial<UnionToIntersection<TxSchema>>;
