/**
 * Transaction Schema for TxBuilder
 * @module @aeternity/aepp-sdk/es/tx/builder/schema
 * @export TxSchema
 * @example import { SCHEMA } from '@aeternity/aepp-sdk'
 */
// # RLP version number
// # https://github.com/aeternity/protocol/blob/master/serializations.md#binary-serialization

import BigNumber from 'bignumber.js'
import { Name, NameId, NameFee, Deposit } from './field-types'

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

const TX_FIELD = (name, type, prefix) => [name, type, prefix]
const TX_SCHEMA_FIELD = (schema, objectId) => [schema, objectId]

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

// MAP WITH FEE CALCULATION https://github.com/aeternity/protocol/blob/master/consensus/consensus.md#gas
export const TX_FEE_BASE_GAS = (txType) => {
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
  })[txType] || 1
  return new BigNumber(factor * BASE_GAS)
}

export const TX_FEE_OTHER_GAS = (txType, txSize, { relativeTtl, innerTxSize }) => {
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

const ACCOUNT_TX_2 = [
  ...BASE_TX,
  TX_FIELD('flags', FIELD_TYPES.int),
  TX_FIELD('nonce', FIELD_TYPES.int),
  TX_FIELD('balance', FIELD_TYPES.int),
  TX_FIELD('gaContract', FIELD_TYPES.id, ['ct', 'nm']),
  TX_FIELD('gaAuthFun', FIELD_TYPES.binary, 'cb')
]

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

const SIGNED_TX = [
  ...BASE_TX,
  TX_FIELD('signatures', FIELD_TYPES.signatures),
  TX_FIELD('encodedTx', FIELD_TYPES.rlpBinary)
]

const NAME_PRE_CLAIM_TX = [
  ...BASE_TX,
  TX_FIELD('accountId', FIELD_TYPES.id, 'ak'),
  TX_FIELD('nonce', FIELD_TYPES.int),
  TX_FIELD('commitmentId', FIELD_TYPES.id, 'cm'),
  TX_FIELD('fee', FIELD_TYPES.int),
  TX_FIELD('ttl', FIELD_TYPES.int)
]

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

const NAME_TRANSFER_TX = [
  ...BASE_TX,
  TX_FIELD('accountId', FIELD_TYPES.id, 'ak'),
  TX_FIELD('nonce', FIELD_TYPES.int),
  TX_FIELD('nameId', NameId),
  TX_FIELD('recipientId', FIELD_TYPES.id, ['ak', 'nm']),
  TX_FIELD('fee', FIELD_TYPES.int),
  TX_FIELD('ttl', FIELD_TYPES.int)
]

const NAME_REVOKE_TX = [
  ...BASE_TX,
  TX_FIELD('accountId', FIELD_TYPES.id, 'ak'),
  TX_FIELD('nonce', FIELD_TYPES.int),
  TX_FIELD('nameId', NameId),
  TX_FIELD('fee', FIELD_TYPES.int),
  TX_FIELD('ttl', FIELD_TYPES.int)
]

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

const PAYING_FOR_TX = [
  ...BASE_TX,
  TX_FIELD('payerId', FIELD_TYPES.id, 'ak'),
  TX_FIELD('nonce', FIELD_TYPES.int),
  TX_FIELD('fee', FIELD_TYPES.int),
  TX_FIELD('tx', FIELD_TYPES.rlpBinary)
]

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

const ORACLE_EXTEND_TX = [
  ...BASE_TX,
  TX_FIELD('oracleId', FIELD_TYPES.id, ['ok', 'nm']),
  TX_FIELD('nonce', FIELD_TYPES.int),
  TX_FIELD('oracleTtlType', FIELD_TYPES.int),
  TX_FIELD('oracleTtlValue', FIELD_TYPES.int),
  TX_FIELD('fee', FIELD_TYPES.int),
  TX_FIELD('ttl', FIELD_TYPES.int)
]

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

const CHANNEL_OFFCHAIN_TX_2 = [
  ...BASE_TX,
  TX_FIELD('channelId', FIELD_TYPES.id, 'ch'),
  TX_FIELD('round', FIELD_TYPES.int),
  TX_FIELD('stateHash', FIELD_TYPES.binary, 'st')
]

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

const CHANNEL_SNAPSHOT_SOLO_TX = [
  ...BASE_TX,
  TX_FIELD('channelId', FIELD_TYPES.id, 'ch'),
  TX_FIELD('fromId', FIELD_TYPES.id, 'ak'),
  TX_FIELD('payload', FIELD_TYPES.binary, 'tx'),
  TX_FIELD('ttl', FIELD_TYPES.int),
  TX_FIELD('fee', FIELD_TYPES.int),
  TX_FIELD('nonce', FIELD_TYPES.int)
]

const CHANNEL_OFFCHAIN_CREATE_CONTRACT_TX = [
  ...BASE_TX,
  TX_FIELD('owner', FIELD_TYPES.id, 'ak'),
  TX_FIELD('ctVersion', FIELD_TYPES.int),
  TX_FIELD('code', FIELD_TYPES.binary, 'cb'),
  TX_FIELD('deposit', FIELD_TYPES.int),
  TX_FIELD('callData', FIELD_TYPES.binary, 'cb')
]

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

const CHANNEL_RECONNECT_TX = [
  ...BASE_TX,
  TX_FIELD('channelId', FIELD_TYPES.id, 'ch'),
  TX_FIELD('round', FIELD_TYPES.int),
  TX_FIELD('role', FIELD_TYPES.string),
  TX_FIELD('pubkey', FIELD_TYPES.id, 'ak')
]

const CHANNEL_OFFCHAIN_UPDATE_TRANSFER_TX = [
  ...BASE_TX,
  TX_FIELD('from', FIELD_TYPES.id, 'ak'),
  TX_FIELD('to', FIELD_TYPES.id, 'ak'),
  TX_FIELD('amount', FIELD_TYPES.int)
]

const CHANNEL_OFFCHAIN_UPDATE_DEPOSIT_TX = [
  ...BASE_TX,
  TX_FIELD('from', FIELD_TYPES.id, 'ak'),
  TX_FIELD('amount', FIELD_TYPES.int)
]

const CHANNEL_OFFCHAIN_UPDATE_WITHDRAWAL_TX = [
  ...BASE_TX,
  TX_FIELD('from', FIELD_TYPES.id, 'ak'),
  TX_FIELD('amount', FIELD_TYPES.int)
]

const PROOF_OF_INCLUSION_TX = [
  ...BASE_TX,
  TX_FIELD('accounts', FIELD_TYPES.mptrees),
  TX_FIELD('calls', FIELD_TYPES.mptrees),
  TX_FIELD('channels', FIELD_TYPES.mptrees),
  TX_FIELD('contracts', FIELD_TYPES.mptrees),
  TX_FIELD('ns', FIELD_TYPES.mptrees),
  TX_FIELD('oracles', FIELD_TYPES.mptrees)
]

const STATE_TREES_TX = [
  ...BASE_TX,
  TX_FIELD('contracts', FIELD_TYPES.rlpBinary),
  TX_FIELD('calls', FIELD_TYPES.rlpBinary),
  TX_FIELD('channels', FIELD_TYPES.rlpBinary),
  TX_FIELD('ns', FIELD_TYPES.rlpBinary),
  TX_FIELD('oracles', FIELD_TYPES.rlpBinary),
  TX_FIELD('accounts', FIELD_TYPES.rlpBinary)
]

const MERKLE_PATRICIA_TREE_TX = [
  ...BASE_TX,
  TX_FIELD('values', FIELD_TYPES.rlpBinaries)
]

const MERKLE_PATRICIA_TREE_VALUE_TX = [
  ...BASE_TX,
  TX_FIELD('key', FIELD_TYPES.hex),
  TX_FIELD('value', FIELD_TYPES.rawBinary)
]

const CONTRACTS_TREE_TX = [
  ...BASE_TX,
  TX_FIELD('contracts', FIELD_TYPES.rlpBinary)
]

const CONTRACT_CALLS_TREE_TX = [
  ...BASE_TX,
  TX_FIELD('calls', FIELD_TYPES.rlpBinary)
]

const CHANNELS_TREE_TX = [
  ...BASE_TX,
  TX_FIELD('channels', FIELD_TYPES.rlpBinary)
]

const NAMESERVICE_TREE_TX = [
  ...BASE_TX,
  TX_FIELD('mtree', FIELD_TYPES.rlpBinary)
]

const ORACLES_TREE_TX = [
  ...BASE_TX,
  TX_FIELD('otree', FIELD_TYPES.rlpBinary)
]

const ACCOUNTS_TREE_TX = [
  ...BASE_TX,
  TX_FIELD('accounts', FIELD_TYPES.rlpBinary)
]

export const TX_SERIALIZATION_SCHEMA = {
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

export const TX_DESERIALIZATION_SCHEMA = {
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
