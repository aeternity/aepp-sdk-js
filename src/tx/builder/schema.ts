import { Pointer } from './helpers'
/**
 * Transaction Schema for TxBuilder
 * @module @aeternity/aepp-sdk/es/tx/builder/schema
 * @example import { TX_TYPE } from '@aeternity/aepp-sdk'
 */
// # RLP version number
// # https://github.com/aeternity/protocol/blob/master/serializations.md#binary-serialization

import BigNumber from 'bignumber.js'
import { Name, NameId, NameFee, Deposit, Field } from './field-types'
import MPTree from '../../utils/mptree'

export * from './constants'
export const VSN = 1
export const VSN_2 = 2

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
export const MIN_GAS_PRICE = 1e9
export const MAX_AUTH_FUN_GAS = 50000
export const DRY_RUN_ACCOUNT = { pub: 'ak_11111111111111111111111111111111273Yts', amount: '100000000000000000000000000000000000' }

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

export type TxField = [name: string, type: string | typeof Field, prefix: string | string[]]
const TX_FIELD: (
  name: string,
  type: string | typeof Field,
  prefix?: string | string[]
) => TxField = (name, type, prefix = '') => [name, type, prefix]

type TxSchemaField = (
  schema: TxField[],
  objectId: number
) => [TxField[], number]
const TX_SCHEMA_FIELD: TxSchemaField = (schema, objectId) => [schema, objectId]

/**
 * @constant
 * @description Object with transaction types
 * @alias module:@aeternity/aepp-sdk/es/tx/builder/schema
 * @property {String} signed
 * @property {String} spend
 * @property {String} nameClaim
 * @property {String} namePreClaim
 * @property {String} nameUpdate
 * @property {String} nameRevoke
 * @property {String} nameTransfer
 * @property {String} contractCreate
 * @property {String} contractCall
 * @property {String} oracleRegister
 * @property {String} oracleExtend
 * @property {String} oracleQuery
 * @property {String} oracleResponse
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
}

// # see https://github.com/aeternity/protocol/blob/minerva/contracts/contract_vms.md#virtual-machines-on-the-%C3%A6ternity-blockchain
export const VM_VERSIONS = {
  NO_VM: 0,
  SOPHIA: 1,
  SOPHIA_IMPROVEMENTS_MINERVA: 3,
  SOPHIA_IMPROVEMENTS_FORTUNA: 4,
  FATE: 5,
  SOPHIA_IMPROVEMENTS_LIMA: 6,
  FATE_2: 7
}
// # see https://github.com/aeternity/protocol/blob/minerva/contracts/contract_vms.md#virtual-machines-on-the-%C3%A6ternity-blockchain
export const ABI_VERSIONS = {
  NO_ABI: 0,
  SOPHIA: 1,
  FATE: 3
}

export const PROTOCOL_VERSIONS = {
  IRIS: 5
}

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
}

export const OBJECT_ID_TX_TYPE: {
  [key: string]: string
} = {
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
}

// FEE CALCULATION
export const BASE_GAS = 15000
export const GAS_PER_BYTE = 20
export const DEFAULT_FEE = 20000
export const KEY_BLOCK_INTERVAL = 3

/**
 * Calculate the Base fee gas
 * @see {@link https://github.com/aeternity/protocol/blob/master/consensus/README.md#gas}
 * @param {string} txType - The transaction type
 * @returns {BigNumber} The base fee
 * @example TX_FEE_BASE('channelForceProgress') => new BigNumber(30 * 15000)
 */
export const TX_FEE_BASE_GAS = (txType: string): BigNumber => {
  const factor = ({
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
  })[txType] ?? 1
  return new BigNumber(factor * BASE_GAS)
}

/**
 * Calculate fee for Other types of transactions
 * @see {@link https://github.com/aeternity/protocol/blob/master/consensus/README.md#gas}
 * @param {String} txType - The transaction type
 * @param {Number} txSize - The transaction size
 * @returns {Object} parameters - The transaction parameters
 * @returns {Number} parameters.relativeTtl - The relative ttl
 * @returns {Number} parameters.innerTxSize - The size of the inner transaction
 * @returns {BigNumber} The Other fee
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

interface TxBase {
  tag: number
  VSN: number
}
const BASE_TX = [
  TX_FIELD('tag', FIELD_TYPES.int),
  TX_FIELD('VSN', FIELD_TYPES.int)
]

export const CONTRACT_BYTE_CODE_LIMA = [
  ...BASE_TX,
  TX_FIELD('sourceCodeHash', FIELD_TYPES.rawBinary),
  TX_FIELD('typeInfo', FIELD_TYPES.sophiaCodeTypeInfo),
  TX_FIELD('byteCode', FIELD_TYPES.rawBinary),
  TX_FIELD('compilerVersion', FIELD_TYPES.string),
  TX_FIELD('payable', FIELD_TYPES.bool)
]

interface TxAccount extends TxBase {
  flags: number
  nonce: number
  balance: number
  gaContract: string
  gaAuthFun: Function
}
const ACCOUNT_TX_2 = [
  ...BASE_TX,
  TX_FIELD('flags', FIELD_TYPES.int),
  TX_FIELD('nonce', FIELD_TYPES.int),
  TX_FIELD('balance', FIELD_TYPES.int),
  TX_FIELD('gaContract', FIELD_TYPES.id, ['ct', 'nm']),
  TX_FIELD('gaAuthFun', FIELD_TYPES.binary, 'cb')
]

interface TxSpend {
  senderId: string
  recipientId: string
  amount: number
  fee: number
  nonce: number
  payload: object
}
const SPEND_TX = [
  ...BASE_TX,
  TX_FIELD('senderId', FIELD_TYPES.id, 'ak'),
  TX_FIELD('recipientId', FIELD_TYPES.id, ['ak', 'nm']),
  TX_FIELD('amount', FIELD_TYPES.amount),
  TX_FIELD('fee', FIELD_TYPES.int),
  TX_FIELD('ttl', FIELD_TYPES.int),
  TX_FIELD('nonce', FIELD_TYPES.int),
  TX_FIELD('payload', FIELD_TYPES.payload)
]

interface TxSigned extends TxBase {
  signatures: string[]
  rlpBinary: Buffer
}
const SIGNED_TX = [
  ...BASE_TX,
  TX_FIELD('signatures', FIELD_TYPES.signatures),
  TX_FIELD('encodedTx', FIELD_TYPES.rlpBinary)
]

interface TxNamePreClaim extends TxBase {
  accountId: string
  nonce: number
  commitmentId: string
  fee: number
  ttl: number
}

const NAME_PRE_CLAIM_TX = [
  ...BASE_TX,
  TX_FIELD('accountId', FIELD_TYPES.id, 'ak'),
  TX_FIELD('nonce', FIELD_TYPES.int),
  TX_FIELD('commitmentId', FIELD_TYPES.id, 'cm'),
  TX_FIELD('fee', FIELD_TYPES.int),
  TX_FIELD('ttl', FIELD_TYPES.int)
]

interface TxNameClaim2 extends TxBase {
  accountId: string
  nonce: number
  name: string
  nameFee: number
  fee: number
  ttl: number
}
const NAME_CLAIM_TX_2 = [
  ...BASE_TX,
  TX_FIELD('accountId', FIELD_TYPES.id, 'ak'),
  TX_FIELD('nonce', FIELD_TYPES.int),
  TX_FIELD('name', Name),
  TX_FIELD('nameSalt', FIELD_TYPES.int),
  TX_FIELD('nameFee', NameFee),
  TX_FIELD('fee', FIELD_TYPES.int),
  TX_FIELD('ttl', FIELD_TYPES.int)
]

interface TxNameUpdate extends TxBase {
  accountId: string
  nonce: number
  name: string
  pointers: Pointer[]
  clientTTl: number
  fee: number
  ttl: number
}
const NAME_UPDATE_TX = [
  ...BASE_TX,
  TX_FIELD('accountId', FIELD_TYPES.id, 'ak'),
  TX_FIELD('nonce', FIELD_TYPES.int),
  TX_FIELD('nameId', NameId),
  TX_FIELD('nameTtl', FIELD_TYPES.int),
  TX_FIELD('pointers', FIELD_TYPES.pointers),
  TX_FIELD('clientTtl', FIELD_TYPES.int),
  TX_FIELD('fee', FIELD_TYPES.int),
  TX_FIELD('ttl', FIELD_TYPES.int)
]

interface TxNameTransfer extends TxBase {
  accountId: string
  nonce: number
  nameId: string
  recipientId: string
  fee: number
  ttl: number
}
const NAME_TRANSFER_TX = [
  ...BASE_TX,
  TX_FIELD('accountId', FIELD_TYPES.id, 'ak'),
  TX_FIELD('nonce', FIELD_TYPES.int),
  TX_FIELD('nameId', NameId),
  TX_FIELD('recipientId', FIELD_TYPES.id, ['ak', 'nm']),
  TX_FIELD('fee', FIELD_TYPES.int),
  TX_FIELD('ttl', FIELD_TYPES.int)
]

interface TxNameRevoke extends TxBase {
  accountId: string
  nonce: number
  nameId: string
  fee: number
  ttl: number
}
const NAME_REVOKE_TX = [
  ...BASE_TX,
  TX_FIELD('accountId', FIELD_TYPES.id, 'ak'),
  TX_FIELD('nonce', FIELD_TYPES.int),
  TX_FIELD('nameId', NameId),
  TX_FIELD('fee', FIELD_TYPES.int),
  TX_FIELD('ttl', FIELD_TYPES.int)
]

interface TxContract extends TxBase {
  owner: string
  ctVersion: number
  code: string
  log: string
  active: boolean
  referers: string[]
  deposit: number
}
const CONTRACT_TX = [
  ...BASE_TX,
  TX_FIELD('owner', FIELD_TYPES.id, 'ak'),
  TX_FIELD('ctVersion', FIELD_TYPES.int),
  TX_FIELD('code', FIELD_TYPES.binary, 'cb'),
  TX_FIELD('log', FIELD_TYPES.binary, 'cb'),
  TX_FIELD('active', FIELD_TYPES.bool),
  TX_FIELD('referers', FIELD_TYPES.ids, 'ak'),
  TX_FIELD('deposit', Deposit)
]

interface TxGaAttach extends TxBase {
  ownerId: string
  nonce: number
  code: string
  authFun: Function
  ctVersion: number
  fee: number
  ttl: number
  gasLimit: number
  gasPrice: number
  callData: string
}
const GA_ATTACH_TX = [
  ...BASE_TX,
  TX_FIELD('ownerId', FIELD_TYPES.id, 'ak'),
  TX_FIELD('nonce', FIELD_TYPES.int),
  TX_FIELD('code', FIELD_TYPES.binary, 'cb'),
  TX_FIELD('authFun', FIELD_TYPES.rawBinary),
  TX_FIELD('ctVersion', FIELD_TYPES.ctVersion),
  TX_FIELD('fee', FIELD_TYPES.int),
  TX_FIELD('ttl', FIELD_TYPES.int),
  TX_FIELD('gasLimit', FIELD_TYPES.int),
  TX_FIELD('gasPrice', FIELD_TYPES.int),
  TX_FIELD('callData', FIELD_TYPES.binary, 'cb')
]

interface TxGaMeta2 extends TxBase {
  gaId: string
  authData: string
  abiVersion: number
  fee: number
  gasLimit: number
  gasPrice: number
  tx: Buffer
}
const GA_META_TX_2 = [
  ...BASE_TX,
  TX_FIELD('gaId', FIELD_TYPES.id, 'ak'),
  TX_FIELD('authData', FIELD_TYPES.binary, 'cb'),
  TX_FIELD('abiVersion', FIELD_TYPES.int),
  TX_FIELD('fee', FIELD_TYPES.int),
  TX_FIELD('gasLimit', FIELD_TYPES.int),
  TX_FIELD('gasPrice', FIELD_TYPES.int),
  TX_FIELD('tx', FIELD_TYPES.rlpBinary)
]

interface TxPayingFor extends TxBase {
  payerId: string
  nonce: number
  fee: number
  tx: Buffer
}
const PAYING_FOR_TX = [
  ...BASE_TX,
  TX_FIELD('payerId', FIELD_TYPES.id, 'ak'),
  TX_FIELD('nonce', FIELD_TYPES.int),
  TX_FIELD('fee', FIELD_TYPES.int),
  TX_FIELD('tx', FIELD_TYPES.rlpBinary)
]

interface TxContractCreate extends TxBase {
  ownerId: string
  nonce: number
  code: string
  ctVersion: number
  fee: number
  ttl: number
  deposit: number
  amount: number
  gasLimit: number
  gasPrice: number
  callData: string
}
const CONTRACT_CREATE_TX = [
  ...BASE_TX,
  TX_FIELD('ownerId', FIELD_TYPES.id, 'ak'),
  TX_FIELD('nonce', FIELD_TYPES.int),
  TX_FIELD('code', FIELD_TYPES.binary, 'cb'),
  TX_FIELD('ctVersion', FIELD_TYPES.ctVersion),
  TX_FIELD('fee', FIELD_TYPES.int),
  TX_FIELD('ttl', FIELD_TYPES.int),
  TX_FIELD('deposit', Deposit),
  TX_FIELD('amount', FIELD_TYPES.amount),
  TX_FIELD('gasLimit', FIELD_TYPES.int),
  TX_FIELD('gasPrice', FIELD_TYPES.int),
  TX_FIELD('callData', FIELD_TYPES.binary, 'cb')
]

interface TxContractCall extends TxBase {
  callerId: string
  nonce: number
  contractId: string
  abiVersion: number
  fee: number
  ttl: number
  amount: number
  gasLimit: number
  gasPrice: number
  callData: string
}
const CONTRACT_CALL_TX = [
  ...BASE_TX,
  TX_FIELD('callerId', FIELD_TYPES.id, 'ak'),
  TX_FIELD('nonce', FIELD_TYPES.int),
  TX_FIELD('contractId', FIELD_TYPES.id, ['ct', 'nm']),
  TX_FIELD('abiVersion', FIELD_TYPES.int),
  TX_FIELD('fee', FIELD_TYPES.int),
  TX_FIELD('ttl', FIELD_TYPES.int),
  TX_FIELD('amount', FIELD_TYPES.amount),
  TX_FIELD('gasLimit', FIELD_TYPES.int),
  TX_FIELD('gasPrice', FIELD_TYPES.int),
  TX_FIELD('callData', FIELD_TYPES.binary, 'cb')
]

interface TxContractCallResult extends TxBase {
  callerId: string
  callerNonce: number
  height: number
  contractId: string
  gasPrice: number
  gasUsed: number
  returnValue: string
  returnType: string
  log: string
}
const CONTRACT_CALL_RESULT_TX = [
  ...BASE_TX,
  TX_FIELD('callerId', FIELD_TYPES.id, 'ak'),
  TX_FIELD('callerNonce', FIELD_TYPES.int),
  TX_FIELD('height', FIELD_TYPES.int),
  TX_FIELD('contractId', FIELD_TYPES.id, 'ct'),
  TX_FIELD('gasPrice', FIELD_TYPES.int),
  TX_FIELD('gasUsed', FIELD_TYPES.int),
  TX_FIELD('returnValue', FIELD_TYPES.binary, 'cb'),
  TX_FIELD('returnType', FIELD_TYPES.callReturnType),
  // TODO: add serialization for
  //  <log> :: [ { <address> :: id, [ <topics> :: binary() ], <data> :: binary() } ]
  TX_FIELD('log', FIELD_TYPES.rawBinary)
]

interface TxOracleRegister extends TxBase {
  accountId: string
  nonce: number
  queryFormat: string
  responseFormat: string
  queryFee: number
  oracleTtlType: string
  oracleTtlValue: string
  fee: number
  ttl: number
  abiVersion: number
}
const ORACLE_REGISTER_TX = [
  ...BASE_TX,
  TX_FIELD('accountId', FIELD_TYPES.id, 'ak'),
  TX_FIELD('nonce', FIELD_TYPES.int),
  TX_FIELD('queryFormat', FIELD_TYPES.string),
  TX_FIELD('responseFormat', FIELD_TYPES.string),
  TX_FIELD('queryFee', FIELD_TYPES.amount),
  TX_FIELD('oracleTtlType', FIELD_TYPES.int),
  TX_FIELD('oracleTtlValue', FIELD_TYPES.int),
  TX_FIELD('fee', FIELD_TYPES.int),
  TX_FIELD('ttl', FIELD_TYPES.int),
  TX_FIELD('abiVersion', FIELD_TYPES.int)
]

interface TxOracleExtend extends TxBase {
  oracleId: string
  nonce: number
  oracleTtlType: string
  oracleTtlValue: string
  fee: number
  ttl: number
}
const ORACLE_EXTEND_TX = [
  ...BASE_TX,
  TX_FIELD('oracleId', FIELD_TYPES.id, ['ok', 'nm']),
  TX_FIELD('nonce', FIELD_TYPES.int),
  TX_FIELD('oracleTtlType', FIELD_TYPES.int),
  TX_FIELD('oracleTtlValue', FIELD_TYPES.int),
  TX_FIELD('fee', FIELD_TYPES.int),
  TX_FIELD('ttl', FIELD_TYPES.int)
]

interface TxOracleQuery extends TxBase {
  senderId: string
  nonce: number
  oracleId: string
  query: string
  queryFee: number
  queryTtlType: string
  queryTtlValue: string
  responseTtlType: string
  responseTtlValue: string
  fee: number
  ttl: number
}
const ORACLE_QUERY_TX = [
  ...BASE_TX,
  TX_FIELD('senderId', FIELD_TYPES.id, 'ak'),
  TX_FIELD('nonce', FIELD_TYPES.int),
  TX_FIELD('oracleId', FIELD_TYPES.id, ['ok', 'nm']),
  TX_FIELD('query', FIELD_TYPES.string),
  TX_FIELD('queryFee', FIELD_TYPES.amount),
  TX_FIELD('queryTtlType', FIELD_TYPES.int),
  TX_FIELD('queryTtlValue', FIELD_TYPES.int),
  TX_FIELD('responseTtlType', FIELD_TYPES.int),
  TX_FIELD('responseTtlValue', FIELD_TYPES.int),
  TX_FIELD('fee', FIELD_TYPES.int),
  TX_FIELD('ttl', FIELD_TYPES.int)
]

interface TxOracleRespond extends TxBase {
  oracleId: string
  nonce: number
  response: string
  responseTtlType: number
  responseTtlValue: number
  fee: number
  ttl: number
}
const ORACLE_RESPOND_TX = [
  ...BASE_TX,
  TX_FIELD('oracleId', FIELD_TYPES.id, 'ok'),
  TX_FIELD('nonce', FIELD_TYPES.int),
  TX_FIELD('queryId', FIELD_TYPES.binary, 'oq'),
  TX_FIELD('response', FIELD_TYPES.string),
  TX_FIELD('responseTtlType', FIELD_TYPES.int),
  TX_FIELD('responseTtlValue', FIELD_TYPES.int),
  TX_FIELD('fee', FIELD_TYPES.int),
  TX_FIELD('ttl', FIELD_TYPES.int)
]

interface TxChannelCreate2 extends TxBase {
  initiator: string
  initiatorAmount: number
  responder: string
  responderAmount: number
  channelReserve: string
  fee: number
  ttl: number
  lockPeriod: number
  initiatorDelegateIds: string
  responderDelegateIds: string
  stateHash: string
  nonce: number
}
const CHANNEL_CREATE_TX_2 = [
  ...BASE_TX,
  TX_FIELD('initiator', FIELD_TYPES.id, 'ak'),
  TX_FIELD('initiatorAmount', FIELD_TYPES.int),
  TX_FIELD('responder', FIELD_TYPES.id, 'ak'),
  TX_FIELD('responderAmount', FIELD_TYPES.int),
  TX_FIELD('channelReserve', FIELD_TYPES.int),
  TX_FIELD('lockPeriod', FIELD_TYPES.int),
  TX_FIELD('ttl', FIELD_TYPES.int),
  TX_FIELD('fee', FIELD_TYPES.int),
  TX_FIELD('initiatorDelegateIds', FIELD_TYPES.string),
  TX_FIELD('responderDelegateIds', FIELD_TYPES.string),
  TX_FIELD('stateHash', FIELD_TYPES.binary, 'st'),
  TX_FIELD('nonce', FIELD_TYPES.int)
]

interface TxChannelClose extends TxBase {
  channelId: string
  fromId: string
  amount: number
  ttl: number
  fee: number
  stateHash: string
  round: number
  nonce: number
}
const CHANNEL_DEPOSIT_TX = [
  ...BASE_TX,
  TX_FIELD('channelId', FIELD_TYPES.id, 'ch'),
  TX_FIELD('fromId', FIELD_TYPES.id, 'ak'),
  TX_FIELD('amount', FIELD_TYPES.int),
  TX_FIELD('ttl', FIELD_TYPES.int),
  TX_FIELD('fee', FIELD_TYPES.int),
  TX_FIELD('stateHash', FIELD_TYPES.binary, 'st'),
  TX_FIELD('round', FIELD_TYPES.int),
  TX_FIELD('nonce', FIELD_TYPES.int)
]

interface TxChannelWithdraw extends TxBase {
  channelId: string
  toId: string
  amount: number
  ttl: number
  fee: number
  stateHash: string
  round: number
  nonce: number
}
const CHANNEL_WITHDRAW_TX = [
  ...BASE_TX,
  TX_FIELD('channelId', FIELD_TYPES.id, 'ch'),
  TX_FIELD('toId', FIELD_TYPES.id, 'ak'),
  TX_FIELD('amount', FIELD_TYPES.int),
  TX_FIELD('ttl', FIELD_TYPES.int),
  TX_FIELD('fee', FIELD_TYPES.int),
  TX_FIELD('stateHash', FIELD_TYPES.binary, 'st'),
  TX_FIELD('round', FIELD_TYPES.int),
  TX_FIELD('nonce', FIELD_TYPES.int)
]

interface TxChannelCloseMutual extends TxBase {
  channelId: string
  fromId: string
  initiatorAmountFinal: number
  responderAmountFinal: number
  ttl: number
  fee: number
  nonce: string
}
const CHANNEL_CLOSE_MUTUAL_TX = [
  ...BASE_TX,
  TX_FIELD('channelId', FIELD_TYPES.id, 'ch'),
  TX_FIELD('fromId', FIELD_TYPES.id, 'ak'),
  TX_FIELD('initiatorAmountFinal', FIELD_TYPES.int),
  TX_FIELD('responderAmountFinal', FIELD_TYPES.int),
  TX_FIELD('ttl', FIELD_TYPES.int),
  TX_FIELD('fee', FIELD_TYPES.int),
  TX_FIELD('nonce', FIELD_TYPES.int)
]

interface TxChannelCloseSolo extends TxBase {
  channelId: string
  fromId: string
  payload: string
  ttl: number
  poi: string
  fee: number
  nonce: number
}
const CHANNEL_CLOSE_SOLO_TX = [
  ...BASE_TX,
  TX_FIELD('channelId', FIELD_TYPES.id, 'ch'),
  TX_FIELD('fromId', FIELD_TYPES.id, 'ak'),
  TX_FIELD('payload', FIELD_TYPES.binary, 'tx'),
  TX_FIELD('poi', FIELD_TYPES.binary, 'pi'),
  TX_FIELD('ttl', FIELD_TYPES.int),
  TX_FIELD('fee', FIELD_TYPES.int),
  TX_FIELD('nonce', FIELD_TYPES.int)
]

interface TxChannelSlash extends TxBase {
  channelId: string
  fromId: string
  payload: string
  ttl: number
  poi: string
  fee: number
  nonce: number
}
const CHANNEL_SLASH_TX = [
  ...BASE_TX,
  TX_FIELD('channelId', FIELD_TYPES.id, 'ch'),
  TX_FIELD('fromId', FIELD_TYPES.id, 'ak'),
  TX_FIELD('payload', FIELD_TYPES.binary, 'tx'),
  TX_FIELD('poi', FIELD_TYPES.binary, 'pi'),
  TX_FIELD('ttl', FIELD_TYPES.int),
  TX_FIELD('fee', FIELD_TYPES.int),
  TX_FIELD('nonce', FIELD_TYPES.int)
]

interface TxChannelSettle extends TxBase {
  channelId: string
  fromId: string
  initiatorAmountFinal: number
  responderAmountFinal: number
  ttl: number
  fee: number
  nonce: number
}
const CHANNEL_SETTLE_TX = [
  ...BASE_TX,
  TX_FIELD('channelId', FIELD_TYPES.id, 'ch'),
  TX_FIELD('fromId', FIELD_TYPES.id, 'ak'),
  TX_FIELD('initiatorAmountFinal', FIELD_TYPES.int),
  TX_FIELD('responderAmountFinal', FIELD_TYPES.int),
  TX_FIELD('ttl', FIELD_TYPES.int),
  TX_FIELD('fee', FIELD_TYPES.int),
  TX_FIELD('nonce', FIELD_TYPES.int)
]

interface TxChannelForceProgress extends TxBase {
  channelId: string
  fromId: string
  payload: string
  round: number
  update: string
  stateHash: string
  offChainTrees: string //! Test
  ttl: number
  fee: number
  nonce: number
}
const CHANNEL_FORCE_PROGRESS_TX = [
  ...BASE_TX,
  TX_FIELD('channelId', FIELD_TYPES.id, 'ch'),
  TX_FIELD('fromId', FIELD_TYPES.id, 'ak'),
  TX_FIELD('payload', FIELD_TYPES.binary, 'tx'),
  TX_FIELD('round', FIELD_TYPES.int),
  TX_FIELD('update', FIELD_TYPES.binary, 'cb'),
  TX_FIELD('stateHash', FIELD_TYPES.binary, 'st'),
  TX_FIELD('offChainTrees', FIELD_TYPES.stateTree),
  TX_FIELD('ttl', FIELD_TYPES.int),
  TX_FIELD('fee', FIELD_TYPES.int),
  TX_FIELD('nonce', FIELD_TYPES.int)
]

interface TxChannelOffchain2 extends TxBase {
  channelId: string
  round: number
  stateHash: string
}
const CHANNEL_OFFCHAIN_TX_2 = [
  ...BASE_TX,
  TX_FIELD('channelId', FIELD_TYPES.id, 'ch'),
  TX_FIELD('round', FIELD_TYPES.int),
  TX_FIELD('stateHash', FIELD_TYPES.binary, 'st')
]

interface TxChannel3 extends TxBase {
  initiator: string
  responder: string
  channelAmount: number
  initiatorAmount: number
  responderAmount: number
  channelReserve: number
  initiatorDelegateIds: string[]
  responderDelegateIds: string[]
  stateHash: string
  round: number
  soloRound: number
  lockperiod: number
  lockedUntil: number
  initiatorAuth: string
  responderAuth: string
}
const CHANNEL_TX_3 = [
  ...BASE_TX,
  TX_FIELD('initiator', FIELD_TYPES.id, 'ak'),
  TX_FIELD('responder', FIELD_TYPES.id, 'ak'),
  TX_FIELD('channelAmount', FIELD_TYPES.int),
  TX_FIELD('initiatorAmount', FIELD_TYPES.int),
  TX_FIELD('responderAmount', FIELD_TYPES.int),
  TX_FIELD('channelReserve', FIELD_TYPES.int),
  TX_FIELD('initiatorDelegateIds', FIELD_TYPES.ids),
  TX_FIELD('responderDelegateIds', FIELD_TYPES.ids),
  TX_FIELD('stateHash', FIELD_TYPES.hex),
  TX_FIELD('round', FIELD_TYPES.int),
  TX_FIELD('soloRound', FIELD_TYPES.int),
  TX_FIELD('lockPeriod', FIELD_TYPES.int),
  TX_FIELD('lockedUntil', FIELD_TYPES.int),
  TX_FIELD('initiatorAuth', FIELD_TYPES.binary, 'cb'),
  TX_FIELD('responderAuth', FIELD_TYPES.binary, 'cb')
]

interface TxChannelSnapshotSolo extends TxBase {
  channelId: string
  fromId: string
  payload: string
  ttl: number
  fee: number
  nonce: number
}
const CHANNEL_SNAPSHOT_SOLO_TX = [
  ...BASE_TX,
  TX_FIELD('channelId', FIELD_TYPES.id, 'ch'),
  TX_FIELD('fromId', FIELD_TYPES.id, 'ak'),
  TX_FIELD('payload', FIELD_TYPES.binary, 'tx'),
  TX_FIELD('ttl', FIELD_TYPES.int),
  TX_FIELD('fee', FIELD_TYPES.int),
  TX_FIELD('nonce', FIELD_TYPES.int)
]

interface TxChannelOffchainCreateContract extends TxBase {
  owner: string
  ctVersion: number
  code: string
  deposit: number
  callData: string
}
const CHANNEL_OFFCHAIN_CREATE_CONTRACT_TX = [
  ...BASE_TX,
  TX_FIELD('owner', FIELD_TYPES.id, 'ak'),
  TX_FIELD('ctVersion', FIELD_TYPES.int),
  TX_FIELD('code', FIELD_TYPES.binary, 'cb'),
  TX_FIELD('deposit', FIELD_TYPES.int),
  TX_FIELD('callData', FIELD_TYPES.binary, 'cb')
]

interface TxChannelOffchainCallContract extends TxBase {
  caller: string
  contract: string
  abiVersion: number
  amount: number
  callData: string
  callStack: string
  gasPrice: number
  gasLimit: number
}
const CHANNEL_OFFCHAIN_CALL_CONTRACT_TX = [
  ...BASE_TX,
  TX_FIELD('caller', FIELD_TYPES.id, 'ak'),
  TX_FIELD('contract', FIELD_TYPES.id, 'ct'),
  TX_FIELD('abiVersion', FIELD_TYPES.int),
  TX_FIELD('amount', FIELD_TYPES.int),
  TX_FIELD('callData', FIELD_TYPES.binary, 'cb'),
  TX_FIELD('callStack', FIELD_TYPES.callStack),
  TX_FIELD('gasPrice', FIELD_TYPES.int),
  TX_FIELD('gasLimit', FIELD_TYPES.int)
]

interface TxChannelReconnect extends TxBase {
  channelId: string
  round: number
  role: string
  pubkey: string
}
const CHANNEL_RECONNECT_TX = [
  ...BASE_TX,
  TX_FIELD('channelId', FIELD_TYPES.id, 'ch'),
  TX_FIELD('round', FIELD_TYPES.int),
  TX_FIELD('role', FIELD_TYPES.string),
  TX_FIELD('pubkey', FIELD_TYPES.id, 'ak')
]

interface TxChannelOffchainUpdateTransfer extends TxBase {
  from: string
  to: string
  amount: number
}
const CHANNEL_OFFCHAIN_UPDATE_TRANSFER_TX = [
  ...BASE_TX,
  TX_FIELD('from', FIELD_TYPES.id, 'ak'),
  TX_FIELD('to', FIELD_TYPES.id, 'ak'),
  TX_FIELD('amount', FIELD_TYPES.int)
]

interface TxChannelOffchainUpdateDeposit extends TxBase {
  from: string
  amount: number
}
const CHANNEL_OFFCHAIN_UPDATE_DEPOSIT_TX = [
  ...BASE_TX,
  TX_FIELD('from', FIELD_TYPES.id, 'ak'),
  TX_FIELD('amount', FIELD_TYPES.int)
]

interface TxChannelOffchainUpdateWithdrawal extends TxBase {
  from: string
  amount: number
}
const CHANNEL_OFFCHAIN_UPDATE_WITHDRAWAL_TX = [
  ...BASE_TX,
  TX_FIELD('from', FIELD_TYPES.id, 'ak'),
  TX_FIELD('amount', FIELD_TYPES.int)
]

interface TxProofOfInclusion extends TxBase {
  accounts: MPTree[]
  calls: MPTree[]
  contracts: MPTree[]
  channels: MPTree[]
  ns: MPTree[]
  oracles: MPTree[]
}
const PROOF_OF_INCLUSION_TX = [
  ...BASE_TX,
  TX_FIELD('accounts', FIELD_TYPES.mptrees),
  TX_FIELD('calls', FIELD_TYPES.mptrees),
  TX_FIELD('channels', FIELD_TYPES.mptrees),
  TX_FIELD('contracts', FIELD_TYPES.mptrees),
  TX_FIELD('ns', FIELD_TYPES.mptrees),
  TX_FIELD('oracles', FIELD_TYPES.mptrees)
]

interface TxStateTrees{
  contracts: MPTree[]
  calls: MPTree[]
  channels: MPTree[]
  accounts: MPTree[]
  ns: MPTree[]
  oracles: MPTree[]
}
const STATE_TREES_TX = [
  ...BASE_TX,
  TX_FIELD('contracts', FIELD_TYPES.rlpBinary),
  TX_FIELD('calls', FIELD_TYPES.rlpBinary),
  TX_FIELD('channels', FIELD_TYPES.rlpBinary),
  TX_FIELD('ns', FIELD_TYPES.rlpBinary),
  TX_FIELD('oracles', FIELD_TYPES.rlpBinary),
  TX_FIELD('accounts', FIELD_TYPES.rlpBinary)
]

interface TxMerklePatriciaTree extends TxBase{
  values: Buffer[]
}
const MERKLE_PATRICIA_TREE_TX = [
  ...BASE_TX,
  TX_FIELD('values', FIELD_TYPES.rlpBinaries)
]

interface TxMerklePatriciaTreeValue extends TxBase{
  key: string
  value: string
}
const MERKLE_PATRICIA_TREE_VALUE_TX = [
  ...BASE_TX,
  TX_FIELD('key', FIELD_TYPES.hex),
  TX_FIELD('value', FIELD_TYPES.rawBinary)
]

interface TxContractsTree extends TxBase{
  contracts: Buffer
}
const CONTRACTS_TREE_TX = [
  ...BASE_TX,
  TX_FIELD('contracts', FIELD_TYPES.rlpBinary)
]

interface TxCallsTree extends TxBase{
  calls: Buffer
}
const CONTRACT_CALLS_TREE_TX = [
  ...BASE_TX,
  TX_FIELD('calls', FIELD_TYPES.rlpBinary)
]

interface TxChannelsTree extends TxBase{
  channels: Buffer
}
const CHANNELS_TREE_TX = [
  ...BASE_TX,
  TX_FIELD('channels', FIELD_TYPES.rlpBinary)
]

interface TxNameServiceTree extends TxBase{
  mtree: Buffer
}
const NAMESERVICE_TREE_TX = [
  ...BASE_TX,
  TX_FIELD('mtree', FIELD_TYPES.rlpBinary)
]

interface TxOraclesTree extends TxBase{
  otree: Buffer
}
const ORACLES_TREE_TX = [
  ...BASE_TX,
  TX_FIELD('otree', FIELD_TYPES.rlpBinary)
]

interface TxAccountsTree extends TxBase{
  accounts: Buffer
}
const ACCOUNTS_TREE_TX = [
  ...BASE_TX,
  TX_FIELD('accounts', FIELD_TYPES.rlpBinary)
]

export type TxType = TxAccount | TxSpend | TxSigned
| TxContract | TxContractCall | TxContractCallResult | TxContractCreate | TxGaAttach | TxGaMeta2
| TxNameClaim2 | TxNamePreClaim | TxNameRevoke
| TxNameTransfer | TxNameUpdate | TxOracleExtend | TxOracleQuery
| TxOracleRegister | TxPayingFor | TxOracleRespond | TxChannelCreate2 | TxChannelClose
| TxChannelCloseSolo | TxChannelWithdraw | TxChannelCloseMutual | TxChannelReconnect
| TxChannelSlash | TxChannelSettle | TxChannelOffchainUpdateTransfer
| TxChannelOffchainUpdateDeposit | TxChannelOffchainUpdateWithdrawal
| TxChannelForceProgress | TxChannelOffchain2 | TxChannel3 | TxChannelClose
| TxChannelSnapshotSolo | TxChannelOffchainCreateContract | TxChannelOffchainCallContract
| TxProofOfInclusion | TxStateTrees | TxMerklePatriciaTree | TxMerklePatriciaTreeValue
| TxContractsTree | TxCallsTree | TxChannelsTree | TxNameServiceTree | TxOraclesTree
| TxAccountsTree

interface TxSchema {
  [key: string]: {
    [key: string]: [schema: TxField[], tag:string | number] }
}

export const TX_SERIALIZATION_SCHEMA: TxSchema = {
  [TX_TYPE.account]: {
    2: TX_SCHEMA_FIELD(ACCOUNT_TX_2, OBJECT_TAG_ACCOUNT)
  },
  [TX_TYPE.signed]: {
    1: TX_SCHEMA_FIELD(SIGNED_TX, OBJECT_TAG_SIGNED_TRANSACTION)
  },
  [TX_TYPE.spend]: {
    1: TX_SCHEMA_FIELD(SPEND_TX, OBJECT_TAG_SPEND_TRANSACTION)
  },
  [TX_TYPE.namePreClaim]: {
    1: TX_SCHEMA_FIELD(NAME_PRE_CLAIM_TX, OBJECT_TAG_NAME_SERVICE_PRECLAIM_TRANSACTION)
  },
  [TX_TYPE.nameClaim]: {
    2: TX_SCHEMA_FIELD(NAME_CLAIM_TX_2, OBJECT_TAG_NAME_SERVICE_CLAIM_TRANSACTION)
  },
  [TX_TYPE.nameUpdate]: {
    1: TX_SCHEMA_FIELD(NAME_UPDATE_TX, OBJECT_TAG_NAME_SERVICE_UPDATE_TRANSACTION)
  },
  [TX_TYPE.nameTransfer]: {
    1: TX_SCHEMA_FIELD(NAME_TRANSFER_TX, OBJECT_TAG_NAME_SERVICE_TRANSFER_TRANSACTION)
  },
  [TX_TYPE.nameRevoke]: {
    1: TX_SCHEMA_FIELD(NAME_REVOKE_TX, OBJECT_TAG_NAME_SERVICE_REVOKE_TRANSACTION)
  },
  [TX_TYPE.contract]: {
    1: TX_SCHEMA_FIELD(CONTRACT_TX, OBJECT_TAG_CONTRACT)
  },
  [TX_TYPE.contractCreate]: {
    1: TX_SCHEMA_FIELD(CONTRACT_CREATE_TX, OBJECT_TAG_CONTRACT_CREATE_TRANSACTION)
  },
  [TX_TYPE.contractCall]: {
    1: TX_SCHEMA_FIELD(CONTRACT_CALL_TX, OBJECT_TAG_CONTRACT_CALL_TRANSACTION)
  },
  [TX_TYPE.contractCallResult]: {
    1: TX_SCHEMA_FIELD(CONTRACT_CALL_RESULT_TX, OBJECT_TAG_CONTRACT_CALL)
  },
  [TX_TYPE.oracleRegister]: {
    1: TX_SCHEMA_FIELD(ORACLE_REGISTER_TX, OBJECT_TAG_ORACLE_REGISTER_TRANSACTION)
  },
  [TX_TYPE.oracleExtend]: {
    1: TX_SCHEMA_FIELD(ORACLE_EXTEND_TX, OBJECT_TAG_ORACLE_EXTEND_TRANSACTION)
  },
  [TX_TYPE.oracleQuery]: {
    1: TX_SCHEMA_FIELD(ORACLE_QUERY_TX, OBJECT_TAG_ORACLE_QUERY_TRANSACTION)
  },
  [TX_TYPE.oracleResponse]: {
    1: TX_SCHEMA_FIELD(ORACLE_RESPOND_TX, OBJECT_TAG_ORACLE_RESPONSE_TRANSACTION)
  },
  [TX_TYPE.channelCreate]: {
    2: TX_SCHEMA_FIELD(CHANNEL_CREATE_TX_2, OBJECT_TAG_CHANNEL_CREATE_TX)
  },
  [TX_TYPE.channelCloseMutual]: {
    1: TX_SCHEMA_FIELD(CHANNEL_CLOSE_MUTUAL_TX, OBJECT_TAG_CHANNEL_CLOSE_MUTUAL_TX)
  },
  [TX_TYPE.channelCloseSolo]: {
    1: TX_SCHEMA_FIELD(CHANNEL_CLOSE_SOLO_TX, OBJECT_TAG_CHANNEL_CLOSE_SOLO_TX)
  },
  [TX_TYPE.channelSlash]: {
    1: TX_SCHEMA_FIELD(CHANNEL_SLASH_TX, OBJECT_TAG_CHANNEL_SLASH_TX)
  },
  [TX_TYPE.channelDeposit]: {
    1: TX_SCHEMA_FIELD(CHANNEL_DEPOSIT_TX, OBJECT_TAG_CHANNEL_DEPOSIT_TX)
  },
  [TX_TYPE.channelWithdraw]: {
    1: TX_SCHEMA_FIELD(CHANNEL_WITHDRAW_TX, OBJECT_TAG_CHANNEL_WITHRAW_TX)
  },
  [TX_TYPE.channelSettle]: {
    1: TX_SCHEMA_FIELD(CHANNEL_SETTLE_TX, OBJECT_TAG_CHANNEL_SETTLE_TX)
  },
  [TX_TYPE.channelForceProgress]: {
    1: TX_SCHEMA_FIELD(CHANNEL_FORCE_PROGRESS_TX, OBJECT_TAG_CHANNEL_FORCE_PROGRESS_TX)
  },
  [TX_TYPE.channelOffChain]: {
    2: TX_SCHEMA_FIELD(CHANNEL_OFFCHAIN_TX_2, OBJECT_TAG_CHANNEL_OFFCHAIN_TX)
  },
  [TX_TYPE.channel]: {
    3: TX_SCHEMA_FIELD(CHANNEL_TX_3, OBJECT_TAG_CHANNEL)
  },
  [TX_TYPE.channelSnapshotSolo]: {
    1: TX_SCHEMA_FIELD(CHANNEL_SNAPSHOT_SOLO_TX, OBJECT_TAG_CHANNEL_SNAPSHOT_SOLO_TX)
  },
  [TX_TYPE.channelOffChainUpdateTransfer]: {
    1: TX_SCHEMA_FIELD(
      CHANNEL_OFFCHAIN_UPDATE_TRANSFER_TX, OBJECT_TAG_CHANNEL_OFFCHAIN_UPDATE_TRANSFER_TX
    )
  },
  [TX_TYPE.channelOffChainUpdateDeposit]: {
    1: TX_SCHEMA_FIELD(
      CHANNEL_OFFCHAIN_UPDATE_DEPOSIT_TX, OBJECT_TAG_CHANNEL_OFFCHAIN_UPDATE_DEPOSIT_TX
    )
  },
  [TX_TYPE.channelOffChainUpdateWithdrawal]: {
    1: TX_SCHEMA_FIELD(
      CHANNEL_OFFCHAIN_UPDATE_WITHDRAWAL_TX, OBJECT_TAG_CHANNEL_OFFCHAIN_UPDATE_WITHDRAWAL_TX
    )
  },
  [TX_TYPE.channelOffChainCreateContract]: {
    1: TX_SCHEMA_FIELD(
      CHANNEL_OFFCHAIN_CREATE_CONTRACT_TX, OBJECT_TAG_CHANNEL_OFFCHAIN_CREATE_CONTRACT_TX
    )
  },
  [TX_TYPE.channelOffChainCallContract]: {
    1: TX_SCHEMA_FIELD(
      CHANNEL_OFFCHAIN_CALL_CONTRACT_TX, OBJECT_TAG_CHANNEL_OFFCHAIN_CALL_CONTRACT_TX
    )
  },
  [TX_TYPE.channelReconnect]: {
    1: TX_SCHEMA_FIELD(CHANNEL_RECONNECT_TX, OBJECT_TAG_CHANNEL_RECONNECT_TX)
  },
  [TX_TYPE.proofOfInclusion]: {
    1: TX_SCHEMA_FIELD(PROOF_OF_INCLUSION_TX, OBJECT_TAG_PROOF_OF_INCLUSION)
  },
  [TX_TYPE.stateTrees]: {
    1: TX_SCHEMA_FIELD(STATE_TREES_TX, OBJECT_TAG_STATE_TREES)
  },
  [TX_TYPE.merklePatriciaTree]: {
    1: TX_SCHEMA_FIELD(MERKLE_PATRICIA_TREE_TX, OBJECT_TAG_MERKLE_PATRICIA_TREE)
  },
  [TX_TYPE.merklePatriciaTreeValue]: {
    1: TX_SCHEMA_FIELD(MERKLE_PATRICIA_TREE_VALUE_TX, OBJECT_TAG_MERKLE_PATRICIA_TREE_VALUE)
  },
  [TX_TYPE.contractsTree]: {
    1: TX_SCHEMA_FIELD(CONTRACTS_TREE_TX, OBJECT_TAG_CONTRACTS_TREE)
  },
  [TX_TYPE.contractCallsTree]: {
    1: TX_SCHEMA_FIELD(CONTRACT_CALLS_TREE_TX, OBJECT_TAG_CONTRACT_CALLS_TREE)
  },
  [TX_TYPE.channelsTree]: {
    1: TX_SCHEMA_FIELD(CHANNELS_TREE_TX, OBJECT_TAG_CHANNELS_TREE)
  },
  [TX_TYPE.nameserviceTree]: {
    1: TX_SCHEMA_FIELD(NAMESERVICE_TREE_TX, OBJECT_TAG_NAMESERVICE_TREE)
  },
  [TX_TYPE.oraclesTree]: {
    1: TX_SCHEMA_FIELD(ORACLES_TREE_TX, OBJECT_TAG_ORACLES_TREE)
  },
  [TX_TYPE.accountsTree]: {
    1: TX_SCHEMA_FIELD(ACCOUNTS_TREE_TX, OBJECT_TAG_ACCOUNTS_TREE)
  },
  [TX_TYPE.gaAttach]: {
    1: TX_SCHEMA_FIELD(GA_ATTACH_TX, OBJECT_TAG_GA_ATTACH)
  },
  [TX_TYPE.gaMeta]: {
    2: TX_SCHEMA_FIELD(GA_META_TX_2, OBJECT_TAG_GA_META)
  },
  [TX_TYPE.payingFor]: {
    1: TX_SCHEMA_FIELD(PAYING_FOR_TX, OBJECT_TAG_PAYING_FOR)
  }
}

export const TX_DESERIALIZATION_SCHEMA: TxSchema = {
  [OBJECT_TAG_ACCOUNT]: {
    2: TX_SCHEMA_FIELD(ACCOUNT_TX_2, OBJECT_TAG_ACCOUNT)
  },
  [OBJECT_TAG_SIGNED_TRANSACTION]: {
    1: TX_SCHEMA_FIELD(SIGNED_TX, OBJECT_TAG_SIGNED_TRANSACTION)
  },
  [OBJECT_TAG_SPEND_TRANSACTION]: {
    1: TX_SCHEMA_FIELD(SPEND_TX, OBJECT_TAG_SPEND_TRANSACTION)
  },
  [OBJECT_TAG_NAME_SERVICE_PRECLAIM_TRANSACTION]: {
    1: TX_SCHEMA_FIELD(NAME_PRE_CLAIM_TX, OBJECT_TAG_NAME_SERVICE_PRECLAIM_TRANSACTION)
  },
  [OBJECT_TAG_NAME_SERVICE_CLAIM_TRANSACTION]: {
    2: TX_SCHEMA_FIELD(NAME_CLAIM_TX_2, OBJECT_TAG_NAME_SERVICE_CLAIM_TRANSACTION)
  },
  [OBJECT_TAG_NAME_SERVICE_UPDATE_TRANSACTION]: {
    1: TX_SCHEMA_FIELD(NAME_UPDATE_TX, OBJECT_TAG_NAME_SERVICE_UPDATE_TRANSACTION)
  },
  [OBJECT_TAG_NAME_SERVICE_TRANSFER_TRANSACTION]: {
    1: TX_SCHEMA_FIELD(NAME_TRANSFER_TX, OBJECT_TAG_NAME_SERVICE_TRANSFER_TRANSACTION)
  },
  [OBJECT_TAG_NAME_SERVICE_REVOKE_TRANSACTION]: {
    1: TX_SCHEMA_FIELD(NAME_REVOKE_TX, OBJECT_TAG_NAME_SERVICE_REVOKE_TRANSACTION)
  },
  [OBJECT_TAG_CONTRACT]: {
    1: TX_SCHEMA_FIELD(CONTRACT_TX, OBJECT_TAG_CONTRACT)
  },
  [OBJECT_TAG_CONTRACT_CREATE_TRANSACTION]: {
    1: TX_SCHEMA_FIELD(CONTRACT_CREATE_TX, OBJECT_TAG_CONTRACT_CREATE_TRANSACTION)
  },
  [OBJECT_TAG_CONTRACT_CALL_TRANSACTION]: {
    1: TX_SCHEMA_FIELD(CONTRACT_CALL_TX, OBJECT_TAG_CONTRACT_CALL_TRANSACTION)
  },
  [OBJECT_TAG_CONTRACT_CALL]: {
    1: TX_SCHEMA_FIELD(CONTRACT_CALL_RESULT_TX, OBJECT_TAG_CONTRACT_CALL)
  },
  [OBJECT_TAG_ORACLE_REGISTER_TRANSACTION]: {
    1: TX_SCHEMA_FIELD(ORACLE_REGISTER_TX, OBJECT_TAG_ORACLE_REGISTER_TRANSACTION)
  },
  [OBJECT_TAG_ORACLE_EXTEND_TRANSACTION]: {
    1: TX_SCHEMA_FIELD(ORACLE_EXTEND_TX, OBJECT_TAG_ORACLE_EXTEND_TRANSACTION)
  },
  [OBJECT_TAG_ORACLE_QUERY_TRANSACTION]: {
    1: TX_SCHEMA_FIELD(ORACLE_QUERY_TX, OBJECT_TAG_ORACLE_QUERY_TRANSACTION)
  },
  [OBJECT_TAG_ORACLE_RESPONSE_TRANSACTION]: {
    1: TX_SCHEMA_FIELD(ORACLE_RESPOND_TX, OBJECT_TAG_ORACLE_RESPONSE_TRANSACTION)
  },
  [OBJECT_TAG_CHANNEL_CREATE_TX]: {
    2: TX_SCHEMA_FIELD(CHANNEL_CREATE_TX_2, OBJECT_TAG_CHANNEL_CREATE_TX)
  },
  [OBJECT_TAG_CHANNEL_CLOSE_MUTUAL_TX]: {
    1: TX_SCHEMA_FIELD(CHANNEL_CLOSE_MUTUAL_TX, OBJECT_TAG_CHANNEL_CLOSE_MUTUAL_TX)
  },
  [OBJECT_TAG_CHANNEL_CLOSE_SOLO_TX]: {
    1: TX_SCHEMA_FIELD(CHANNEL_CLOSE_SOLO_TX, OBJECT_TAG_CHANNEL_CLOSE_SOLO_TX)
  },
  [OBJECT_TAG_CHANNEL_SLASH_TX]: {
    1: TX_SCHEMA_FIELD(CHANNEL_SLASH_TX, OBJECT_TAG_CHANNEL_SLASH_TX)
  },
  [OBJECT_TAG_CHANNEL_DEPOSIT_TX]: {
    1: TX_SCHEMA_FIELD(CHANNEL_DEPOSIT_TX, OBJECT_TAG_CHANNEL_DEPOSIT_TX)
  },
  [OBJECT_TAG_CHANNEL_WITHRAW_TX]: {
    1: TX_SCHEMA_FIELD(CHANNEL_WITHDRAW_TX, OBJECT_TAG_CHANNEL_WITHRAW_TX)
  },
  [OBJECT_TAG_CHANNEL_SETTLE_TX]: {
    1: TX_SCHEMA_FIELD(CHANNEL_SETTLE_TX, OBJECT_TAG_CHANNEL_SETTLE_TX)
  },
  [OBJECT_TAG_CHANNEL_OFFCHAIN_TX]: {
    2: TX_SCHEMA_FIELD(CHANNEL_OFFCHAIN_TX_2, OBJECT_TAG_CHANNEL_OFFCHAIN_TX)
  },
  [OBJECT_TAG_CHANNEL]: {
    3: TX_SCHEMA_FIELD(CHANNEL_TX_3, OBJECT_TAG_CHANNEL)
  },
  [OBJECT_TAG_CHANNEL_SNAPSHOT_SOLO_TX]: {
    1: TX_SCHEMA_FIELD(CHANNEL_SNAPSHOT_SOLO_TX, OBJECT_TAG_CHANNEL_SNAPSHOT_SOLO_TX)
  },
  [OBJECT_TAG_CHANNEL_OFFCHAIN_UPDATE_TRANSFER_TX]: {
    1: TX_SCHEMA_FIELD(
      CHANNEL_OFFCHAIN_UPDATE_TRANSFER_TX, OBJECT_TAG_CHANNEL_OFFCHAIN_UPDATE_TRANSFER_TX
    )
  },
  [OBJECT_TAG_CHANNEL_OFFCHAIN_UPDATE_DEPOSIT_TX]: {
    1: TX_SCHEMA_FIELD(
      CHANNEL_OFFCHAIN_UPDATE_DEPOSIT_TX, OBJECT_TAG_CHANNEL_OFFCHAIN_UPDATE_DEPOSIT_TX
    )
  },
  [OBJECT_TAG_CHANNEL_OFFCHAIN_UPDATE_WITHDRAWAL_TX]: {
    1: TX_SCHEMA_FIELD(
      CHANNEL_OFFCHAIN_UPDATE_WITHDRAWAL_TX, OBJECT_TAG_CHANNEL_OFFCHAIN_UPDATE_WITHDRAWAL_TX
    )
  },
  [OBJECT_TAG_CHANNEL_OFFCHAIN_CREATE_CONTRACT_TX]: {
    1: TX_SCHEMA_FIELD(
      CHANNEL_OFFCHAIN_CREATE_CONTRACT_TX, OBJECT_TAG_CHANNEL_OFFCHAIN_CREATE_CONTRACT_TX
    )
  },
  [OBJECT_TAG_CHANNEL_OFFCHAIN_CALL_CONTRACT_TX]: {
    1: TX_SCHEMA_FIELD(
      CHANNEL_OFFCHAIN_CALL_CONTRACT_TX, OBJECT_TAG_CHANNEL_OFFCHAIN_CALL_CONTRACT_TX
    )
  },
  [OBJECT_TAG_CHANNEL_RECONNECT_TX]: {
    1: TX_SCHEMA_FIELD(CHANNEL_RECONNECT_TX, OBJECT_TAG_CHANNEL_RECONNECT_TX)
  },
  [OBJECT_TAG_PROOF_OF_INCLUSION]: {
    1: TX_SCHEMA_FIELD(PROOF_OF_INCLUSION_TX, OBJECT_TAG_PROOF_OF_INCLUSION)
  },
  [OBJECT_TAG_STATE_TREES]: {
    1: TX_SCHEMA_FIELD(STATE_TREES_TX, OBJECT_TAG_STATE_TREES)
  },
  [OBJECT_TAG_MERKLE_PATRICIA_TREE]: {
    1: TX_SCHEMA_FIELD(MERKLE_PATRICIA_TREE_TX, OBJECT_TAG_MERKLE_PATRICIA_TREE)
  },
  [OBJECT_TAG_MERKLE_PATRICIA_TREE_VALUE]: {
    1: TX_SCHEMA_FIELD(MERKLE_PATRICIA_TREE_VALUE_TX, OBJECT_TAG_MERKLE_PATRICIA_TREE_VALUE)
  },
  [OBJECT_TAG_CONTRACTS_TREE]: {
    1: TX_SCHEMA_FIELD(CONTRACTS_TREE_TX, OBJECT_TAG_CONTRACTS_TREE)
  },
  [OBJECT_TAG_CONTRACT_CALLS_TREE]: {
    1: TX_SCHEMA_FIELD(CONTRACT_CALLS_TREE_TX, OBJECT_TAG_CONTRACT_CALLS_TREE)
  },
  [OBJECT_TAG_CHANNELS_TREE]: {
    1: TX_SCHEMA_FIELD(CHANNELS_TREE_TX, OBJECT_TAG_CHANNELS_TREE)
  },
  [OBJECT_TAG_NAMESERVICE_TREE]: {
    1: TX_SCHEMA_FIELD(NAMESERVICE_TREE_TX, OBJECT_TAG_NAMESERVICE_TREE)
  },
  [OBJECT_TAG_ORACLES_TREE]: {
    1: TX_SCHEMA_FIELD(ORACLES_TREE_TX, OBJECT_TAG_ORACLES_TREE)
  },
  [OBJECT_TAG_ACCOUNTS_TREE]: {
    1: TX_SCHEMA_FIELD(ACCOUNTS_TREE_TX, OBJECT_TAG_ACCOUNTS_TREE)
  },
  [OBJECT_TAG_GA_ATTACH]: {
    1: TX_SCHEMA_FIELD(GA_ATTACH_TX, OBJECT_TAG_GA_ATTACH)
  },
  [OBJECT_TAG_GA_META]: {
    2: TX_SCHEMA_FIELD(GA_META_TX_2, OBJECT_TAG_GA_META)
  },
  [OBJECT_TAG_PAYING_FOR]: {
    1: TX_SCHEMA_FIELD(PAYING_FOR_TX, OBJECT_TAG_PAYING_FOR)
  },
  [OBJECT_TAG_CHANNEL_FORCE_PROGRESS_TX]: {
    1: TX_SCHEMA_FIELD(CHANNEL_FORCE_PROGRESS_TX, OBJECT_TAG_CHANNEL_FORCE_PROGRESS_TX)
  },
  [OBJECT_TAG_SOPHIA_BYTE_CODE]: {
    3: TX_SCHEMA_FIELD(CONTRACT_BYTE_CODE_LIMA, OBJECT_TAG_SOPHIA_BYTE_CODE)
  }
}
