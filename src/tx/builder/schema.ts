/**
 * Transaction Schema for TxBuilder
 */
// # RLP version number
// # https://github.com/aeternity/protocol/blob/master/serializations.md#binary-serialization

import BigNumber from 'bignumber.js';
import { Tag } from './constants';
import {
  Field, uInt, shortUInt, coinAmount, name, nameId, nameFee, deposit, gasLimit, gasPrice, fee,
} from './field-types';
import { Encoded, Encoding } from '../../utils/encoder';
import MPTree from '../../utils/mptree';
import { NamePointer } from '../../apis/node';

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
export const AMOUNT = 0;
export const MAX_AUTH_FUN_GAS = 50000;
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
  id,
  ids,
  string,
  binary,
  bool,
  hex,
  rlpBinary,
  rlpBinaries,
  rawBinary,
  signatures,
  pointers,
  offChainUpdates,
  callStack,
  proofOfInclusion,
  mptrees,
  callReturnType,
  ctVersion,
  abiVersion,
  ttlType,
  sophiaCodeTypeInfo,
  payload,
  stateTree,
}

interface BuildFieldTypes<Prefix extends undefined | Encoding | readonly Encoding[]> {
  [FIELD_TYPES.id]: PrefixType<Prefix>;
  [FIELD_TYPES.ids]: Array<Encoded.Generic<Prefix extends Encoding[] ? Prefix : any>>;
  [FIELD_TYPES.string]: string;
  [FIELD_TYPES.binary]: PrefixType<Prefix>;
  [FIELD_TYPES.bool]: Boolean;
  [FIELD_TYPES.hex]: string;
  [FIELD_TYPES.rlpBinary]: any;
  [FIELD_TYPES.rlpBinaries]: any[];
  [FIELD_TYPES.rawBinary]: Uint8Array;
  [FIELD_TYPES.signatures]: Uint8Array[];
  [FIELD_TYPES.pointers]: NamePointer[];
  [FIELD_TYPES.offChainUpdates]: any;
  [FIELD_TYPES.callStack]: any;
  [FIELD_TYPES.proofOfInclusion]: any;
  [FIELD_TYPES.mptrees]: MPTree[];
  [FIELD_TYPES.callReturnType]: any;
  [FIELD_TYPES.ctVersion]: CtVersion;
  [FIELD_TYPES.abiVersion]: ABI_VERSIONS;
  [FIELD_TYPES.ttlType]: ORACLE_TTL_TYPES;
  [FIELD_TYPES.sophiaCodeTypeInfo]: any;
  [FIELD_TYPES.payload]: string | undefined;
  [FIELD_TYPES.stateTree]: any;
}

// based on https://stackoverflow.com/a/50375286/6176994
type UnionToIntersection<Union> =
  (Union extends any ? (k: Union) => void : never) extends ((k: infer Intersection) => void)
    ? Intersection : never;

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
      ['gaContract', FIELD_TYPES.id, [Encoding.ContractAddress, Encoding.Name]],
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
      ['senderId', FIELD_TYPES.id, Encoding.AccountAddress],
      ['recipientId', FIELD_TYPES.id, [Encoding.AccountAddress, Encoding.Name]],
      ['amount', coinAmount],
      ['fee', fee],
      ['ttl', shortUInt],
      ['nonce', shortUInt],
      ['payload', FIELD_TYPES.payload],
    ],
  },
  [Tag.NamePreclaimTx]: {
    1: [
      ...BASE_TX,
      ['accountId', FIELD_TYPES.id, Encoding.AccountAddress],
      ['nonce', shortUInt],
      ['commitmentId', FIELD_TYPES.id, Encoding.Commitment],
      ['fee', fee],
      ['ttl', shortUInt],
    ],
  },
  [Tag.NameClaimTx]: {
    2: [
      ...BASE_TX,
      ['accountId', FIELD_TYPES.id, Encoding.AccountAddress],
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
      ['accountId', FIELD_TYPES.id, Encoding.AccountAddress],
      ['nonce', shortUInt],
      ['nameId', nameId],
      ['nameTtl', uInt],
      ['pointers', FIELD_TYPES.pointers],
      ['clientTtl', shortUInt],
      ['fee', fee],
      ['ttl', shortUInt],
    ],
  },
  [Tag.NameTransferTx]: {
    1: [
      ...BASE_TX,
      ['accountId', FIELD_TYPES.id, Encoding.AccountAddress],
      ['nonce', shortUInt],
      ['nameId', nameId],
      ['recipientId', FIELD_TYPES.id, [Encoding.AccountAddress, Encoding.Name]],
      ['fee', fee],
      ['ttl', shortUInt],
    ],
  },
  [Tag.NameRevokeTx]: {
    1: [
      ...BASE_TX,
      ['accountId', FIELD_TYPES.id, Encoding.AccountAddress],
      ['nonce', shortUInt],
      ['nameId', nameId],
      ['fee', fee],
      ['ttl', shortUInt],
    ],
  },
  [Tag.Contract]: {
    1: [
      ...BASE_TX,
      ['owner', FIELD_TYPES.id, Encoding.AccountAddress],
      ['ctVersion', FIELD_TYPES.ctVersion],
      ['code', FIELD_TYPES.binary, Encoding.ContractBytearray],
      ['log', FIELD_TYPES.binary, Encoding.ContractBytearray],
      ['active', FIELD_TYPES.bool],
      ['referers', FIELD_TYPES.ids, Encoding.AccountAddress],
      ['deposit', deposit],
    ],
  },
  [Tag.ContractCreateTx]: {
    1: [
      ...BASE_TX,
      ['ownerId', FIELD_TYPES.id, Encoding.AccountAddress],
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
      ['callerId', FIELD_TYPES.id, Encoding.AccountAddress],
      ['nonce', shortUInt],
      ['contractId', FIELD_TYPES.id, [Encoding.ContractAddress, Encoding.Name]],
      ['abiVersion', FIELD_TYPES.abiVersion],
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
      ['callerId', FIELD_TYPES.id, Encoding.AccountAddress],
      ['callerNonce', shortUInt],
      ['height', shortUInt],
      ['contractId', FIELD_TYPES.id, Encoding.ContractAddress],
      ['gasPrice', gasPrice],
      ['gasUsed', shortUInt],
      ['returnValue', FIELD_TYPES.binary, Encoding.ContractBytearray],
      ['returnType', FIELD_TYPES.callReturnType],
      // TODO: add serialization for
      //  <log> :: [ { <address> :: id, [ <topics> :: binary() ], <data> :: binary() } ]
      ['log', FIELD_TYPES.rawBinary],
    ],
  },
  [Tag.OracleRegisterTx]: {
    1: [
      ...BASE_TX,
      ['accountId', FIELD_TYPES.id, Encoding.AccountAddress],
      ['nonce', shortUInt],
      ['queryFormat', FIELD_TYPES.string],
      ['responseFormat', FIELD_TYPES.string],
      ['queryFee', coinAmount],
      ['oracleTtlType', FIELD_TYPES.ttlType],
      ['oracleTtlValue', shortUInt],
      ['fee', fee],
      ['ttl', shortUInt],
      ['abiVersion', FIELD_TYPES.abiVersion],
    ],
  },
  [Tag.OracleExtendTx]: {
    1: [
      ...BASE_TX,
      ['oracleId', FIELD_TYPES.id, [Encoding.OracleAddress, Encoding.Name]],
      ['nonce', shortUInt],
      ['oracleTtlType', FIELD_TYPES.ttlType],
      ['oracleTtlValue', shortUInt],
      ['fee', fee],
      ['ttl', shortUInt],
    ],
  },
  [Tag.OracleQueryTx]: {
    1: [
      ...BASE_TX,
      ['senderId', FIELD_TYPES.id, Encoding.AccountAddress],
      ['nonce', shortUInt],
      ['oracleId', FIELD_TYPES.id, [Encoding.OracleAddress, Encoding.Name]],
      ['query', FIELD_TYPES.string],
      ['queryFee', coinAmount],
      ['queryTtlType', FIELD_TYPES.ttlType],
      ['queryTtlValue', shortUInt],
      ['responseTtlType', FIELD_TYPES.ttlType],
      ['responseTtlValue', shortUInt],
      ['fee', fee],
      ['ttl', shortUInt],
    ],
  },
  [Tag.OracleResponseTx]: {
    1: [
      ...BASE_TX,
      ['oracleId', FIELD_TYPES.id, Encoding.OracleAddress],
      ['nonce', shortUInt],
      ['queryId', FIELD_TYPES.binary, Encoding.OracleQueryId],
      ['response', FIELD_TYPES.string],
      ['responseTtlType', FIELD_TYPES.ttlType],
      ['responseTtlValue', shortUInt],
      ['fee', fee],
      ['ttl', shortUInt],
    ],
  },
  [Tag.ChannelCreateTx]: {
    2: [
      ...BASE_TX,
      ['initiator', FIELD_TYPES.id, Encoding.AccountAddress],
      ['initiatorAmount', uInt],
      ['responder', FIELD_TYPES.id, Encoding.AccountAddress],
      ['responderAmount', uInt],
      ['channelReserve', uInt],
      ['lockPeriod', uInt],
      ['ttl', shortUInt],
      ['fee', fee],
      ['initiatorDelegateIds', FIELD_TYPES.string],
      ['responderDelegateIds', FIELD_TYPES.string],
      ['stateHash', FIELD_TYPES.binary, 'st'],
      ['nonce', shortUInt],
    ],
  },
  [Tag.ChannelCloseMutualTx]: {
    1: [
      ...BASE_TX,
      ['channelId', FIELD_TYPES.id, Encoding.Channel],
      ['fromId', FIELD_TYPES.id, Encoding.AccountAddress],
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
      ['channelId', FIELD_TYPES.id, Encoding.Channel],
      ['fromId', FIELD_TYPES.id, Encoding.AccountAddress],
      ['payload', FIELD_TYPES.binary, 'tx'],
      ['poi', FIELD_TYPES.binary, 'pi'],
      ['ttl', shortUInt],
      ['fee', fee],
      ['nonce', shortUInt],
    ],
  },
  [Tag.ChannelSlashTx]: {
    1: [
      ...BASE_TX,
      ['channelId', FIELD_TYPES.id, Encoding.Channel],
      ['fromId', FIELD_TYPES.id, Encoding.AccountAddress],
      ['payload', FIELD_TYPES.binary, 'tx'],
      ['poi', FIELD_TYPES.binary, 'pi'],
      ['ttl', shortUInt],
      ['fee', fee],
      ['nonce', shortUInt],
    ],
  },
  [Tag.ChannelDepositTx]: {
    1: [
      ...BASE_TX,
      ['channelId', FIELD_TYPES.id, Encoding.Channel],
      ['fromId', FIELD_TYPES.id, Encoding.AccountAddress],
      ['amount', uInt],
      ['ttl', shortUInt],
      ['fee', fee],
      ['stateHash', FIELD_TYPES.binary, 'st'],
      ['round', shortUInt],
      ['nonce', shortUInt],
    ],
  },
  [Tag.ChannelWithdrawTx]: {
    1: [
      ...BASE_TX,
      ['channelId', FIELD_TYPES.id, Encoding.Channel],
      ['toId', FIELD_TYPES.id, Encoding.AccountAddress],
      ['amount', uInt],
      ['ttl', shortUInt],
      ['fee', fee],
      ['stateHash', FIELD_TYPES.binary, 'st'],
      ['round', shortUInt],
      ['nonce', shortUInt],
    ],
  },
  [Tag.ChannelSettleTx]: {
    1: [
      ...BASE_TX,
      ['channelId', FIELD_TYPES.id, Encoding.Channel],
      ['fromId', FIELD_TYPES.id, Encoding.AccountAddress],
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
      ['channelId', FIELD_TYPES.id, Encoding.Channel],
      ['fromId', FIELD_TYPES.id, Encoding.AccountAddress],
      ['payload', FIELD_TYPES.binary, 'tx'],
      ['round', shortUInt],
      ['update', FIELD_TYPES.binary, Encoding.ContractBytearray],
      ['stateHash', FIELD_TYPES.binary, 'st'],
      ['offChainTrees', FIELD_TYPES.stateTree],
      ['ttl', shortUInt],
      ['fee', fee],
      ['nonce', shortUInt],
    ],
  },
  [Tag.ChannelOffChainTx]: {
    2: [
      ...BASE_TX,
      ['channelId', FIELD_TYPES.id, Encoding.Channel],
      ['round', shortUInt],
      ['stateHash', FIELD_TYPES.binary, 'st'],
    ],
  },
  [Tag.Channel]: {
    3: [
      ...BASE_TX,
      ['initiator', FIELD_TYPES.id, Encoding.AccountAddress],
      ['responder', FIELD_TYPES.id, Encoding.AccountAddress],
      ['channelAmount', uInt],
      ['initiatorAmount', uInt],
      ['responderAmount', uInt],
      ['channelReserve', uInt],
      ['initiatorDelegateIds', FIELD_TYPES.ids],
      ['responderDelegateIds', FIELD_TYPES.ids],
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
      ['channelId', FIELD_TYPES.id, Encoding.Channel],
      ['fromId', FIELD_TYPES.id, Encoding.AccountAddress],
      ['payload', FIELD_TYPES.binary, 'tx'],
      ['ttl', shortUInt],
      ['fee', fee],
      ['nonce', shortUInt],
    ],
  },
  [Tag.ChannelOffChainUpdateTransfer]: {
    1: [
      ...BASE_TX,
      ['from', FIELD_TYPES.id, Encoding.AccountAddress],
      ['to', FIELD_TYPES.id, Encoding.AccountAddress],
      ['amount', uInt],
    ],
  },
  [Tag.ChannelOffChainUpdateDeposit]: {
    1: [
      ...BASE_TX,
      ['from', FIELD_TYPES.id, Encoding.AccountAddress],
      ['amount', uInt],
    ],
  },
  [Tag.ChannelOffChainUpdateWithdraw]: {
    1: [
      ...BASE_TX,
      ['from', FIELD_TYPES.id, Encoding.AccountAddress],
      ['amount', uInt],
    ],
  },
  [Tag.ChannelOffChainUpdateCreateContract]: {
    1: [
      ...BASE_TX,
      ['owner', FIELD_TYPES.id, Encoding.AccountAddress],
      ['ctVersion', FIELD_TYPES.ctVersion],
      ['code', FIELD_TYPES.binary, Encoding.ContractBytearray],
      ['deposit', uInt],
      ['callData', FIELD_TYPES.binary, Encoding.ContractBytearray],
    ],
  },
  [Tag.ChannelOffChainUpdateCallContract]: {
    1: [
      ...BASE_TX,
      ['caller', FIELD_TYPES.id, Encoding.AccountAddress],
      ['contract', FIELD_TYPES.id, Encoding.ContractAddress],
      ['abiVersion', FIELD_TYPES.abiVersion],
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
      ['channelId', FIELD_TYPES.id, Encoding.Channel],
      ['round', shortUInt],
      ['role', FIELD_TYPES.string],
      ['pubkey', FIELD_TYPES.id, Encoding.AccountAddress],
    ],
  },
  [Tag.TreesPoi]: {
    1: [
      ...BASE_TX,
      ['accounts', FIELD_TYPES.mptrees],
      ['calls', FIELD_TYPES.mptrees],
      ['channels', FIELD_TYPES.mptrees],
      ['contracts', FIELD_TYPES.mptrees],
      ['ns', FIELD_TYPES.mptrees],
      ['oracles', FIELD_TYPES.mptrees],
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
      ['ownerId', FIELD_TYPES.id, Encoding.AccountAddress],
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
      ['gaId', FIELD_TYPES.id, Encoding.AccountAddress],
      ['authData', FIELD_TYPES.binary, Encoding.ContractBytearray],
      ['abiVersion', FIELD_TYPES.abiVersion],
      ['fee', fee],
      ['gasLimit', gasLimit],
      ['gasPrice', gasPrice],
      ['tx', FIELD_TYPES.rlpBinary],
    ],
  },
  [Tag.PayingForTx]: {
    1: [
      ...BASE_TX,
      ['payerId', FIELD_TYPES.id, Encoding.AccountAddress],
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
