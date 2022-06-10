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
import { VmVersion } from '..'

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

// # OBJECT tags
// # see https://github.com/aeternity/protocol/blob/master/serializations.md#binary-serialization
const OBJECT_TAG_ACCOUNT = 10
export const OBJECT_TAG_SIGNED_TRANSACTION = 11
const OBJECT_TAG_SPEND_TRANSACTION = 12
const OBJECT_TAG_ORACLE_REGISTER_TRANSACTION = 22
const OBJECT_TAG_ORACLE_QUERY_TRANSACTION = 23
const OBJECT_TAG_ORACLE_RESPONSE_TRANSACTION = 24
const OBJECT_TAG_ORACLE_EXTEND_TRANSACTION = 25
const OBJECT_TAG_NAME_SERVICE_CLAIM_TRANSACTION = 32
const OBJECT_TAG_NAME_SERVICE_PRECLAIM_TRANSACTION = 33
const OBJECT_TAG_NAME_SERVICE_UPDATE_TRANSACTION = 34
const OBJECT_TAG_NAME_SERVICE_REVOKE_TRANSACTION = 35
const OBJECT_TAG_NAME_SERVICE_TRANSFER_TRANSACTION = 36
const OBJECT_TAG_CONTRACT = 40
const OBJECT_TAG_CONTRACT_CALL = 41
const OBJECT_TAG_CONTRACT_CREATE_TRANSACTION = 42
const OBJECT_TAG_CONTRACT_CALL_TRANSACTION = 43
const OBJECT_TAG_CHANNEL_CREATE_TX = 50
const OBJECT_TAG_CHANNEL_DEPOSIT_TX = 51
const OBJECT_TAG_CHANNEL_WITHRAW_TX = 52
const OBJECT_TAG_CHANNEL_CLOSE_MUTUAL_TX = 53
const OBJECT_TAG_CHANNEL_CLOSE_SOLO_TX = 54
const OBJECT_TAG_CHANNEL_SLASH_TX = 55
const OBJECT_TAG_CHANNEL_SETTLE_TX = 56
const OBJECT_TAG_CHANNEL_FORCE_PROGRESS_TX = 521
const OBJECT_TAG_CHANNEL_OFFCHAIN_TX = 57
const OBJECT_TAG_CHANNEL = 58
const OBJECT_TAG_CHANNEL_SNAPSHOT_SOLO_TX = 59
const OBJECT_TAG_CHANNEL_OFFCHAIN_UPDATE_TRANSFER_TX = 570
const OBJECT_TAG_CHANNEL_OFFCHAIN_UPDATE_DEPOSIT_TX = 571
const OBJECT_TAG_CHANNEL_OFFCHAIN_UPDATE_WITHDRAWAL_TX = 572
const OBJECT_TAG_CHANNEL_OFFCHAIN_CREATE_CONTRACT_TX = 573
const OBJECT_TAG_CHANNEL_OFFCHAIN_CALL_CONTRACT_TX = 574
const OBJECT_TAG_CHANNEL_RECONNECT_TX = 575
const OBJECT_TAG_PROOF_OF_INCLUSION = 60
const OBJECT_TAG_STATE_TREES = 62
const OBJECT_TAG_MERKLE_PATRICIA_TREE = 63
const OBJECT_TAG_MERKLE_PATRICIA_TREE_VALUE = 64
const OBJECT_TAG_CONTRACTS_TREE = 621
const OBJECT_TAG_CONTRACT_CALLS_TREE = 622
const OBJECT_TAG_CHANNELS_TREE = 623
const OBJECT_TAG_NAMESERVICE_TREE = 624
const OBJECT_TAG_ORACLES_TREE = 625
const OBJECT_TAG_ACCOUNTS_TREE = 626
const OBJECT_TAG_GA_ATTACH = 80
const OBJECT_TAG_GA_META = 81
const OBJECT_TAG_PAYING_FOR = 82
const OBJECT_TAG_SOPHIA_BYTE_CODE = 70

export type TxField = [
  name: string,
  type: string | typeof Field,
  prefix?: EncodingType | EncodingType[]
]

/**
 * @description Object with transaction types
 * @alias module:@aeternity/aepp-sdk/es/tx/builder/schema
 */
export const TX_TYPE = {
  account: 'account',
  signed: 'signedTx',
  spend: 'spendTx',
  // AENS
  nameClaim: 'nameClaimTx',
  namePreClaim: 'namePreClaimTx',
  nameUpdate: 'nameUpdateTx',
  nameRevoke: 'nameRevokeTx',
  nameTransfer: 'nameTransfer',
  // CONTRACT
  contract: 'contract',
  contractCreate: 'contractCreateTx',
  contractCall: 'contractCallTx',
  contractCallResult: 'contractCallResult',
  // ORACLE
  oracleRegister: 'oracleRegister',
  oracleExtend: 'oracleExtend',
  oracleQuery: 'oracleQuery',
  oracleResponse: 'oracleResponse',
  // STATE CHANNEL
  channelCreate: 'channelCreate',
  channelCloseMutual: 'channelCloseMutual',
  channelCloseSolo: 'channelCloseSolo',
  channelSlash: 'channelSlash',
  channelDeposit: 'channelDeposit',
  channelWithdraw: 'channelWithdraw',
  channelSettle: 'channelSettle',
  channelOffChain: 'channelOffChain',
  channelForceProgress: 'channelForceProgress',
  channel: 'channel',
  channelSnapshotSolo: 'channelSnapshotSolo',
  channelOffChainUpdateTransfer: 'channelOffChainUpdateTransfer',
  channelOffChainUpdateDeposit: 'channelOffChainUpdateDeposit',
  channelOffChainUpdateWithdrawal: 'channelOffChainUpdateWithdrawal',
  channelOffChainCreateContract: 'channelOffChainCreateContract',
  channelOffChainCallContract: 'channelOffChainCallContract',
  channelReconnect: 'channelReconnect',
  proofOfInclusion: 'proofOfInclusion',
  stateTrees: 'stateTrees',
  merklePatriciaTree: 'merklePatriciaTree',
  merklePatriciaTreeValue: 'merklePatriciaTreeValue',
  contractsTree: 'contractsTree',
  contractCallsTree: 'contractCallsTree',
  channelsTree: 'channelsTree',
  nameserviceTree: 'nameserviceTree',
  oraclesTree: 'oraclesTree',
  accountsTree: 'accountsTree',
  gaAttach: 'gaAttach',
  gaMeta: 'gaMeta',
  payingFor: 'payingFor',
  sophiaByteCode: 'sophiaByteCode'
} as const

// # see https://github.com/aeternity/protocol/blob/minerva/contracts/contract_vms.md#virtual-machines-on-the-%C3%A6ternity-blockchain
export const VM_VERSIONS = {
  NO_VM: 0,
  SOPHIA: 1,
  SOPHIA_IMPROVEMENTS_MINERVA: 3,
  SOPHIA_IMPROVEMENTS_FORTUNA: 4,
  FATE: 5,
  SOPHIA_IMPROVEMENTS_LIMA: 6,
  FATE_2: 7
} as const
// # see https://github.com/aeternity/protocol/blob/minerva/contracts/contract_vms.md#virtual-machines-on-the-%C3%A6ternity-blockchain
export const ABI_VERSIONS = {
  NO_ABI: 0,
  SOPHIA: 1,
  FATE: 3
} as const

export const PROTOCOL_VERSIONS = {
  IRIS: 5
} as const

// First abi/vm by default
export const PROTOCOL_VM_ABI = {
  [PROTOCOL_VERSIONS.IRIS]: {
    [TX_TYPE.contractCreate]: {
      vmVersion: [VM_VERSIONS.FATE_2], abiVersion: [ABI_VERSIONS.FATE]
    },
    // TODO: Ensure that AEVM is still available here
    [TX_TYPE.contractCall]: {
      vmVersion: [
        VM_VERSIONS.FATE_2,
        VM_VERSIONS.FATE,
        VM_VERSIONS.SOPHIA_IMPROVEMENTS_LIMA,
        VM_VERSIONS.SOPHIA_IMPROVEMENTS_FORTUNA,
        VM_VERSIONS.SOPHIA,
        VM_VERSIONS.SOPHIA_IMPROVEMENTS_MINERVA
      ],
      abiVersion: [ABI_VERSIONS.FATE, ABI_VERSIONS.SOPHIA]
    },
    [TX_TYPE.oracleRegister]: {
      vmVersion: [], abiVersion: [ABI_VERSIONS.NO_ABI, ABI_VERSIONS.SOPHIA]
    }
  }
} as const

export const OBJECT_ID_TX_TYPE = {
  [OBJECT_TAG_ACCOUNT]: TX_TYPE.account,
  [OBJECT_TAG_SIGNED_TRANSACTION]: TX_TYPE.signed,
  [OBJECT_TAG_SPEND_TRANSACTION]: TX_TYPE.spend,
  // AENS
  [OBJECT_TAG_NAME_SERVICE_CLAIM_TRANSACTION]: TX_TYPE.nameClaim,
  [OBJECT_TAG_NAME_SERVICE_PRECLAIM_TRANSACTION]: TX_TYPE.namePreClaim,
  [OBJECT_TAG_NAME_SERVICE_UPDATE_TRANSACTION]: TX_TYPE.nameUpdate,
  [OBJECT_TAG_NAME_SERVICE_REVOKE_TRANSACTION]: TX_TYPE.nameRevoke,
  [OBJECT_TAG_NAME_SERVICE_TRANSFER_TRANSACTION]: TX_TYPE.nameTransfer,
  // CONTRACT
  [OBJECT_TAG_CONTRACT]: TX_TYPE.contract,
  [OBJECT_TAG_CONTRACT_CREATE_TRANSACTION]: TX_TYPE.contractCreate,
  [OBJECT_TAG_CONTRACT_CALL_TRANSACTION]: TX_TYPE.contractCall,
  [OBJECT_TAG_CONTRACT_CALL]: TX_TYPE.contractCallResult,
  // ORACLE
  [OBJECT_TAG_ORACLE_REGISTER_TRANSACTION]: TX_TYPE.oracleRegister,
  [OBJECT_TAG_ORACLE_EXTEND_TRANSACTION]: TX_TYPE.oracleExtend,
  [OBJECT_TAG_ORACLE_QUERY_TRANSACTION]: TX_TYPE.oracleQuery,
  [OBJECT_TAG_ORACLE_RESPONSE_TRANSACTION]: TX_TYPE.oracleResponse,
  // STATE CHANNEL
  [OBJECT_TAG_CHANNEL_CREATE_TX]: TX_TYPE.channelCreate,
  [OBJECT_TAG_CHANNEL_CLOSE_MUTUAL_TX]: TX_TYPE.channelCloseMutual,
  [OBJECT_TAG_CHANNEL_CLOSE_SOLO_TX]: TX_TYPE.channelCloseSolo,
  [OBJECT_TAG_CHANNEL_SLASH_TX]: TX_TYPE.channelSlash,
  [OBJECT_TAG_CHANNEL_FORCE_PROGRESS_TX]: TX_TYPE.channelForceProgress,
  [OBJECT_TAG_CHANNEL_DEPOSIT_TX]: TX_TYPE.channelDeposit,
  [OBJECT_TAG_CHANNEL_WITHRAW_TX]: TX_TYPE.channelWithdraw,
  [OBJECT_TAG_CHANNEL_SETTLE_TX]: TX_TYPE.channelSettle,
  [OBJECT_TAG_CHANNEL_OFFCHAIN_TX]: TX_TYPE.channelOffChain,
  [OBJECT_TAG_CHANNEL]: TX_TYPE.channel,
  [OBJECT_TAG_CHANNEL_SNAPSHOT_SOLO_TX]: TX_TYPE.channelSnapshotSolo,
  [OBJECT_TAG_CHANNEL_OFFCHAIN_UPDATE_TRANSFER_TX]: TX_TYPE.channelOffChainUpdateTransfer,
  [OBJECT_TAG_CHANNEL_OFFCHAIN_UPDATE_DEPOSIT_TX]: TX_TYPE.channelOffChainUpdateDeposit,
  [OBJECT_TAG_CHANNEL_OFFCHAIN_UPDATE_WITHDRAWAL_TX]: TX_TYPE.channelOffChainUpdateWithdrawal,
  [OBJECT_TAG_CHANNEL_OFFCHAIN_CREATE_CONTRACT_TX]: TX_TYPE.channelOffChainCreateContract,
  [OBJECT_TAG_CHANNEL_OFFCHAIN_CALL_CONTRACT_TX]: TX_TYPE.channelOffChainCallContract,
  [OBJECT_TAG_CHANNEL_RECONNECT_TX]: TX_TYPE.channelReconnect,
  [OBJECT_TAG_PROOF_OF_INCLUSION]: TX_TYPE.proofOfInclusion,
  [OBJECT_TAG_STATE_TREES]: TX_TYPE.stateTrees,
  [OBJECT_TAG_MERKLE_PATRICIA_TREE]: TX_TYPE.merklePatriciaTree,
  [OBJECT_TAG_MERKLE_PATRICIA_TREE_VALUE]: TX_TYPE.merklePatriciaTreeValue,
  [OBJECT_TAG_CONTRACTS_TREE]: TX_TYPE.contractsTree,
  [OBJECT_TAG_CONTRACT_CALLS_TREE]: TX_TYPE.contractCallsTree,
  [OBJECT_TAG_CHANNELS_TREE]: TX_TYPE.channelsTree,
  [OBJECT_TAG_NAMESERVICE_TREE]: TX_TYPE.nameserviceTree,
  [OBJECT_TAG_ORACLES_TREE]: TX_TYPE.oraclesTree,
  [OBJECT_TAG_ACCOUNTS_TREE]: TX_TYPE.accountsTree,
  [OBJECT_TAG_GA_ATTACH]: TX_TYPE.gaAttach,
  [OBJECT_TAG_GA_META]: TX_TYPE.gaMeta,
  [OBJECT_TAG_PAYING_FOR]: TX_TYPE.payingFor,
  [OBJECT_TAG_SOPHIA_BYTE_CODE]: TX_TYPE.sophiaByteCode
} as const

type PrefixType<Prefix> = Prefix extends EncodingType
  ? EncodedData<Prefix>
  : Prefix extends readonly EncodingType[]
    ? EncodedData<Prefix[number]>
    : EncodedData<any>

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
  ctVersion: VmVersion
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
export const TX_FEE_BASE_GAS = (txType: TxType): BigNumber => {
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
export const TX_FEE_OTHER_GAS = (txType: string, txSize: number, { relativeTtl, innerTxSize }: {
  relativeTtl: number
  innerTxSize: number
}): BigNumber => {
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

export const CONTRACT_BYTE_CODE_LIMA = [
  ...BASE_TX,
  ['sourceCodeHash', FIELD_TYPES.rawBinary],
  ['typeInfo', FIELD_TYPES.sophiaCodeTypeInfo],
  ['byteCode', FIELD_TYPES.rawBinary],
  ['compilerVersion', FIELD_TYPES.string],
  ['payable', FIELD_TYPES.bool]
] as const

const ACCOUNT_TX_2 = [
  ...BASE_TX,
  ['flags', FIELD_TYPES.int],
  ['nonce', FIELD_TYPES.int],
  ['balance', FIELD_TYPES.int],
  ['gaContract', FIELD_TYPES.id, ['ct', 'nm']],
  ['gaAuthFun', FIELD_TYPES.binary, 'cb']
] as const

const SPEND_TX = [
  ...BASE_TX,
  ['senderId', FIELD_TYPES.id, 'ak'],
  ['recipientId', FIELD_TYPES.id, ['ak', 'nm']],
  ['amount', FIELD_TYPES.amount],
  ['fee', FIELD_TYPES.int],
  ['ttl', FIELD_TYPES.int],
  ['nonce', FIELD_TYPES.int],
  ['payload', FIELD_TYPES.payload]
] as const

const SIGNED_TX = [
  ...BASE_TX,
  ['signatures', FIELD_TYPES.signatures],
  ['encodedTx', FIELD_TYPES.rlpBinary]
] as const

const NAME_PRE_CLAIM_TX = [
  ...BASE_TX,
  ['accountId', FIELD_TYPES.id, 'ak'],
  ['nonce', FIELD_TYPES.int],
  ['commitmentId', FIELD_TYPES.id, 'cm'],
  ['fee', FIELD_TYPES.int],
  ['ttl', FIELD_TYPES.int]
] as const

const NAME_CLAIM_TX_2 = [
  ...BASE_TX,
  ['accountId', FIELD_TYPES.id, 'ak'],
  ['nonce', FIELD_TYPES.int],
  ['name', Name],
  ['nameSalt', FIELD_TYPES.int],
  ['nameFee', NameFee],
  ['fee', FIELD_TYPES.int],
  ['ttl', FIELD_TYPES.int]
] as const

const NAME_UPDATE_TX = [
  ...BASE_TX,
  ['accountId', FIELD_TYPES.id, 'ak'],
  ['nonce', FIELD_TYPES.int],
  ['nameId', NameId],
  ['nameTtl', FIELD_TYPES.int],
  ['pointers', FIELD_TYPES.pointers],
  ['clientTtl', FIELD_TYPES.int],
  ['fee', FIELD_TYPES.int],
  ['ttl', FIELD_TYPES.int]
] as const

const NAME_TRANSFER_TX = [
  ...BASE_TX,
  ['accountId', FIELD_TYPES.id, 'ak'],
  ['nonce', FIELD_TYPES.int],
  ['nameId', NameId],
  ['recipientId', FIELD_TYPES.id, ['ak', 'nm']],
  ['fee', FIELD_TYPES.int],
  ['ttl', FIELD_TYPES.int]
] as const

const NAME_REVOKE_TX = [
  ...BASE_TX,
  ['accountId', FIELD_TYPES.id, 'ak'],
  ['nonce', FIELD_TYPES.int],
  ['nameId', NameId],
  ['fee', FIELD_TYPES.int],
  ['ttl', FIELD_TYPES.int]
] as const

const CONTRACT_TX = [
  ...BASE_TX,
  ['owner', FIELD_TYPES.id, 'ak'],
  ['ctVersion', FIELD_TYPES.ctVersion],
  ['code', FIELD_TYPES.binary, 'cb'],
  ['log', FIELD_TYPES.binary, 'cb'],
  ['active', FIELD_TYPES.bool],
  ['referers', FIELD_TYPES.ids, 'ak'],
  ['deposit', Deposit]
] as const

const GA_ATTACH_TX = [
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
] as const

const GA_META_TX_2 = [
  ...BASE_TX,
  ['gaId', FIELD_TYPES.id, 'ak'],
  ['authData', FIELD_TYPES.binary, 'cb'],
  ['abiVersion', FIELD_TYPES.int],
  ['fee', FIELD_TYPES.int],
  ['gasLimit', FIELD_TYPES.int],
  ['gasPrice', GasPrice],
  ['tx', FIELD_TYPES.rlpBinary]
] as const

const PAYING_FOR_TX = [
  ...BASE_TX,
  ['payerId', FIELD_TYPES.id, 'ak'],
  ['nonce', FIELD_TYPES.int],
  ['fee', FIELD_TYPES.int],
  ['tx', FIELD_TYPES.rlpBinary]
] as const

const CONTRACT_CREATE_TX = [
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
] as const

const CONTRACT_CALL_TX = [
  ...BASE_TX,
  ['callerId', FIELD_TYPES.id, 'ak'],
  ['nonce', FIELD_TYPES.int],
  ['contractId', FIELD_TYPES.id, ['ct', 'nm']],
  ['abiVersion', FIELD_TYPES.int],
  ['fee', FIELD_TYPES.int],
  ['ttl', FIELD_TYPES.int],
  ['amount', FIELD_TYPES.amount],
  ['gasLimit', FIELD_TYPES.int],
  ['gasPrice', GasPrice],
  ['callData', FIELD_TYPES.binary, 'cb']
] as const

const CONTRACT_CALL_RESULT_TX = [
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
] as const

const ORACLE_REGISTER_TX = [
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
  ['abiVersion', FIELD_TYPES.int]
] as const

const ORACLE_EXTEND_TX = [
  ...BASE_TX,
  ['oracleId', FIELD_TYPES.id, ['ok', 'nm']],
  ['nonce', FIELD_TYPES.int],
  ['oracleTtlType', FIELD_TYPES.int],
  ['oracleTtlValue', FIELD_TYPES.int],
  ['fee', FIELD_TYPES.int],
  ['ttl', FIELD_TYPES.int]
] as const

const ORACLE_QUERY_TX = [
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
] as const

const ORACLE_RESPOND_TX = [
  ...BASE_TX,
  ['oracleId', FIELD_TYPES.id, 'ok'],
  ['nonce', FIELD_TYPES.int],
  ['queryId', FIELD_TYPES.binary, 'oq'],
  ['response', FIELD_TYPES.string],
  ['responseTtlType', FIELD_TYPES.int],
  ['responseTtlValue', FIELD_TYPES.int],
  ['fee', FIELD_TYPES.int],
  ['ttl', FIELD_TYPES.int]
] as const

const CHANNEL_CREATE_TX_2 = [
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
] as const

const CHANNEL_DEPOSIT_TX = [
  ...BASE_TX,
  ['channelId', FIELD_TYPES.id, 'ch'],
  ['fromId', FIELD_TYPES.id, 'ak'],
  ['amount', FIELD_TYPES.int],
  ['ttl', FIELD_TYPES.int],
  ['fee', FIELD_TYPES.int],
  ['stateHash', FIELD_TYPES.binary, 'st'],
  ['round', FIELD_TYPES.int],
  ['nonce', FIELD_TYPES.int]
] as const

const CHANNEL_WITHDRAW_TX = [
  ...BASE_TX,
  ['channelId', FIELD_TYPES.id, 'ch'],
  ['toId', FIELD_TYPES.id, 'ak'],
  ['amount', FIELD_TYPES.int],
  ['ttl', FIELD_TYPES.int],
  ['fee', FIELD_TYPES.int],
  ['stateHash', FIELD_TYPES.binary, 'st'],
  ['round', FIELD_TYPES.int],
  ['nonce', FIELD_TYPES.int]
] as const

const CHANNEL_CLOSE_MUTUAL_TX = [
  ...BASE_TX,
  ['channelId', FIELD_TYPES.id, 'ch'],
  ['fromId', FIELD_TYPES.id, 'ak'],
  ['initiatorAmountFinal', FIELD_TYPES.int],
  ['responderAmountFinal', FIELD_TYPES.int],
  ['ttl', FIELD_TYPES.int],
  ['fee', FIELD_TYPES.int],
  ['nonce', FIELD_TYPES.int]
] as const

const CHANNEL_CLOSE_SOLO_TX = [
  ...BASE_TX,
  ['channelId', FIELD_TYPES.id, 'ch'],
  ['fromId', FIELD_TYPES.id, 'ak'],
  ['payload', FIELD_TYPES.binary, 'tx'],
  ['poi', FIELD_TYPES.binary, 'pi'],
  ['ttl', FIELD_TYPES.int],
  ['fee', FIELD_TYPES.int],
  ['nonce', FIELD_TYPES.int]
] as const

const CHANNEL_SLASH_TX = [
  ...BASE_TX,
  ['channelId', FIELD_TYPES.id, 'ch'],
  ['fromId', FIELD_TYPES.id, 'ak'],
  ['payload', FIELD_TYPES.binary, 'tx'],
  ['poi', FIELD_TYPES.binary, 'pi'],
  ['ttl', FIELD_TYPES.int],
  ['fee', FIELD_TYPES.int],
  ['nonce', FIELD_TYPES.int]
] as const

const CHANNEL_SETTLE_TX = [
  ...BASE_TX,
  ['channelId', FIELD_TYPES.id, 'ch'],
  ['fromId', FIELD_TYPES.id, 'ak'],
  ['initiatorAmountFinal', FIELD_TYPES.int],
  ['responderAmountFinal', FIELD_TYPES.int],
  ['ttl', FIELD_TYPES.int],
  ['fee', FIELD_TYPES.int],
  ['nonce', FIELD_TYPES.int]
] as const

const CHANNEL_FORCE_PROGRESS_TX = [
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
] as const

const CHANNEL_OFFCHAIN_TX_2 = [
  ...BASE_TX,
  ['channelId', FIELD_TYPES.id, 'ch'],
  ['round', FIELD_TYPES.int],
  ['stateHash', FIELD_TYPES.binary, 'st']
] as const

const CHANNEL_TX_3 = [
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
] as const

const CHANNEL_SNAPSHOT_SOLO_TX = [
  ...BASE_TX,
  ['channelId', FIELD_TYPES.id, 'ch'],
  ['fromId', FIELD_TYPES.id, 'ak'],
  ['payload', FIELD_TYPES.binary, 'tx'],
  ['ttl', FIELD_TYPES.int],
  ['fee', FIELD_TYPES.int],
  ['nonce', FIELD_TYPES.int]
] as const

const CHANNEL_OFFCHAIN_CREATE_CONTRACT_TX = [
  ...BASE_TX,
  ['owner', FIELD_TYPES.id, 'ak'],
  ['ctVersion', FIELD_TYPES.ctVersion],
  ['code', FIELD_TYPES.binary, 'cb'],
  ['deposit', FIELD_TYPES.int],
  ['callData', FIELD_TYPES.binary, 'cb']
] as const

const CHANNEL_OFFCHAIN_CALL_CONTRACT_TX = [
  ...BASE_TX,
  ['caller', FIELD_TYPES.id, 'ak'],
  ['contract', FIELD_TYPES.id, 'ct'],
  ['abiVersion', FIELD_TYPES.int],
  ['amount', FIELD_TYPES.int],
  ['callData', FIELD_TYPES.binary, 'cb'],
  ['callStack', FIELD_TYPES.callStack],
  ['gasPrice', GasPrice],
  ['gasLimit', FIELD_TYPES.int]
] as const

const CHANNEL_RECONNECT_TX = [
  ...BASE_TX,
  ['channelId', FIELD_TYPES.id, 'ch'],
  ['round', FIELD_TYPES.int],
  ['role', FIELD_TYPES.string],
  ['pubkey', FIELD_TYPES.id, 'ak']
] as const

const CHANNEL_OFFCHAIN_UPDATE_TRANSFER_TX = [
  ...BASE_TX,
  ['from', FIELD_TYPES.id, 'ak'],
  ['to', FIELD_TYPES.id, 'ak'],
  ['amount', FIELD_TYPES.int]
] as const

const CHANNEL_OFFCHAIN_UPDATE_DEPOSIT_TX = [
  ...BASE_TX,
  ['from', FIELD_TYPES.id, 'ak'],
  ['amount', FIELD_TYPES.int]
] as const

const CHANNEL_OFFCHAIN_UPDATE_WITHDRAWAL_TX = [
  ...BASE_TX,
  ['from', FIELD_TYPES.id, 'ak'],
  ['amount', FIELD_TYPES.int]
] as const

const PROOF_OF_INCLUSION_TX = [
  ...BASE_TX,
  ['accounts', FIELD_TYPES.mptrees],
  ['calls', FIELD_TYPES.mptrees],
  ['channels', FIELD_TYPES.mptrees],
  ['contracts', FIELD_TYPES.mptrees],
  ['ns', FIELD_TYPES.mptrees],
  ['oracles', FIELD_TYPES.mptrees]
] as const

const STATE_TREES_TX = [
  ...BASE_TX,
  ['contracts', FIELD_TYPES.rlpBinary],
  ['calls', FIELD_TYPES.rlpBinary],
  ['channels', FIELD_TYPES.rlpBinary],
  ['ns', FIELD_TYPES.rlpBinary],
  ['oracles', FIELD_TYPES.rlpBinary],
  ['accounts', FIELD_TYPES.rlpBinary]
] as const

const MERKLE_PATRICIA_TREE_TX = [
  ...BASE_TX,
  ['values', FIELD_TYPES.rlpBinaries]
] as const

const MERKLE_PATRICIA_TREE_VALUE_TX = [
  ...BASE_TX,
  ['key', FIELD_TYPES.hex],
  ['value', FIELD_TYPES.rawBinary]
] as const

const CONTRACTS_TREE_TX = [
  ...BASE_TX,
  ['contracts', FIELD_TYPES.rlpBinary]
] as const

const CONTRACT_CALLS_TREE_TX = [
  ...BASE_TX,
  ['calls', FIELD_TYPES.rlpBinary]
] as const

const CHANNELS_TREE_TX = [
  ...BASE_TX,
  ['channels', FIELD_TYPES.rlpBinary]
] as const

const NAMESERVICE_TREE_TX = [
  ...BASE_TX,
  ['mtree', FIELD_TYPES.rlpBinary]
] as const

const ORACLES_TREE_TX = [
  ...BASE_TX,
  ['otree', FIELD_TYPES.rlpBinary]
] as const

const ACCOUNTS_TREE_TX = [
  ...BASE_TX,
  ['accounts', FIELD_TYPES.rlpBinary]
] as const

export const TX_SERIALIZATION_SCHEMA = {
  [TX_TYPE.account]: {
    2: ACCOUNT_TX_2
  },
  [TX_TYPE.signed]: {
    1: SIGNED_TX
  },
  [TX_TYPE.spend]: {
    1: SPEND_TX
  },
  [TX_TYPE.namePreClaim]: {
    1: NAME_PRE_CLAIM_TX
  },
  [TX_TYPE.nameClaim]: {
    2: NAME_CLAIM_TX_2
  },
  [TX_TYPE.nameUpdate]: {
    1: NAME_UPDATE_TX
  },
  [TX_TYPE.nameTransfer]: {
    1: NAME_TRANSFER_TX
  },
  [TX_TYPE.nameRevoke]: {
    1: NAME_REVOKE_TX
  },
  [TX_TYPE.contract]: {
    1: CONTRACT_TX
  },
  [TX_TYPE.contractCreate]: {
    1: CONTRACT_CREATE_TX
  },
  [TX_TYPE.contractCall]: {
    1: CONTRACT_CALL_TX
  },
  [TX_TYPE.contractCallResult]: {
    1: CONTRACT_CALL_RESULT_TX
  },
  [TX_TYPE.oracleRegister]: {
    1: ORACLE_REGISTER_TX
  },
  [TX_TYPE.oracleExtend]: {
    1: ORACLE_EXTEND_TX
  },
  [TX_TYPE.oracleQuery]: {
    1: ORACLE_QUERY_TX
  },
  [TX_TYPE.oracleResponse]: {
    1: ORACLE_RESPOND_TX
  },
  [TX_TYPE.channelCreate]: {
    2: CHANNEL_CREATE_TX_2
  },
  [TX_TYPE.channelCloseMutual]: {
    1: CHANNEL_CLOSE_MUTUAL_TX
  },
  [TX_TYPE.channelCloseSolo]: {
    1: CHANNEL_CLOSE_SOLO_TX
  },
  [TX_TYPE.channelSlash]: {
    1: CHANNEL_SLASH_TX
  },
  [TX_TYPE.channelDeposit]: {
    1: CHANNEL_DEPOSIT_TX
  },
  [TX_TYPE.channelWithdraw]: {
    1: CHANNEL_WITHDRAW_TX
  },
  [TX_TYPE.channelSettle]: {
    1: CHANNEL_SETTLE_TX
  },
  [TX_TYPE.channelForceProgress]: {
    1: CHANNEL_FORCE_PROGRESS_TX
  },
  [TX_TYPE.channelOffChain]: {
    2: CHANNEL_OFFCHAIN_TX_2
  },
  [TX_TYPE.channel]: {
    3: CHANNEL_TX_3
  },
  [TX_TYPE.channelSnapshotSolo]: {
    1: CHANNEL_SNAPSHOT_SOLO_TX
  },
  [TX_TYPE.channelOffChainUpdateTransfer]: {
    1: CHANNEL_OFFCHAIN_UPDATE_TRANSFER_TX
  },
  [TX_TYPE.channelOffChainUpdateDeposit]: {
    1: CHANNEL_OFFCHAIN_UPDATE_DEPOSIT_TX
  },
  [TX_TYPE.channelOffChainUpdateWithdrawal]: {
    1: CHANNEL_OFFCHAIN_UPDATE_WITHDRAWAL_TX
  },
  [TX_TYPE.channelOffChainCreateContract]: {
    1: CHANNEL_OFFCHAIN_CREATE_CONTRACT_TX
  },
  [TX_TYPE.channelOffChainCallContract]: {
    1: CHANNEL_OFFCHAIN_CALL_CONTRACT_TX
  },
  [TX_TYPE.channelReconnect]: {
    1: CHANNEL_RECONNECT_TX
  },
  [TX_TYPE.proofOfInclusion]: {
    1: PROOF_OF_INCLUSION_TX
  },
  [TX_TYPE.stateTrees]: {
    1: STATE_TREES_TX
  },
  [TX_TYPE.merklePatriciaTree]: {
    1: MERKLE_PATRICIA_TREE_TX
  },
  [TX_TYPE.merklePatriciaTreeValue]: {
    1: MERKLE_PATRICIA_TREE_VALUE_TX
  },
  [TX_TYPE.contractsTree]: {
    1: CONTRACTS_TREE_TX
  },
  [TX_TYPE.contractCallsTree]: {
    1: CONTRACT_CALLS_TREE_TX
  },
  [TX_TYPE.channelsTree]: {
    1: CHANNELS_TREE_TX
  },
  [TX_TYPE.nameserviceTree]: {
    1: NAMESERVICE_TREE_TX
  },
  [TX_TYPE.oraclesTree]: {
    1: ORACLES_TREE_TX
  },
  [TX_TYPE.accountsTree]: {
    1: ACCOUNTS_TREE_TX
  },
  [TX_TYPE.gaAttach]: {
    1: GA_ATTACH_TX
  },
  [TX_TYPE.gaMeta]: {
    2: GA_META_TX_2
  },
  [TX_TYPE.payingFor]: {
    1: PAYING_FOR_TX
  }
} as const

export type TxType = keyof typeof TX_SERIALIZATION_SCHEMA

export type TxTypeSchemas = {
  [key in TxType]: BuildTxArgBySchema<
    typeof TX_SERIALIZATION_SCHEMA[key][keyof typeof TX_SERIALIZATION_SCHEMA[key]]
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

export const TX_DESERIALIZATION_SCHEMA = {
  [OBJECT_TAG_ACCOUNT]: {
    2: ACCOUNT_TX_2
  },
  [OBJECT_TAG_SIGNED_TRANSACTION]: {
    1: SIGNED_TX
  },
  [OBJECT_TAG_SPEND_TRANSACTION]: {
    1: SPEND_TX
  },
  [OBJECT_TAG_NAME_SERVICE_PRECLAIM_TRANSACTION]: {
    1: NAME_PRE_CLAIM_TX
  },
  [OBJECT_TAG_NAME_SERVICE_CLAIM_TRANSACTION]: {
    2: NAME_CLAIM_TX_2
  },
  [OBJECT_TAG_NAME_SERVICE_UPDATE_TRANSACTION]: {
    1: NAME_UPDATE_TX
  },
  [OBJECT_TAG_NAME_SERVICE_TRANSFER_TRANSACTION]: {
    1: NAME_TRANSFER_TX
  },
  [OBJECT_TAG_NAME_SERVICE_REVOKE_TRANSACTION]: {
    1: NAME_REVOKE_TX
  },
  [OBJECT_TAG_CONTRACT]: {
    1: CONTRACT_TX
  },
  [OBJECT_TAG_CONTRACT_CREATE_TRANSACTION]: {
    1: CONTRACT_CREATE_TX
  },
  [OBJECT_TAG_CONTRACT_CALL_TRANSACTION]: {
    1: CONTRACT_CALL_TX
  },
  [OBJECT_TAG_CONTRACT_CALL]: {
    1: CONTRACT_CALL_RESULT_TX
  },
  [OBJECT_TAG_ORACLE_REGISTER_TRANSACTION]: {
    1: ORACLE_REGISTER_TX
  },
  [OBJECT_TAG_ORACLE_EXTEND_TRANSACTION]: {
    1: ORACLE_EXTEND_TX
  },
  [OBJECT_TAG_ORACLE_QUERY_TRANSACTION]: {
    1: ORACLE_QUERY_TX
  },
  [OBJECT_TAG_ORACLE_RESPONSE_TRANSACTION]: {
    1: ORACLE_RESPOND_TX
  },
  [OBJECT_TAG_CHANNEL_CREATE_TX]: {
    2: CHANNEL_CREATE_TX_2
  },
  [OBJECT_TAG_CHANNEL_CLOSE_MUTUAL_TX]: {
    1: CHANNEL_CLOSE_MUTUAL_TX
  },
  [OBJECT_TAG_CHANNEL_CLOSE_SOLO_TX]: {
    1: CHANNEL_CLOSE_SOLO_TX
  },
  [OBJECT_TAG_CHANNEL_SLASH_TX]: {
    1: CHANNEL_SLASH_TX
  },
  [OBJECT_TAG_CHANNEL_DEPOSIT_TX]: {
    1: CHANNEL_DEPOSIT_TX
  },
  [OBJECT_TAG_CHANNEL_WITHRAW_TX]: {
    1: CHANNEL_WITHDRAW_TX
  },
  [OBJECT_TAG_CHANNEL_SETTLE_TX]: {
    1: CHANNEL_SETTLE_TX
  },
  [OBJECT_TAG_CHANNEL_OFFCHAIN_TX]: {
    2: CHANNEL_OFFCHAIN_TX_2
  },
  [OBJECT_TAG_CHANNEL]: {
    3: CHANNEL_TX_3
  },
  [OBJECT_TAG_CHANNEL_SNAPSHOT_SOLO_TX]: {
    1: CHANNEL_SNAPSHOT_SOLO_TX
  },
  [OBJECT_TAG_CHANNEL_OFFCHAIN_UPDATE_TRANSFER_TX]: {
    1: CHANNEL_OFFCHAIN_UPDATE_TRANSFER_TX
  },
  [OBJECT_TAG_CHANNEL_OFFCHAIN_UPDATE_DEPOSIT_TX]: {
    1: CHANNEL_OFFCHAIN_UPDATE_DEPOSIT_TX
  },
  [OBJECT_TAG_CHANNEL_OFFCHAIN_UPDATE_WITHDRAWAL_TX]: {
    1: CHANNEL_OFFCHAIN_UPDATE_WITHDRAWAL_TX
  },
  [OBJECT_TAG_CHANNEL_OFFCHAIN_CREATE_CONTRACT_TX]: {
    1: CHANNEL_OFFCHAIN_CREATE_CONTRACT_TX
  },
  [OBJECT_TAG_CHANNEL_OFFCHAIN_CALL_CONTRACT_TX]: {
    1: CHANNEL_OFFCHAIN_CALL_CONTRACT_TX
  },
  [OBJECT_TAG_CHANNEL_RECONNECT_TX]: {
    1: CHANNEL_RECONNECT_TX
  },
  [OBJECT_TAG_PROOF_OF_INCLUSION]: {
    1: PROOF_OF_INCLUSION_TX
  },
  [OBJECT_TAG_STATE_TREES]: {
    1: STATE_TREES_TX
  },
  [OBJECT_TAG_MERKLE_PATRICIA_TREE]: {
    1: MERKLE_PATRICIA_TREE_TX
  },
  [OBJECT_TAG_MERKLE_PATRICIA_TREE_VALUE]: {
    1: MERKLE_PATRICIA_TREE_VALUE_TX
  },
  [OBJECT_TAG_CONTRACTS_TREE]: {
    1: CONTRACTS_TREE_TX
  },
  [OBJECT_TAG_CONTRACT_CALLS_TREE]: {
    1: CONTRACT_CALLS_TREE_TX
  },
  [OBJECT_TAG_CHANNELS_TREE]: {
    1: CHANNELS_TREE_TX
  },
  [OBJECT_TAG_NAMESERVICE_TREE]: {
    1: NAMESERVICE_TREE_TX
  },
  [OBJECT_TAG_ORACLES_TREE]: {
    1: ORACLES_TREE_TX
  },
  [OBJECT_TAG_ACCOUNTS_TREE]: {
    1: ACCOUNTS_TREE_TX
  },
  [OBJECT_TAG_GA_ATTACH]: {
    1: GA_ATTACH_TX
  },
  [OBJECT_TAG_GA_META]: {
    2: GA_META_TX_2
  },
  [OBJECT_TAG_PAYING_FOR]: {
    1: PAYING_FOR_TX
  },
  [OBJECT_TAG_CHANNEL_FORCE_PROGRESS_TX]: {
    1: CHANNEL_FORCE_PROGRESS_TX
  },
  [OBJECT_TAG_SOPHIA_BYTE_CODE]: {
    3: CONTRACT_BYTE_CODE_LIMA
  }
} as const
