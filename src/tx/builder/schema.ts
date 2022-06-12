/**
 * Transaction Schema for TxBuilder
 * @module @aeternity/aepp-sdk/es/tx/builder/schema
 * @example import { TX_TYPE } from '@aeternity/aepp-sdk'
 */
// # RLP version number
// # https://github.com/aeternity/protocol/blob/master/serializations.md#binary-serialization

import BigNumber from 'bignumber.js'
import { Name, NameId, NameFee, Deposit, Field, GasPrice } from './field-types'
import { EncodedData, EncodingType } from '../../utils/encoder'
import { Pointer } from './helpers'
import MPTree from '../../utils/mptree'

export * from './constants'

// # TRANSACTION DEFAULT TTL
export const TX_TTL = 0
// # ORACLE
export const QUERY_FEE = 30000
export const ORACLE_TTL = { type: 'delta', value: 500 }
export const QUERY_TTL = { type: 'delta', value: 10 }
export const RESPONSE_TTL = { type: 'delta', value: 10 }
// # CONTRACT
export const AMOUNT = 0
export const GAS_MAX = 1600000 - 21000
export const MAX_AUTH_FUN_GAS = 50000
export const DRY_RUN_ACCOUNT = {
  pub: 'ak_11111111111111111111111111111111273Yts',
  amount: 100000000000000000000000000000000000n
} as const

export type TxField = [
  name: string,
  type: string | typeof Field,
  prefix?: EncodingType | EncodingType[]
]

/**
 * @description Object with transaction types
 * @alias module:@aeternity/aepp-sdk/es/tx/builder/schema
 * @link https://github.com/aeternity/protocol/blob/0f6dee3d9d1e8e2469816798f5c7587a6c918f94/serializations.md#binary-serialization
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
  accountsTree = 626
}

/**
 * @link https://github.com/aeternity/protocol/blob/0f6dee3d9d1e8e2469816798f5c7587a6c918f94/contracts/contract_vms.md#virtual-machines-on-the-%C3%A6ternity-blockchain
 */
export enum VM_VERSIONS {
  NO_VM = 0,
  SOPHIA = 1,
  SOPHIA_IMPROVEMENTS_MINERVA = 3,
  SOPHIA_IMPROVEMENTS_FORTUNA = 4,
  FATE = 5,
  SOPHIA_IMPROVEMENTS_LIMA = 6,
  FATE_2 = 7
}

/**
 * @link https://github.com/aeternity/protocol/blob/0f6dee3d9d1e8e2469816798f5c7587a6c918f94/contracts/contract_vms.md#virtual-machines-on-the-%C3%A6ternity-blockchain
 */
export enum ABI_VERSIONS {
  NO_ABI = 0,
  SOPHIA = 1,
  FATE = 3
}

export enum PROTOCOL_VERSIONS {
  IRIS = 5
}

// First abi/vm by default
export const PROTOCOL_VM_ABI = {
  [PROTOCOL_VERSIONS.IRIS]: {
    [TX_TYPE.contractCreate]: {
      vmVersion: [VM_VERSIONS.FATE_2], abiVersion: [ABI_VERSIONS.FATE]
    },
    // TODO: Ensure that AEVM (SOPHIA?) is still available here
    [TX_TYPE.contractCall]: {
      vmVersion: [], abiVersion: [ABI_VERSIONS.FATE, ABI_VERSIONS.SOPHIA]
    },
    [TX_TYPE.oracleRegister]: {
      vmVersion: [], abiVersion: [ABI_VERSIONS.NO_ABI, ABI_VERSIONS.SOPHIA]
    }
  }
} as const

type PrefixType<Prefix> = Prefix extends EncodingType
  ? EncodedData<Prefix>
  : Prefix extends readonly EncodingType[]
    ? EncodedData<Prefix[number]>
    : EncodedData<any>

export interface CtVersion {
  vmVersion: VM_VERSIONS
  abiVersion: ABI_VERSIONS
}

interface BuildFieldTypes<Prefix extends EncodingType | readonly EncodingType[]>{
  int: number | string | BigNumber
  amount: number | string | BigNumber
  id: PrefixType<Prefix>
  ids: Array<EncodedData<Prefix extends EncodingType[]? Prefix : any>>
  string: string
  binary: PrefixType<Prefix>
  bool: Boolean
  hex: string
  rlpBinary: any
  rlpBinaries: any[]
  rawBinary: string
  signatures: Uint8Array[]
  pointers: Pointer[]
  offChainUpdates: any
  callStack: any
  proofOfInclusion: any
  mptrees: MPTree[]
  callReturnType: any
  ctVersion: CtVersion
  abiVersion: ABI_VERSIONS
  payload: string
}

export const FIELD_TYPES = {
  int: 'int',
  amount: 'amount',
  id: 'id',
  ids: 'ids',
  string: 'string',
  binary: 'binary',
  rlpBinary: 'rlpBinary',
  rlpBinaries: 'rlpBinaries',
  rawBinary: 'rawBinary',
  bool: 'bool',
  hex: 'hex',
  signatures: 'signatures',
  pointers: 'pointers',
  offChainUpdates: 'offChainUpdates',
  callStack: 'callStack',
  proofOfInclusion: 'proofOfInclusion',
  mptrees: 'mptrees',
  callReturnType: 'callReturnType',
  ctVersion: 'ctVersion',
  abiVersion: 'abiVersion',
  sophiaCodeTypeInfo: 'sophiaCodeTypeInfo',
  payload: 'payload',
  any: 'any',
  stateTree: 'stateTree'
} as const

// FEE CALCULATION
export const BASE_GAS = 15000
export const GAS_PER_BYTE = 20
export const DEFAULT_FEE = 20000
export const KEY_BLOCK_INTERVAL = 3

/**
 * Calculate the Base fee gas
 * @see {@link https://github.com/aeternity/protocol/blob/master/consensus/README.md#gas}
 * @param txType - The transaction type
 * @returns The base fee
 * @example TX_FEE_BASE('channelForceProgress') => new BigNumber(30 * 15000)
 */
export const TX_FEE_BASE_GAS = (txType: TX_TYPE): BigNumber => {
  const feeFactors = {
    [TX_TYPE.channelForceProgress]: 30,
    [TX_TYPE.channelOffChain]: 0,
    [TX_TYPE.channelOffChainCallContract]: 0,
    [TX_TYPE.channelOffChainCreateContract]: 0,
    [TX_TYPE.channelOffChainUpdateDeposit]: 0,
    [TX_TYPE.channelOffChainUpdateWithdrawal]: 0,
    [TX_TYPE.channelOffChainUpdateTransfer]: 0,
    [TX_TYPE.contractCreate]: 5,
    [TX_TYPE.contractCall]: 12,
    [TX_TYPE.gaAttach]: 5,
    [TX_TYPE.gaMeta]: 5,
    [TX_TYPE.payingFor]: 1 / 5
  } as const
  const factor = feeFactors[txType as keyof typeof feeFactors] ?? 1
  return new BigNumber(factor * BASE_GAS)
}

/**
 * Calculate fee for Other types of transactions
 * @see {@link https://github.com/aeternity/protocol/blob/master/consensus/README.md#gas}
 * @param txType - The transaction type
 * @param txSize - The transaction size
 * @returns parameters - The transaction parameters
 * @returns parameters.relativeTtl - The relative ttl
 * @returns parameters.innerTxSize - The size of the inner transaction
 * @returns The Other fee
 * @example TX_FEE_OTHER_GAS('oracleResponse',10, {relativeTtl:10, innerTxSize:10 })
 *  => new BigNumber(10).times(20).plus(Math.ceil(32000 * 10 / Math.floor(60 * 24 * 365 / 2)))
 */
export const TX_FEE_OTHER_GAS = (
  txType: TX_TYPE,
  txSize: number,
  { relativeTtl, innerTxSize }: { relativeTtl: number, innerTxSize: number }
): BigNumber => {
  switch (txType) {
    case TX_TYPE.oracleRegister:
    case TX_TYPE.oracleExtend:
    case TX_TYPE.oracleQuery:
    case TX_TYPE.oracleResponse:
      return new BigNumber(txSize)
        .times(GAS_PER_BYTE)
        .plus(
          Math.ceil(32000 * relativeTtl / Math.floor(60 * 24 * 365 / KEY_BLOCK_INTERVAL))
        )
    case TX_TYPE.gaMeta:
    case TX_TYPE.payingFor:
      return new BigNumber(txSize).minus(innerTxSize).times(GAS_PER_BYTE)
    default:
      return new BigNumber(txSize).times(GAS_PER_BYTE)
  }
}

// based on https://stackoverflow.com/a/50375286/6176994
type UnionToIntersection<Union> =
  (Union extends any ? (k: Union) => void : never) extends ((k: infer Intersection) => void)
    ? Intersection : never

type TxElem = readonly [string, string | Field]
| readonly [string, string | Field, EncodingType | readonly EncodingType[]]

type BuildTxArgBySchemaType<Schema extends readonly any[]> =
  Schema[1] extends typeof Field
    ? Parameters<Schema[1]['serialize']>[0]
    : Schema[1] extends keyof BuildFieldTypes<Schema[2]>
      ? BuildFieldTypes<Schema[2]>[Schema[1]]
      : never

type BuildTxArgBySchema<SchemaLine> =
  UnionToIntersection<
  SchemaLine extends ReadonlyArray<infer Elem>
    ? Elem extends TxElem ? {
      [k in Elem[0]]: BuildTxArgBySchemaType<Elem> } : never
    : never
  >

export type RawTxObject<Tx extends TxSchema> = {
  [k in keyof Tx]: Tx[k] extends number | BigNumber ? string: Tx[k]
}

const BASE_TX = [
  ['tag', FIELD_TYPES.int],
  ['VSN', FIELD_TYPES.int]
] as const

export const TX_SCHEMA = {
  [TX_TYPE.account]: {
    2: [
      ...BASE_TX,
      ['flags', FIELD_TYPES.int],
      ['nonce', FIELD_TYPES.int],
      ['balance', FIELD_TYPES.int],
      ['gaContract', FIELD_TYPES.id, ['ct', 'nm']],
      ['gaAuthFun', FIELD_TYPES.binary, 'cb']
    ]
  },
  [TX_TYPE.signed]: {
    1: [
      ...BASE_TX,
      ['signatures', FIELD_TYPES.signatures],
      ['encodedTx', FIELD_TYPES.rlpBinary]
    ]
  },
  [TX_TYPE.spend]: {
    1: [
      ...BASE_TX,
      ['senderId', FIELD_TYPES.id, 'ak'],
      ['recipientId', FIELD_TYPES.id, ['ak', 'nm']],
      ['amount', FIELD_TYPES.amount],
      ['fee', FIELD_TYPES.int],
      ['ttl', FIELD_TYPES.int],
      ['nonce', FIELD_TYPES.int],
      ['payload', FIELD_TYPES.payload]
    ]
  },
  [TX_TYPE.namePreClaim]: {
    1: [
      ...BASE_TX,
      ['accountId', FIELD_TYPES.id, 'ak'],
      ['nonce', FIELD_TYPES.int],
      ['commitmentId', FIELD_TYPES.id, 'cm'],
      ['fee', FIELD_TYPES.int],
      ['ttl', FIELD_TYPES.int]
    ]
  },
  [TX_TYPE.nameClaim]: {
    2: [
      ...BASE_TX,
      ['accountId', FIELD_TYPES.id, 'ak'],
      ['nonce', FIELD_TYPES.int],
      ['name', Name],
      ['nameSalt', FIELD_TYPES.int],
      ['nameFee', NameFee],
      ['fee', FIELD_TYPES.int],
      ['ttl', FIELD_TYPES.int]
    ]
  },
  [TX_TYPE.nameUpdate]: {
    1: [
      ...BASE_TX,
      ['accountId', FIELD_TYPES.id, 'ak'],
      ['nonce', FIELD_TYPES.int],
      ['nameId', NameId],
      ['nameTtl', FIELD_TYPES.int],
      ['pointers', FIELD_TYPES.pointers],
      ['clientTtl', FIELD_TYPES.int],
      ['fee', FIELD_TYPES.int],
      ['ttl', FIELD_TYPES.int]
    ]
  },
  [TX_TYPE.nameTransfer]: {
    1: [
      ...BASE_TX,
      ['accountId', FIELD_TYPES.id, 'ak'],
      ['nonce', FIELD_TYPES.int],
      ['nameId', NameId],
      ['recipientId', FIELD_TYPES.id, ['ak', 'nm']],
      ['fee', FIELD_TYPES.int],
      ['ttl', FIELD_TYPES.int]
    ]
  },
  [TX_TYPE.nameRevoke]: {
    1: [
      ...BASE_TX,
      ['accountId', FIELD_TYPES.id, 'ak'],
      ['nonce', FIELD_TYPES.int],
      ['nameId', NameId],
      ['fee', FIELD_TYPES.int],
      ['ttl', FIELD_TYPES.int]
    ]
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
      ['deposit', Deposit]
    ]
  },
  [TX_TYPE.contractCreate]: {
    1: [
      ...BASE_TX,
      ['ownerId', FIELD_TYPES.id, 'ak'],
      ['nonce', FIELD_TYPES.int],
      ['code', FIELD_TYPES.binary, 'cb'],
      ['ctVersion', FIELD_TYPES.ctVersion],
      ['fee', FIELD_TYPES.int],
      ['ttl', FIELD_TYPES.int],
      ['deposit', Deposit],
      ['amount', FIELD_TYPES.amount],
      ['gasLimit', FIELD_TYPES.int],
      ['gasPrice', GasPrice],
      ['callData', FIELD_TYPES.binary, 'cb']
    ]
  },
  [TX_TYPE.contractCall]: {
    1: [
      ...BASE_TX,
      ['callerId', FIELD_TYPES.id, 'ak'],
      ['nonce', FIELD_TYPES.int],
      ['contractId', FIELD_TYPES.id, ['ct', 'nm']],
      ['abiVersion', FIELD_TYPES.abiVersion],
      ['fee', FIELD_TYPES.int],
      ['ttl', FIELD_TYPES.int],
      ['amount', FIELD_TYPES.amount],
      ['gasLimit', FIELD_TYPES.int],
      ['gasPrice', GasPrice],
      ['callData', FIELD_TYPES.binary, 'cb']
    ]
  },
  [TX_TYPE.contractCallResult]: {
    1: [
      ...BASE_TX,
      ['callerId', FIELD_TYPES.id, 'ak'],
      ['callerNonce', FIELD_TYPES.int],
      ['height', FIELD_TYPES.int],
      ['contractId', FIELD_TYPES.id, 'ct'],
      ['gasPrice', GasPrice],
      ['gasUsed', FIELD_TYPES.int],
      ['returnValue', FIELD_TYPES.binary, 'cb'],
      ['returnType', FIELD_TYPES.callReturnType],
      // TODO: add serialization for
      //  <log> :: [ { <address> :: id, [ <topics> :: binary() ], <data> :: binary() } ]
      ['log', FIELD_TYPES.rawBinary]
    ]
  },
  [TX_TYPE.oracleRegister]: {
    1: [
      ...BASE_TX,
      ['accountId', FIELD_TYPES.id, 'ak'],
      ['nonce', FIELD_TYPES.int],
      ['queryFormat', FIELD_TYPES.string],
      ['responseFormat', FIELD_TYPES.string],
      ['queryFee', FIELD_TYPES.amount],
      ['oracleTtlType', FIELD_TYPES.int],
      ['oracleTtlValue', FIELD_TYPES.int],
      ['fee', FIELD_TYPES.int],
      ['ttl', FIELD_TYPES.int],
      ['abiVersion', FIELD_TYPES.abiVersion]
    ]
  },
  [TX_TYPE.oracleExtend]: {
    1: [
      ...BASE_TX,
      ['oracleId', FIELD_TYPES.id, ['ok', 'nm']],
      ['nonce', FIELD_TYPES.int],
      ['oracleTtlType', FIELD_TYPES.int],
      ['oracleTtlValue', FIELD_TYPES.int],
      ['fee', FIELD_TYPES.int],
      ['ttl', FIELD_TYPES.int]
    ]
  },
  [TX_TYPE.oracleQuery]: {
    1: [
      ...BASE_TX,
      ['senderId', FIELD_TYPES.id, 'ak'],
      ['nonce', FIELD_TYPES.int],
      ['oracleId', FIELD_TYPES.id, ['ok', 'nm']],
      ['query', FIELD_TYPES.string],
      ['queryFee', FIELD_TYPES.amount],
      ['queryTtlType', FIELD_TYPES.int],
      ['queryTtlValue', FIELD_TYPES.int],
      ['responseTtlType', FIELD_TYPES.int],
      ['responseTtlValue', FIELD_TYPES.int],
      ['fee', FIELD_TYPES.int],
      ['ttl', FIELD_TYPES.int]
    ]
  },
  [TX_TYPE.oracleResponse]: {
    1: [
      ...BASE_TX,
      ['oracleId', FIELD_TYPES.id, 'ok'],
      ['nonce', FIELD_TYPES.int],
      ['queryId', FIELD_TYPES.binary, 'oq'],
      ['response', FIELD_TYPES.string],
      ['responseTtlType', FIELD_TYPES.int],
      ['responseTtlValue', FIELD_TYPES.int],
      ['fee', FIELD_TYPES.int],
      ['ttl', FIELD_TYPES.int]
    ]
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
      ['ttl', FIELD_TYPES.int],
      ['fee', FIELD_TYPES.int],
      ['initiatorDelegateIds', FIELD_TYPES.string],
      ['responderDelegateIds', FIELD_TYPES.string],
      ['stateHash', FIELD_TYPES.binary, 'st'],
      ['nonce', FIELD_TYPES.int]
    ]
  },
  [TX_TYPE.channelCloseMutual]: {
    1: [
      ...BASE_TX,
      ['channelId', FIELD_TYPES.id, 'ch'],
      ['fromId', FIELD_TYPES.id, 'ak'],
      ['initiatorAmountFinal', FIELD_TYPES.int],
      ['responderAmountFinal', FIELD_TYPES.int],
      ['ttl', FIELD_TYPES.int],
      ['fee', FIELD_TYPES.int],
      ['nonce', FIELD_TYPES.int]
    ]
  },
  [TX_TYPE.channelCloseSolo]: {
    1: [
      ...BASE_TX,
      ['channelId', FIELD_TYPES.id, 'ch'],
      ['fromId', FIELD_TYPES.id, 'ak'],
      ['payload', FIELD_TYPES.binary, 'tx'],
      ['poi', FIELD_TYPES.binary, 'pi'],
      ['ttl', FIELD_TYPES.int],
      ['fee', FIELD_TYPES.int],
      ['nonce', FIELD_TYPES.int]
    ]
  },
  [TX_TYPE.channelSlash]: {
    1: [
      ...BASE_TX,
      ['channelId', FIELD_TYPES.id, 'ch'],
      ['fromId', FIELD_TYPES.id, 'ak'],
      ['payload', FIELD_TYPES.binary, 'tx'],
      ['poi', FIELD_TYPES.binary, 'pi'],
      ['ttl', FIELD_TYPES.int],
      ['fee', FIELD_TYPES.int],
      ['nonce', FIELD_TYPES.int]
    ]
  },
  [TX_TYPE.channelDeposit]: {
    1: [
      ...BASE_TX,
      ['channelId', FIELD_TYPES.id, 'ch'],
      ['fromId', FIELD_TYPES.id, 'ak'],
      ['amount', FIELD_TYPES.int],
      ['ttl', FIELD_TYPES.int],
      ['fee', FIELD_TYPES.int],
      ['stateHash', FIELD_TYPES.binary, 'st'],
      ['round', FIELD_TYPES.int],
      ['nonce', FIELD_TYPES.int]
    ]
  },
  [TX_TYPE.channelWithdraw]: {
    1: [
      ...BASE_TX,
      ['channelId', FIELD_TYPES.id, 'ch'],
      ['toId', FIELD_TYPES.id, 'ak'],
      ['amount', FIELD_TYPES.int],
      ['ttl', FIELD_TYPES.int],
      ['fee', FIELD_TYPES.int],
      ['stateHash', FIELD_TYPES.binary, 'st'],
      ['round', FIELD_TYPES.int],
      ['nonce', FIELD_TYPES.int]
    ]
  },
  [TX_TYPE.channelSettle]: {
    1: [
      ...BASE_TX,
      ['channelId', FIELD_TYPES.id, 'ch'],
      ['fromId', FIELD_TYPES.id, 'ak'],
      ['initiatorAmountFinal', FIELD_TYPES.int],
      ['responderAmountFinal', FIELD_TYPES.int],
      ['ttl', FIELD_TYPES.int],
      ['fee', FIELD_TYPES.int],
      ['nonce', FIELD_TYPES.int]
    ]
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
      ['ttl', FIELD_TYPES.int],
      ['fee', FIELD_TYPES.int],
      ['nonce', FIELD_TYPES.int]
    ]
  },
  [TX_TYPE.channelOffChain]: {
    2: [
      ...BASE_TX,
      ['channelId', FIELD_TYPES.id, 'ch'],
      ['round', FIELD_TYPES.int],
      ['stateHash', FIELD_TYPES.binary, 'st']
    ]
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
      ['responderAuth', FIELD_TYPES.binary, 'cb']
    ]
  },
  [TX_TYPE.channelSnapshotSolo]: {
    1: [
      ...BASE_TX,
      ['channelId', FIELD_TYPES.id, 'ch'],
      ['fromId', FIELD_TYPES.id, 'ak'],
      ['payload', FIELD_TYPES.binary, 'tx'],
      ['ttl', FIELD_TYPES.int],
      ['fee', FIELD_TYPES.int],
      ['nonce', FIELD_TYPES.int]
    ]
  },
  [TX_TYPE.channelOffChainUpdateTransfer]: {
    1: [
      ...BASE_TX,
      ['from', FIELD_TYPES.id, 'ak'],
      ['to', FIELD_TYPES.id, 'ak'],
      ['amount', FIELD_TYPES.int]
    ]
  },
  [TX_TYPE.channelOffChainUpdateDeposit]: {
    1: [
      ...BASE_TX,
      ['from', FIELD_TYPES.id, 'ak'],
      ['amount', FIELD_TYPES.int]
    ]
  },
  [TX_TYPE.channelOffChainUpdateWithdrawal]: {
    1: [
      ...BASE_TX,
      ['from', FIELD_TYPES.id, 'ak'],
      ['amount', FIELD_TYPES.int]
    ]
  },
  [TX_TYPE.channelOffChainCreateContract]: {
    1: [
      ...BASE_TX,
      ['owner', FIELD_TYPES.id, 'ak'],
      ['ctVersion', FIELD_TYPES.ctVersion],
      ['code', FIELD_TYPES.binary, 'cb'],
      ['deposit', FIELD_TYPES.int],
      ['callData', FIELD_TYPES.binary, 'cb']
    ]
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
      ['gasLimit', FIELD_TYPES.int]
    ]
  },
  [TX_TYPE.channelReconnect]: {
    1: [
      ...BASE_TX,
      ['channelId', FIELD_TYPES.id, 'ch'],
      ['round', FIELD_TYPES.int],
      ['role', FIELD_TYPES.string],
      ['pubkey', FIELD_TYPES.id, 'ak']
    ]
  },
  [TX_TYPE.proofOfInclusion]: {
    1: [
      ...BASE_TX,
      ['accounts', FIELD_TYPES.mptrees],
      ['calls', FIELD_TYPES.mptrees],
      ['channels', FIELD_TYPES.mptrees],
      ['contracts', FIELD_TYPES.mptrees],
      ['ns', FIELD_TYPES.mptrees],
      ['oracles', FIELD_TYPES.mptrees]
    ]
  },
  [TX_TYPE.stateTrees]: {
    1: [
      ...BASE_TX,
      ['contracts', FIELD_TYPES.rlpBinary],
      ['calls', FIELD_TYPES.rlpBinary],
      ['channels', FIELD_TYPES.rlpBinary],
      ['ns', FIELD_TYPES.rlpBinary],
      ['oracles', FIELD_TYPES.rlpBinary],
      ['accounts', FIELD_TYPES.rlpBinary]
    ]
  },
  [TX_TYPE.merklePatriciaTree]: {
    1: [
      ...BASE_TX,
      ['values', FIELD_TYPES.rlpBinaries]
    ]
  },
  [TX_TYPE.merklePatriciaTreeValue]: {
    1: [
      ...BASE_TX,
      ['key', FIELD_TYPES.hex],
      ['value', FIELD_TYPES.rawBinary]
    ]
  },
  [TX_TYPE.contractsTree]: {
    1: [
      ...BASE_TX,
      ['contracts', FIELD_TYPES.rlpBinary]
    ]
  },
  [TX_TYPE.contractCallsTree]: {
    1: [
      ...BASE_TX,
      ['calls', FIELD_TYPES.rlpBinary]
    ]
  },
  [TX_TYPE.channelsTree]: {
    1: [
      ...BASE_TX,
      ['channels', FIELD_TYPES.rlpBinary]
    ]
  },
  [TX_TYPE.nameserviceTree]: {
    1: [
      ...BASE_TX,
      ['mtree', FIELD_TYPES.rlpBinary]
    ]
  },
  [TX_TYPE.oraclesTree]: {
    1: [
      ...BASE_TX,
      ['otree', FIELD_TYPES.rlpBinary]
    ]
  },
  [TX_TYPE.accountsTree]: {
    1: [
      ...BASE_TX,
      ['accounts', FIELD_TYPES.rlpBinary]
    ]
  },
  [TX_TYPE.gaAttach]: {
    1: [
      ...BASE_TX,
      ['ownerId', FIELD_TYPES.id, 'ak'],
      ['nonce', FIELD_TYPES.int],
      ['code', FIELD_TYPES.binary, 'cb'],
      ['authFun', FIELD_TYPES.rawBinary],
      ['ctVersion', FIELD_TYPES.ctVersion],
      ['fee', FIELD_TYPES.int],
      ['ttl', FIELD_TYPES.int],
      ['gasLimit', FIELD_TYPES.int],
      ['gasPrice', GasPrice],
      ['callData', FIELD_TYPES.binary, 'cb']
    ]
  },
  [TX_TYPE.gaMeta]: {
    2: [
      ...BASE_TX,
      ['gaId', FIELD_TYPES.id, 'ak'],
      ['authData', FIELD_TYPES.binary, 'cb'],
      ['abiVersion', FIELD_TYPES.abiVersion],
      ['fee', FIELD_TYPES.int],
      ['gasLimit', FIELD_TYPES.int],
      ['gasPrice', GasPrice],
      ['tx', FIELD_TYPES.rlpBinary]
    ]
  },
  [TX_TYPE.payingFor]: {
    1: [
      ...BASE_TX,
      ['payerId', FIELD_TYPES.id, 'ak'],
      ['nonce', FIELD_TYPES.int],
      ['fee', FIELD_TYPES.int],
      ['tx', FIELD_TYPES.rlpBinary]
    ]
  },
  [TX_TYPE.sophiaByteCode]: {
    3: [
      ...BASE_TX,
      ['sourceCodeHash', FIELD_TYPES.rawBinary],
      ['typeInfo', FIELD_TYPES.sophiaCodeTypeInfo],
      ['byteCode', FIELD_TYPES.rawBinary],
      ['compilerVersion', FIELD_TYPES.string],
      ['payable', FIELD_TYPES.bool]
    ]
  }
} as const

export type TxTypeSchemas = {
  [key in TX_TYPE]: BuildTxArgBySchema<
    typeof TX_SCHEMA[key][keyof typeof TX_SCHEMA[key]]
  >
}

interface TtlObject{
  type: string
  value: number
}

export type TxSchema = TxTypeSchemas[keyof TxTypeSchemas]
export type TxParamsCommon = Partial<UnionToIntersection<TxSchema> & {
  oracleTtl: TtlObject
  queryTtl: TtlObject
}>
