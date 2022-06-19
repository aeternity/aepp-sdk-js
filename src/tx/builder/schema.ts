/**
 * Transaction Schema for TxBuilder
 */
// # RLP version number
// # https://github.com/aeternity/protocol/blob/master/serializations.md#binary-serialization

import BigNumber from 'bignumber.js';
import {
  Name, NameId, NameFee, Deposit, Field, GasPrice,
} from './field-types';
import { EncodedData, EncodingType } from '../../utils/encoder';
import MPTree from '../../utils/mptree';
import { NamePointer } from '../../apis/node';

export * from './constants';

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
export const GAS_MAX = 1600000 - 21000;
export const MAX_AUTH_FUN_GAS = 50000;
export const DRY_RUN_ACCOUNT = {
  pub: 'ak_11111111111111111111111111111111273Yts',
  amount: 100000000000000000000000000000000000n,
} as const;

export type TxField = [
  name: string,
  type: FIELD_TYPES | typeof Field,
  prefix?: EncodingType | EncodingType[],
];

/**
 * Enum with transaction types
 * @category transaction builder
 * @see {@link https://github.com/aeternity/protocol/blob/0f6dee3d9d1e8e2469816798f5c7587a6c918f94/serializations.md#binary-serialization}
 */
export enum TX_TYPE {
  account = 10,
  signed = 11,
  spend = 12,
  oracleRegister = 22,
  oracleQuery = 23,
  oracleResponse = 24,
  oracleExtend = 25,
  nameClaim = 32,
  namePreClaim = 33,
  nameUpdate = 34,
  nameRevoke = 35,
  nameTransfer = 36,
  contract = 40,
  contractCallResult = 41,
  contractCreate = 42,
  contractCall = 43,
  channelCreate = 50,
  channelDeposit = 51,
  channelWithdraw = 52,
  channelCloseMutual = 53,
  channelCloseSolo = 54,
  channelSlash = 55,
  channelSettle = 56,
  channelOffChain = 57,
  channel = 58,
  channelSnapshotSolo = 59,
  proofOfInclusion = 60,
  stateTrees = 62,
  merklePatriciaTree = 63,
  merklePatriciaTreeValue = 64,
  sophiaByteCode = 70,
  gaAttach = 80,
  gaMeta = 81,
  payingFor = 82,
  channelForceProgress = 521,
  channelOffChainUpdateTransfer = 570,
  channelOffChainUpdateDeposit = 571,
  channelOffChainUpdateWithdrawal = 572,
  channelOffChainCreateContract = 573,
  channelOffChainCallContract = 574,
  channelReconnect = 575,
  contractsTree = 621,
  contractCallsTree = 622,
  channelsTree = 623,
  nameserviceTree = 624,
  oraclesTree = 625,
  accountsTree = 626,
}

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
    [TX_TYPE.contractCreate]: {
      vmVersion: [VM_VERSIONS.FATE_2], abiVersion: [ABI_VERSIONS.FATE],
    },
    // TODO: Ensure that AEVM (SOPHIA?) is still available here
    [TX_TYPE.contractCall]: {
      vmVersion: [], abiVersion: [ABI_VERSIONS.FATE, ABI_VERSIONS.SOPHIA],
    },
    [TX_TYPE.oracleRegister]: {
      vmVersion: [], abiVersion: [ABI_VERSIONS.NO_ABI, ABI_VERSIONS.SOPHIA],
    },
  },
} as const;

type PrefixType<Prefix> = Prefix extends EncodingType
  ? EncodedData<Prefix>
  : Prefix extends readonly EncodingType[]
    ? EncodedData<Prefix[number]>
    : EncodedData<any>;

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
  int,
  shortInt,
  amount,
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

interface BuildFieldTypes<Prefix extends undefined | EncodingType | readonly EncodingType[]> {
  [FIELD_TYPES.int]: number | string | BigNumber;
  [FIELD_TYPES.shortInt]: number;
  [FIELD_TYPES.amount]: number | string | BigNumber;
  [FIELD_TYPES.id]: PrefixType<Prefix>;
  [FIELD_TYPES.ids]: Array<EncodedData<Prefix extends EncodingType[] ? Prefix : any>>;
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
| readonly [string, FIELD_TYPES, EncodingType | readonly EncodingType[]];

type BuildTxArgBySchemaType<
  Type extends FIELD_TYPES | Field,
  Prefix extends undefined | EncodingType | readonly EncodingType[],
> =
  Type extends typeof Field
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
  [k in keyof Tx]: Tx[k] extends BigNumber ? string : Tx[k]
};

const BASE_TX = [
  ['tag', FIELD_TYPES.shortInt],
  ['VSN', FIELD_TYPES.shortInt],
] as const;

export const TX_SCHEMA = {
  [TX_TYPE.account]: {
    2: [
      ...BASE_TX,
      ['flags', FIELD_TYPES.int],
      ['nonce', FIELD_TYPES.shortInt],
      ['balance', FIELD_TYPES.int],
      ['gaContract', FIELD_TYPES.id, ['ct', 'nm']],
      ['gaAuthFun', FIELD_TYPES.binary, 'cb'],
    ],
  },
  [TX_TYPE.signed]: {
    1: [
      ...BASE_TX,
      ['signatures', FIELD_TYPES.signatures],
      ['encodedTx', FIELD_TYPES.rlpBinary],
    ],
  },
  [TX_TYPE.spend]: {
    1: [
      ...BASE_TX,
      ['senderId', FIELD_TYPES.id, 'ak'],
      ['recipientId', FIELD_TYPES.id, ['ak', 'nm']],
      ['amount', FIELD_TYPES.amount],
      ['fee', FIELD_TYPES.int],
      ['ttl', FIELD_TYPES.shortInt],
      ['nonce', FIELD_TYPES.shortInt],
      ['payload', FIELD_TYPES.payload],
    ],
  },
  [TX_TYPE.namePreClaim]: {
    1: [
      ...BASE_TX,
      ['accountId', FIELD_TYPES.id, 'ak'],
      ['nonce', FIELD_TYPES.shortInt],
      ['commitmentId', FIELD_TYPES.id, 'cm'],
      ['fee', FIELD_TYPES.int],
      ['ttl', FIELD_TYPES.shortInt],
    ],
  },
  [TX_TYPE.nameClaim]: {
    2: [
      ...BASE_TX,
      ['accountId', FIELD_TYPES.id, 'ak'],
      ['nonce', FIELD_TYPES.shortInt],
      ['name', Name],
      ['nameSalt', FIELD_TYPES.int],
      ['nameFee', NameFee],
      ['fee', FIELD_TYPES.int],
      ['ttl', FIELD_TYPES.shortInt],
    ],
  },
  [TX_TYPE.nameUpdate]: {
    1: [
      ...BASE_TX,
      ['accountId', FIELD_TYPES.id, 'ak'],
      ['nonce', FIELD_TYPES.shortInt],
      ['nameId', NameId],
      ['nameTtl', FIELD_TYPES.int],
      ['pointers', FIELD_TYPES.pointers],
      ['clientTtl', FIELD_TYPES.shortInt],
      ['fee', FIELD_TYPES.int],
      ['ttl', FIELD_TYPES.shortInt],
    ],
  },
  [TX_TYPE.nameTransfer]: {
    1: [
      ...BASE_TX,
      ['accountId', FIELD_TYPES.id, 'ak'],
      ['nonce', FIELD_TYPES.shortInt],
      ['nameId', NameId],
      ['recipientId', FIELD_TYPES.id, ['ak', 'nm']],
      ['fee', FIELD_TYPES.int],
      ['ttl', FIELD_TYPES.shortInt],
    ],
  },
  [TX_TYPE.nameRevoke]: {
    1: [
      ...BASE_TX,
      ['accountId', FIELD_TYPES.id, 'ak'],
      ['nonce', FIELD_TYPES.shortInt],
      ['nameId', NameId],
      ['fee', FIELD_TYPES.int],
      ['ttl', FIELD_TYPES.shortInt],
    ],
  },
  [TX_TYPE.contract]: {
    1: [
      ...BASE_TX,
      ['owner', FIELD_TYPES.id, 'ak'],
      ['ctVersion', FIELD_TYPES.ctVersion],
      ['code', FIELD_TYPES.binary, 'cb'],
      ['log', FIELD_TYPES.binary, 'cb'],
      ['active', FIELD_TYPES.bool],
      ['referers', FIELD_TYPES.ids, 'ak'],
      ['deposit', Deposit],
    ],
  },
  [TX_TYPE.contractCreate]: {
    1: [
      ...BASE_TX,
      ['ownerId', FIELD_TYPES.id, 'ak'],
      ['nonce', FIELD_TYPES.shortInt],
      ['code', FIELD_TYPES.binary, 'cb'],
      ['ctVersion', FIELD_TYPES.ctVersion],
      ['fee', FIELD_TYPES.int],
      ['ttl', FIELD_TYPES.shortInt],
      ['deposit', Deposit],
      ['amount', FIELD_TYPES.amount],
      ['gasLimit', FIELD_TYPES.shortInt],
      ['gasPrice', GasPrice],
      ['callData', FIELD_TYPES.binary, 'cb'],
    ],
  },
  [TX_TYPE.contractCall]: {
    1: [
      ...BASE_TX,
      ['callerId', FIELD_TYPES.id, 'ak'],
      ['nonce', FIELD_TYPES.shortInt],
      ['contractId', FIELD_TYPES.id, ['ct', 'nm']],
      ['abiVersion', FIELD_TYPES.abiVersion],
      ['fee', FIELD_TYPES.int],
      ['ttl', FIELD_TYPES.shortInt],
      ['amount', FIELD_TYPES.amount],
      ['gasLimit', FIELD_TYPES.shortInt],
      ['gasPrice', GasPrice],
      ['callData', FIELD_TYPES.binary, 'cb'],
    ],
  },
  [TX_TYPE.contractCallResult]: {
    1: [
      ...BASE_TX,
      ['callerId', FIELD_TYPES.id, 'ak'],
      ['callerNonce', FIELD_TYPES.shortInt],
      ['height', FIELD_TYPES.shortInt],
      ['contractId', FIELD_TYPES.id, 'ct'],
      ['gasPrice', GasPrice],
      ['gasUsed', FIELD_TYPES.shortInt],
      ['returnValue', FIELD_TYPES.binary, 'cb'],
      ['returnType', FIELD_TYPES.callReturnType],
      // TODO: add serialization for
      //  <log> :: [ { <address> :: id, [ <topics> :: binary() ], <data> :: binary() } ]
      ['log', FIELD_TYPES.rawBinary],
    ],
  },
  [TX_TYPE.oracleRegister]: {
    1: [
      ...BASE_TX,
      ['accountId', FIELD_TYPES.id, 'ak'],
      ['nonce', FIELD_TYPES.shortInt],
      ['queryFormat', FIELD_TYPES.string],
      ['responseFormat', FIELD_TYPES.string],
      ['queryFee', FIELD_TYPES.amount],
      ['oracleTtlType', FIELD_TYPES.ttlType],
      ['oracleTtlValue', FIELD_TYPES.shortInt],
      ['fee', FIELD_TYPES.int],
      ['ttl', FIELD_TYPES.shortInt],
      ['abiVersion', FIELD_TYPES.abiVersion],
    ],
  },
  [TX_TYPE.oracleExtend]: {
    1: [
      ...BASE_TX,
      ['oracleId', FIELD_TYPES.id, ['ok', 'nm']],
      ['nonce', FIELD_TYPES.shortInt],
      ['oracleTtlType', FIELD_TYPES.ttlType],
      ['oracleTtlValue', FIELD_TYPES.shortInt],
      ['fee', FIELD_TYPES.int],
      ['ttl', FIELD_TYPES.shortInt],
    ],
  },
  [TX_TYPE.oracleQuery]: {
    1: [
      ...BASE_TX,
      ['senderId', FIELD_TYPES.id, 'ak'],
      ['nonce', FIELD_TYPES.shortInt],
      ['oracleId', FIELD_TYPES.id, ['ok', 'nm']],
      ['query', FIELD_TYPES.string],
      ['queryFee', FIELD_TYPES.amount],
      ['queryTtlType', FIELD_TYPES.ttlType],
      ['queryTtlValue', FIELD_TYPES.shortInt],
      ['responseTtlType', FIELD_TYPES.ttlType],
      ['responseTtlValue', FIELD_TYPES.shortInt],
      ['fee', FIELD_TYPES.int],
      ['ttl', FIELD_TYPES.shortInt],
    ],
  },
  [TX_TYPE.oracleResponse]: {
    1: [
      ...BASE_TX,
      ['oracleId', FIELD_TYPES.id, 'ok'],
      ['nonce', FIELD_TYPES.shortInt],
      ['queryId', FIELD_TYPES.binary, 'oq'],
      ['response', FIELD_TYPES.string],
      ['responseTtlType', FIELD_TYPES.ttlType],
      ['responseTtlValue', FIELD_TYPES.shortInt],
      ['fee', FIELD_TYPES.int],
      ['ttl', FIELD_TYPES.shortInt],
    ],
  },
  [TX_TYPE.channelCreate]: {
    2: [
      ...BASE_TX,
      ['initiator', FIELD_TYPES.id, 'ak'],
      ['initiatorAmount', FIELD_TYPES.int],
      ['responder', FIELD_TYPES.id, 'ak'],
      ['responderAmount', FIELD_TYPES.int],
      ['channelReserve', FIELD_TYPES.int],
      ['lockPeriod', FIELD_TYPES.int],
      ['ttl', FIELD_TYPES.shortInt],
      ['fee', FIELD_TYPES.int],
      ['initiatorDelegateIds', FIELD_TYPES.string],
      ['responderDelegateIds', FIELD_TYPES.string],
      ['stateHash', FIELD_TYPES.binary, 'st'],
      ['nonce', FIELD_TYPES.shortInt],
    ],
  },
  [TX_TYPE.channelCloseMutual]: {
    1: [
      ...BASE_TX,
      ['channelId', FIELD_TYPES.id, 'ch'],
      ['fromId', FIELD_TYPES.id, 'ak'],
      ['initiatorAmountFinal', FIELD_TYPES.int],
      ['responderAmountFinal', FIELD_TYPES.int],
      ['ttl', FIELD_TYPES.shortInt],
      ['fee', FIELD_TYPES.int],
      ['nonce', FIELD_TYPES.shortInt],
    ],
  },
  [TX_TYPE.channelCloseSolo]: {
    1: [
      ...BASE_TX,
      ['channelId', FIELD_TYPES.id, 'ch'],
      ['fromId', FIELD_TYPES.id, 'ak'],
      ['payload', FIELD_TYPES.binary, 'tx'],
      ['poi', FIELD_TYPES.binary, 'pi'],
      ['ttl', FIELD_TYPES.shortInt],
      ['fee', FIELD_TYPES.int],
      ['nonce', FIELD_TYPES.shortInt],
    ],
  },
  [TX_TYPE.channelSlash]: {
    1: [
      ...BASE_TX,
      ['channelId', FIELD_TYPES.id, 'ch'],
      ['fromId', FIELD_TYPES.id, 'ak'],
      ['payload', FIELD_TYPES.binary, 'tx'],
      ['poi', FIELD_TYPES.binary, 'pi'],
      ['ttl', FIELD_TYPES.shortInt],
      ['fee', FIELD_TYPES.int],
      ['nonce', FIELD_TYPES.shortInt],
    ],
  },
  [TX_TYPE.channelDeposit]: {
    1: [
      ...BASE_TX,
      ['channelId', FIELD_TYPES.id, 'ch'],
      ['fromId', FIELD_TYPES.id, 'ak'],
      ['amount', FIELD_TYPES.int],
      ['ttl', FIELD_TYPES.shortInt],
      ['fee', FIELD_TYPES.int],
      ['stateHash', FIELD_TYPES.binary, 'st'],
      ['round', FIELD_TYPES.int],
      ['nonce', FIELD_TYPES.shortInt],
    ],
  },
  [TX_TYPE.channelWithdraw]: {
    1: [
      ...BASE_TX,
      ['channelId', FIELD_TYPES.id, 'ch'],
      ['toId', FIELD_TYPES.id, 'ak'],
      ['amount', FIELD_TYPES.int],
      ['ttl', FIELD_TYPES.shortInt],
      ['fee', FIELD_TYPES.int],
      ['stateHash', FIELD_TYPES.binary, 'st'],
      ['round', FIELD_TYPES.int],
      ['nonce', FIELD_TYPES.shortInt],
    ],
  },
  [TX_TYPE.channelSettle]: {
    1: [
      ...BASE_TX,
      ['channelId', FIELD_TYPES.id, 'ch'],
      ['fromId', FIELD_TYPES.id, 'ak'],
      ['initiatorAmountFinal', FIELD_TYPES.int],
      ['responderAmountFinal', FIELD_TYPES.int],
      ['ttl', FIELD_TYPES.shortInt],
      ['fee', FIELD_TYPES.int],
      ['nonce', FIELD_TYPES.shortInt],
    ],
  },
  [TX_TYPE.channelForceProgress]: {
    1: [
      ...BASE_TX,
      ['channelId', FIELD_TYPES.id, 'ch'],
      ['fromId', FIELD_TYPES.id, 'ak'],
      ['payload', FIELD_TYPES.binary, 'tx'],
      ['round', FIELD_TYPES.int],
      ['update', FIELD_TYPES.binary, 'cb'],
      ['stateHash', FIELD_TYPES.binary, 'st'],
      ['offChainTrees', FIELD_TYPES.stateTree],
      ['ttl', FIELD_TYPES.shortInt],
      ['fee', FIELD_TYPES.int],
      ['nonce', FIELD_TYPES.shortInt],
    ],
  },
  [TX_TYPE.channelOffChain]: {
    2: [
      ...BASE_TX,
      ['channelId', FIELD_TYPES.id, 'ch'],
      ['round', FIELD_TYPES.int],
      ['stateHash', FIELD_TYPES.binary, 'st'],
    ],
  },
  [TX_TYPE.channel]: {
    3: [
      ...BASE_TX,
      ['initiator', FIELD_TYPES.id, 'ak'],
      ['responder', FIELD_TYPES.id, 'ak'],
      ['channelAmount', FIELD_TYPES.int],
      ['initiatorAmount', FIELD_TYPES.int],
      ['responderAmount', FIELD_TYPES.int],
      ['channelReserve', FIELD_TYPES.int],
      ['initiatorDelegateIds', FIELD_TYPES.ids],
      ['responderDelegateIds', FIELD_TYPES.ids],
      ['stateHash', FIELD_TYPES.hex],
      ['round', FIELD_TYPES.int],
      ['soloRound', FIELD_TYPES.int],
      ['lockPeriod', FIELD_TYPES.int],
      ['lockedUntil', FIELD_TYPES.int],
      ['initiatorAuth', FIELD_TYPES.binary, 'cb'],
      ['responderAuth', FIELD_TYPES.binary, 'cb'],
    ],
  },
  [TX_TYPE.channelSnapshotSolo]: {
    1: [
      ...BASE_TX,
      ['channelId', FIELD_TYPES.id, 'ch'],
      ['fromId', FIELD_TYPES.id, 'ak'],
      ['payload', FIELD_TYPES.binary, 'tx'],
      ['ttl', FIELD_TYPES.shortInt],
      ['fee', FIELD_TYPES.int],
      ['nonce', FIELD_TYPES.shortInt],
    ],
  },
  [TX_TYPE.channelOffChainUpdateTransfer]: {
    1: [
      ...BASE_TX,
      ['from', FIELD_TYPES.id, 'ak'],
      ['to', FIELD_TYPES.id, 'ak'],
      ['amount', FIELD_TYPES.int],
    ],
  },
  [TX_TYPE.channelOffChainUpdateDeposit]: {
    1: [
      ...BASE_TX,
      ['from', FIELD_TYPES.id, 'ak'],
      ['amount', FIELD_TYPES.int],
    ],
  },
  [TX_TYPE.channelOffChainUpdateWithdrawal]: {
    1: [
      ...BASE_TX,
      ['from', FIELD_TYPES.id, 'ak'],
      ['amount', FIELD_TYPES.int],
    ],
  },
  [TX_TYPE.channelOffChainCreateContract]: {
    1: [
      ...BASE_TX,
      ['owner', FIELD_TYPES.id, 'ak'],
      ['ctVersion', FIELD_TYPES.ctVersion],
      ['code', FIELD_TYPES.binary, 'cb'],
      ['deposit', FIELD_TYPES.int],
      ['callData', FIELD_TYPES.binary, 'cb'],
    ],
  },
  [TX_TYPE.channelOffChainCallContract]: {
    1: [
      ...BASE_TX,
      ['caller', FIELD_TYPES.id, 'ak'],
      ['contract', FIELD_TYPES.id, 'ct'],
      ['abiVersion', FIELD_TYPES.abiVersion],
      ['amount', FIELD_TYPES.int],
      ['callData', FIELD_TYPES.binary, 'cb'],
      ['callStack', FIELD_TYPES.callStack],
      ['gasPrice', GasPrice],
      ['gasLimit', FIELD_TYPES.shortInt],
    ],
  },
  [TX_TYPE.channelReconnect]: {
    1: [
      ...BASE_TX,
      ['channelId', FIELD_TYPES.id, 'ch'],
      ['round', FIELD_TYPES.int],
      ['role', FIELD_TYPES.string],
      ['pubkey', FIELD_TYPES.id, 'ak'],
    ],
  },
  [TX_TYPE.proofOfInclusion]: {
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
  [TX_TYPE.stateTrees]: {
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
  [TX_TYPE.merklePatriciaTree]: {
    1: [
      ...BASE_TX,
      ['values', FIELD_TYPES.rlpBinaries],
    ],
  },
  [TX_TYPE.merklePatriciaTreeValue]: {
    1: [
      ...BASE_TX,
      ['key', FIELD_TYPES.hex],
      ['value', FIELD_TYPES.rawBinary],
    ],
  },
  [TX_TYPE.contractsTree]: {
    1: [
      ...BASE_TX,
      ['contracts', FIELD_TYPES.rlpBinary],
    ],
  },
  [TX_TYPE.contractCallsTree]: {
    1: [
      ...BASE_TX,
      ['calls', FIELD_TYPES.rlpBinary],
    ],
  },
  [TX_TYPE.channelsTree]: {
    1: [
      ...BASE_TX,
      ['channels', FIELD_TYPES.rlpBinary],
    ],
  },
  [TX_TYPE.nameserviceTree]: {
    1: [
      ...BASE_TX,
      ['mtree', FIELD_TYPES.rlpBinary],
    ],
  },
  [TX_TYPE.oraclesTree]: {
    1: [
      ...BASE_TX,
      ['otree', FIELD_TYPES.rlpBinary],
    ],
  },
  [TX_TYPE.accountsTree]: {
    1: [
      ...BASE_TX,
      ['accounts', FIELD_TYPES.rlpBinary],
    ],
  },
  [TX_TYPE.gaAttach]: {
    1: [
      ...BASE_TX,
      ['ownerId', FIELD_TYPES.id, 'ak'],
      ['nonce', FIELD_TYPES.shortInt],
      ['code', FIELD_TYPES.binary, 'cb'],
      ['authFun', FIELD_TYPES.rawBinary],
      ['ctVersion', FIELD_TYPES.ctVersion],
      ['fee', FIELD_TYPES.int],
      ['ttl', FIELD_TYPES.shortInt],
      ['gasLimit', FIELD_TYPES.shortInt],
      ['gasPrice', GasPrice],
      ['callData', FIELD_TYPES.binary, 'cb'],
    ],
  },
  [TX_TYPE.gaMeta]: {
    2: [
      ...BASE_TX,
      ['gaId', FIELD_TYPES.id, 'ak'],
      ['authData', FIELD_TYPES.binary, 'cb'],
      ['abiVersion', FIELD_TYPES.abiVersion],
      ['fee', FIELD_TYPES.int],
      ['gasLimit', FIELD_TYPES.shortInt],
      ['gasPrice', GasPrice],
      ['tx', FIELD_TYPES.rlpBinary],
    ],
  },
  [TX_TYPE.payingFor]: {
    1: [
      ...BASE_TX,
      ['payerId', FIELD_TYPES.id, 'ak'],
      ['nonce', FIELD_TYPES.shortInt],
      ['fee', FIELD_TYPES.int],
      ['tx', FIELD_TYPES.rlpBinary],
    ],
  },
  [TX_TYPE.sophiaByteCode]: {
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
  [key in TX_TYPE]: BuildTxArgBySchema<
    typeof TX_SCHEMA[key][keyof typeof TX_SCHEMA[key]]
  >
};

export type TxSchema = TxTypeSchemas[TX_TYPE];
export type TxParamsCommon = Partial<UnionToIntersection<TxSchema>>;
