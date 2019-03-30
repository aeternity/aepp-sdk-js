/**
 * Transaction Schema for TxBuilder
 * @module @aeternity/aepp-sdk/es/tx/builder/schema
 * @export TxSchema
 * @example import TxSchema from '@aeternity/aepp-sdk/es/tx/builder/schema'
 */
/* eslint-disable no-unused-vars */
// # RLP version number
// # https://github.com/aeternity/protocol/blob/master/serializations.md#binary-serialization

import BigNumber from 'bignumber.js'

export const VSN = 1

// # Tag constant for ids (type uint8)
// # see https://github.com/aeternity/protocol/blob/master/serializations.md#the-id-type
// # <<Tag:1/unsigned-integer-unit:8, Hash:32/binary-unit:8>>
const ID_TAG_ACCOUNT = 1
const ID_TAG_NAME = 2
const ID_TAG_COMMITMENT = 3
const ID_TAG_ORACLE = 4
const ID_TAG_CONTRACT = 5
const ID_TAG_CHANNEL = 6

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
const OBJECT_TAG_CONTRACT_CREATE_TRANSACTION = 42
const OBJECT_TAG_CONTRACT_CALL_TRANSACTION = 43
const OBJECT_TAG_CHANNEL_CREATE_TX = 50
const OBJECT_TAG_CHANNEL_DEPOSIT_TX = 51
const OBJECT_TAG_CHANNEL_WITHRAW_TX = 52
const OBJECT_TAG_CHANNEL_CLOSE_MUTUAL_TX = 53
const OBJECT_TAG_CHANNEL_CLOSE_SOLO_TX = 54
const OBJECT_TAG_CHANNEL_SLASH_TX = 55
const OBJECT_TAG_CHANNEL_SETTLE_TX = 56
const OBJECT_TAG_CHANNEL_OFFCHAIN_TX = 57
const OBJECT_TAG_CHANNEL_OFFCHAIN_UPDATE_TRANSFER_TX = 570
const OBJECT_TAG_CHANNEL_OFFCHAIN_UPDATE_DEPOSIT_TX = 571
const OBJECT_TAG_CHANNEL_OFFCHAIN_UPDATE_WITHDRAWAL_TX = 572
const OBJECT_TAG_CHANNEL_OFFCHAIN_CREATE_CONTRACT_TX = 573
const OBJECT_TAG_CHANNEL_OFFCHAIN_CALL_CONTRACT_TX = 574
const OBJECT_TAG_PROOF_OF_INCLUSION = 60
const OBJECT_TAG_STATE_TREES = 62
const OBJECT_TAG_MERKLE_PATRICIA_TREE = 63
const OBJECT_TAG_MERKLE_PATRICIA_TREE_VALUE = 64
const OBJECT_TAG_CONTRACTS_TREE = 621
const OBJECT_TAG_CONTRACT_CALLS_TREE = 622

const TX_FIELD = (name, type, prefix) => [name, type, prefix]
const TX_SCHEMA_FIELD = (schema, objectId) => [schema, objectId]

// # see https://github.com/aeternity/protocol/blob/minerva/contracts/contract_vms.md#virtual-machines-on-the-%C3%A6ternity-blockchain
const VM_VERSIONS = {
  NO_VM: 0,
  SOPHIA: 1,
  SOLIDITY: 2,
  SOPHIA_IMPROVEMENTS: 3
}
// # see https://github.com/aeternity/protocol/blob/minerva/contracts/contract_vms.md#virtual-machines-on-the-%C3%A6ternity-blockchain
const ABI_VERSIONS = {
  NO_ABI: 0,
  SOPHIA: 1,
  SOLIDITY: 2
}

const revertObject = (obj) => Object.entries(obj).reduce((acc, [key, v]) => (acc[v] = key) && acc, {})

/**
 * @constant
 * @description Object with transaction types
 * @type {Object} TX_TYPE
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
  channelOffChainUpdateTransfer: 'channelOffChainUpdateTransfer',
  channelOffChainUpdateDeposit: 'channelOffChainUpdateDeposit',
  channelOffChainUpdateWithdrawal: 'channelOffChainUpdateWithdrawal',
  channelOffChainCreateContract: 'channelOffChainCreateContract',
  channelOffChainCallContract: 'channelOffChainCallContract',
  proofOfInclusion: 'proofOfInclusion',
  stateTrees: 'stateTrees',
  merklePatriciaTree: 'merklePatriciaTree',
  merklePatriciaTreeValue: 'merklePatriciaTreeValue',
  contractsTree: 'contractsTree',
  contractCallsTree: 'contractCallsTree'
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
  [OBJECT_TAG_CHANNEL_DEPOSIT_TX]: TX_TYPE.channelDeposit,
  [OBJECT_TAG_CHANNEL_WITHRAW_TX]: TX_TYPE.channelWithdraw,
  [OBJECT_TAG_CHANNEL_SETTLE_TX]: TX_TYPE.channelSettle,
  [OBJECT_TAG_CHANNEL_OFFCHAIN_TX]: TX_TYPE.channelOffChain,
  [OBJECT_TAG_CHANNEL_OFFCHAIN_UPDATE_TRANSFER_TX]: TX_TYPE.channelOffChainUpdateTransfer,
  [OBJECT_TAG_CHANNEL_OFFCHAIN_UPDATE_DEPOSIT_TX]: TX_TYPE.channelOffChainUpdateDeposit,
  [OBJECT_TAG_CHANNEL_OFFCHAIN_UPDATE_WITHDRAWAL_TX]: TX_TYPE.channelOffChainUpdateWithdrawal,
  [OBJECT_TAG_CHANNEL_OFFCHAIN_CREATE_CONTRACT_TX]: TX_TYPE.channelOffChainCreateContract,
  [OBJECT_TAG_CHANNEL_OFFCHAIN_CALL_CONTRACT_TX]: TX_TYPE.channelOffChainCallContract,
  [OBJECT_TAG_PROOF_OF_INCLUSION]: TX_TYPE.proofOfInclusion,
  [OBJECT_TAG_STATE_TREES]: TX_TYPE.stateTrees,
  [OBJECT_TAG_MERKLE_PATRICIA_TREE]: TX_TYPE.merklePatriciaTree,
  [OBJECT_TAG_MERKLE_PATRICIA_TREE_VALUE]: TX_TYPE.merklePatriciaTreeValue,
  [OBJECT_TAG_CONTRACTS_TREE]: TX_TYPE.contractsTree,
  [OBJECT_TAG_CONTRACT_CALLS_TREE]: TX_TYPE.contractCallsTree
}

export const FIELD_TYPES = {
  int: 'int',
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
  mptree: 'mptree'
}

// FEE CALCULATION
export const BASE_GAS = 15000
export const GAS_PER_BYTE = 20
export const FEE_BYTE_SIZE = 8
export const DEFAULT_FEE = 20000
export const KEY_BLOCK_INTERVAL = 3

// MAP WITH FEE CALCULATION https://github.com/aeternity/protocol/blob/master/consensus/consensus.md#gas
export const TX_FEE_BASE_GAS = (txType) => (gas) => {
  switch (txType) {
    case TX_TYPE.contractCreate:
      return BigNumber(5 * BASE_GAS).plus(gas)
    case TX_TYPE.contractCall:
      return BigNumber(30 * BASE_GAS).plus(gas)
    default:
      return BigNumber(BASE_GAS)
  }
}

export const TX_FEE_OTHER_GAS = (txType) => ({ txSize, relativeTtl }) => {
  switch (txType) {
    case TX_TYPE.oracleRegister:
    case TX_TYPE.oracleExtend:
    case TX_TYPE.oracleQuery:
    case TX_TYPE.oracleResponse:
      return BigNumber(txSize + FEE_BYTE_SIZE)
        .times(GAS_PER_BYTE)
        .plus(
          Math.ceil(32000 * relativeTtl / Math.floor(60 * 24 * 365 / KEY_BLOCK_INTERVAL))
        )
    default:
      return BigNumber(txSize + FEE_BYTE_SIZE).times(GAS_PER_BYTE)
  }
}

export const ID_TAG = {
  account: ID_TAG_ACCOUNT,
  name: ID_TAG_NAME,
  commitment: ID_TAG_COMMITMENT,
  oracle: ID_TAG_ORACLE,
  contract: ID_TAG_CONTRACT,
  channel: ID_TAG_CHANNEL
}
export const PREFIX_ID_TAG = {
  'ak': ID_TAG.account,
  'nm': ID_TAG.name,
  'cm': ID_TAG.commitment,
  'ok': ID_TAG.oracle,
  'ct': ID_TAG.contract,
  'ch': ID_TAG.channel
}
export const ID_TAG_PREFIX = revertObject(PREFIX_ID_TAG)
const VALIDATION_ERROR = (msg) => msg

export const VALIDATION_MESSAGE = {
  [FIELD_TYPES.int]: ({ value }) => VALIDATION_ERROR(`${value} is not of type Number or BigNumber`),
  [FIELD_TYPES.id]: ({ value, prefix }) => VALIDATION_ERROR(`'${value}' prefix doesn't match expected prefix '${prefix}' or ID_TAG for prefix not found`),
  [FIELD_TYPES.binary]: ({ prefix, value }) => VALIDATION_ERROR(`'${value}' prefix doesn't match expected prefix '${prefix}'`),
  [FIELD_TYPES.string]: ({ value }) => VALIDATION_ERROR(`Not a string`),
  [FIELD_TYPES.pointers]: ({ value }) => VALIDATION_ERROR(`Value must be of type Array and contains only object's like '{key: "account_pubkey", id: "ak_lkamsflkalsdalksdlasdlasdlamd"}'`)
}

const BASE_TX = [
  TX_FIELD('tag', FIELD_TYPES.int),
  TX_FIELD('VSN', FIELD_TYPES.int)
]

const ACCOUNT_TX = [
  ...BASE_TX,
  TX_FIELD('nonce', FIELD_TYPES.int),
  TX_FIELD('balance', FIELD_TYPES.int)
]

const SPEND_TX = [
  ...BASE_TX,
  TX_FIELD('senderId', FIELD_TYPES.id, 'ak'),
  TX_FIELD('recipientId', FIELD_TYPES.id, 'ak'),
  TX_FIELD('amount', FIELD_TYPES.int),
  TX_FIELD('fee', FIELD_TYPES.int),
  TX_FIELD('ttl', FIELD_TYPES.int),
  TX_FIELD('nonce', FIELD_TYPES.int),
  TX_FIELD('payload', FIELD_TYPES.string)
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

const NAME_CLAIM_TX = [
  ...BASE_TX,
  TX_FIELD('accountId', FIELD_TYPES.id, 'ak'),
  TX_FIELD('nonce', FIELD_TYPES.int),
  TX_FIELD('name', FIELD_TYPES.binary, 'nm'),
  TX_FIELD('nameSalt', FIELD_TYPES.int),
  TX_FIELD('fee', FIELD_TYPES.int),
  TX_FIELD('ttl', FIELD_TYPES.int)
]

const NAME_UPDATE_TX = [
  ...BASE_TX,
  TX_FIELD('accountId', FIELD_TYPES.id, 'ak'),
  TX_FIELD('nonce', FIELD_TYPES.int),
  TX_FIELD('nameId', FIELD_TYPES.id, 'nm'),
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
  TX_FIELD('nameId', FIELD_TYPES.id, 'nm'),
  TX_FIELD('recipientId', FIELD_TYPES.id, 'ak'),
  TX_FIELD('fee', FIELD_TYPES.int),
  TX_FIELD('ttl', FIELD_TYPES.int)
]

const NAME_REVOKE_TX = [
  ...BASE_TX,
  TX_FIELD('accountId', FIELD_TYPES.id, 'ak'),
  TX_FIELD('nonce', FIELD_TYPES.int),
  TX_FIELD('nameId', FIELD_TYPES.id, 'nm'),
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
  TX_FIELD('deposit', FIELD_TYPES.int)
]

const CONTRACT_CREATE_TX = [
  ...BASE_TX,
  TX_FIELD('ownerId', FIELD_TYPES.id, 'ak'),
  TX_FIELD('nonce', FIELD_TYPES.int),
  TX_FIELD('code', FIELD_TYPES.binary, 'cb'),
  TX_FIELD('vmVersion', FIELD_TYPES.int),
  TX_FIELD('fee', FIELD_TYPES.int),
  TX_FIELD('ttl', FIELD_TYPES.int),
  TX_FIELD('deposit', FIELD_TYPES.int),
  TX_FIELD('amount', FIELD_TYPES.int),
  TX_FIELD('gas', FIELD_TYPES.int),
  TX_FIELD('gasPrice', FIELD_TYPES.int),
  TX_FIELD('callData', FIELD_TYPES.binary, 'cb')
]

const CONTRACT_CALL_TX = [
  ...BASE_TX,
  TX_FIELD('callerId', FIELD_TYPES.id, 'ak'),
  TX_FIELD('nonce', FIELD_TYPES.int),
  TX_FIELD('contractId', FIELD_TYPES.id, 'ct'),
  TX_FIELD('vmVersion', FIELD_TYPES.int),
  TX_FIELD('fee', FIELD_TYPES.int),
  TX_FIELD('ttl', FIELD_TYPES.int),
  TX_FIELD('amount', FIELD_TYPES.int),
  TX_FIELD('gas', FIELD_TYPES.int),
  TX_FIELD('gasPrice', FIELD_TYPES.int),
  TX_FIELD('callData', FIELD_TYPES.binary, 'cb')
]

const ORACLE_REGISTER_TX = [
  ...BASE_TX,
  TX_FIELD('accountId', FIELD_TYPES.id, 'ak'),
  TX_FIELD('nonce', FIELD_TYPES.int),
  TX_FIELD('queryFormat', FIELD_TYPES.string),
  TX_FIELD('responseFormat', FIELD_TYPES.string),
  TX_FIELD('queryFee', FIELD_TYPES.int),
  TX_FIELD('oracleTtlType', FIELD_TYPES.int),
  TX_FIELD('oracleTtlValue', FIELD_TYPES.int),
  TX_FIELD('fee', FIELD_TYPES.int),
  TX_FIELD('ttl', FIELD_TYPES.int),
  TX_FIELD('vmVersion', FIELD_TYPES.int)
]

const ORACLE_EXTEND_TX = [
  ...BASE_TX,
  TX_FIELD('oracleId', FIELD_TYPES.id, 'ok'),
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
  TX_FIELD('oracleId', FIELD_TYPES.id, 'ok'),
  TX_FIELD('query', FIELD_TYPES.string),
  TX_FIELD('queryFee', FIELD_TYPES.int),
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

const CHANNEL_CREATE_TX = [
  ...BASE_TX,
  TX_FIELD('initiator', FIELD_TYPES.id, 'ak'),
  TX_FIELD('initiatorAmount', FIELD_TYPES.int),
  TX_FIELD('responder', FIELD_TYPES.id, 'ak'),
  TX_FIELD('responderAmount', FIELD_TYPES.int),
  TX_FIELD('channelReserve', FIELD_TYPES.int),
  TX_FIELD('lockPeriod', FIELD_TYPES.int),
  TX_FIELD('ttl', FIELD_TYPES.int),
  TX_FIELD('fee', FIELD_TYPES.int),
  TX_FIELD('delegateIds', FIELD_TYPES.string),
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

const CHANNEL_OFFCHAIN_TX = [
  ...BASE_TX,
  TX_FIELD('channelId', FIELD_TYPES.id, 'ch'),
  TX_FIELD('round', FIELD_TYPES.int),
  TX_FIELD('updates', FIELD_TYPES.offChainUpdates),
  TX_FIELD('stateHash', FIELD_TYPES.binary, 'st')
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

export const TX_SERIALIZATION_SCHEMA = {
  [TX_TYPE.account]: TX_SCHEMA_FIELD(ACCOUNT_TX, OBJECT_TAG_ACCOUNT),
  [TX_TYPE.signed]: TX_SCHEMA_FIELD(SIGNED_TX, OBJECT_TAG_SIGNED_TRANSACTION),
  [TX_TYPE.spend]: TX_SCHEMA_FIELD(SPEND_TX, OBJECT_TAG_SPEND_TRANSACTION),
  [TX_TYPE.namePreClaim]: TX_SCHEMA_FIELD(NAME_PRE_CLAIM_TX, OBJECT_TAG_NAME_SERVICE_PRECLAIM_TRANSACTION),
  [TX_TYPE.nameClaim]: TX_SCHEMA_FIELD(NAME_CLAIM_TX, OBJECT_TAG_NAME_SERVICE_CLAIM_TRANSACTION),
  [TX_TYPE.nameUpdate]: TX_SCHEMA_FIELD(NAME_UPDATE_TX, OBJECT_TAG_NAME_SERVICE_UPDATE_TRANSACTION),
  [TX_TYPE.nameTransfer]: TX_SCHEMA_FIELD(NAME_TRANSFER_TX, OBJECT_TAG_NAME_SERVICE_TRANSFER_TRANSACTION),
  [TX_TYPE.nameRevoke]: TX_SCHEMA_FIELD(NAME_REVOKE_TX, OBJECT_TAG_NAME_SERVICE_REVOKE_TRANSACTION),
  [TX_TYPE.contract]: TX_SCHEMA_FIELD(CONTRACT_TX, OBJECT_TAG_CONTRACT),
  [TX_TYPE.contractCreate]: TX_SCHEMA_FIELD(CONTRACT_CREATE_TX, OBJECT_TAG_CONTRACT_CREATE_TRANSACTION),
  [TX_TYPE.contractCall]: TX_SCHEMA_FIELD(CONTRACT_CALL_TX, OBJECT_TAG_CONTRACT_CALL_TRANSACTION),
  [TX_TYPE.oracleRegister]: TX_SCHEMA_FIELD(ORACLE_REGISTER_TX, OBJECT_TAG_ORACLE_REGISTER_TRANSACTION),
  [TX_TYPE.oracleExtend]: TX_SCHEMA_FIELD(ORACLE_EXTEND_TX, OBJECT_TAG_ORACLE_EXTEND_TRANSACTION),
  [TX_TYPE.oracleQuery]: TX_SCHEMA_FIELD(ORACLE_QUERY_TX, OBJECT_TAG_ORACLE_QUERY_TRANSACTION),
  [TX_TYPE.oracleResponse]: TX_SCHEMA_FIELD(ORACLE_RESPOND_TX, OBJECT_TAG_ORACLE_RESPONSE_TRANSACTION),
  [TX_TYPE.channelCreate]: TX_SCHEMA_FIELD(CHANNEL_CREATE_TX, OBJECT_TAG_CHANNEL_CREATE_TX),
  [TX_TYPE.channelCloseMutual]: TX_SCHEMA_FIELD(CHANNEL_CLOSE_MUTUAL_TX, OBJECT_TAG_CHANNEL_CLOSE_MUTUAL_TX),
  [TX_TYPE.channelCloseSolo]: TX_SCHEMA_FIELD(CHANNEL_CLOSE_SOLO_TX, OBJECT_TAG_CHANNEL_CLOSE_SOLO_TX),
  [TX_TYPE.channelSlash]: TX_SCHEMA_FIELD(CHANNEL_SLASH_TX, OBJECT_TAG_CHANNEL_SLASH_TX),
  [TX_TYPE.channelDeposit]: TX_SCHEMA_FIELD(CHANNEL_DEPOSIT_TX, OBJECT_TAG_CHANNEL_DEPOSIT_TX),
  [TX_TYPE.channelWithdraw]: TX_SCHEMA_FIELD(CHANNEL_WITHDRAW_TX, OBJECT_TAG_CHANNEL_WITHRAW_TX),
  [TX_TYPE.channelSettle]: TX_SCHEMA_FIELD(CHANNEL_SETTLE_TX, OBJECT_TAG_CHANNEL_SETTLE_TX),
  [TX_TYPE.channelOffChain]: TX_SCHEMA_FIELD(CHANNEL_OFFCHAIN_TX, OBJECT_TAG_CHANNEL_OFFCHAIN_TX),
  [TX_TYPE.channelOffChainUpdateTransfer]: TX_SCHEMA_FIELD(CHANNEL_OFFCHAIN_UPDATE_TRANSFER_TX, OBJECT_TAG_CHANNEL_OFFCHAIN_UPDATE_TRANSFER_TX),
  [TX_TYPE.channelOffChainUpdateDeposit]: TX_SCHEMA_FIELD(CHANNEL_OFFCHAIN_UPDATE_DEPOSIT_TX, OBJECT_TAG_CHANNEL_OFFCHAIN_UPDATE_DEPOSIT_TX),
  [TX_TYPE.channelOffChainUpdateWithdrawal]: TX_SCHEMA_FIELD(CHANNEL_OFFCHAIN_UPDATE_WITHDRAWAL_TX, OBJECT_TAG_CHANNEL_OFFCHAIN_UPDATE_WITHDRAWAL_TX),
  [TX_TYPE.channelOffChainCreateContract]: TX_SCHEMA_FIELD(CHANNEL_OFFCHAIN_CREATE_CONTRACT_TX, OBJECT_TAG_CHANNEL_OFFCHAIN_CREATE_CONTRACT_TX),
  [TX_TYPE.channelOffChainCallContract]: TX_SCHEMA_FIELD(CHANNEL_OFFCHAIN_CALL_CONTRACT_TX, OBJECT_TAG_CHANNEL_OFFCHAIN_CALL_CONTRACT_TX),
  [TX_TYPE.proofOfInclusion]: TX_SCHEMA_FIELD(PROOF_OF_INCLUSION_TX, OBJECT_TAG_PROOF_OF_INCLUSION),
  [TX_TYPE.stateTrees]: TX_SCHEMA_FIELD(STATE_TREES_TX, OBJECT_TAG_STATE_TREES),
  [TX_TYPE.merklePatriciaTree]: TX_SCHEMA_FIELD(MERKLE_PATRICIA_TREE_TX, OBJECT_TAG_MERKLE_PATRICIA_TREE),
  [TX_TYPE.merklePatriciaTreeValue]: TX_SCHEMA_FIELD(MERKLE_PATRICIA_TREE_VALUE_TX, OBJECT_TAG_MERKLE_PATRICIA_TREE_VALUE),
  [TX_TYPE.contractsTree]: TX_SCHEMA_FIELD(CONTRACTS_TREE_TX, OBJECT_TAG_CONTRACTS_TREE),
  [TX_TYPE.contractCallsTree]: TX_SCHEMA_FIELD(CONTRACT_CALLS_TREE_TX, OBJECT_TAG_CONTRACT_CALLS_TREE)
}

export const TX_DESERIALIZATION_SCHEMA = {
  [OBJECT_TAG_ACCOUNT]: TX_SCHEMA_FIELD(ACCOUNT_TX, OBJECT_TAG_ACCOUNT),
  [OBJECT_TAG_SIGNED_TRANSACTION]: TX_SCHEMA_FIELD(SIGNED_TX, OBJECT_TAG_SIGNED_TRANSACTION),
  [OBJECT_TAG_SPEND_TRANSACTION]: TX_SCHEMA_FIELD(SPEND_TX, OBJECT_TAG_SPEND_TRANSACTION),
  [OBJECT_TAG_NAME_SERVICE_PRECLAIM_TRANSACTION]: TX_SCHEMA_FIELD(NAME_PRE_CLAIM_TX, OBJECT_TAG_NAME_SERVICE_PRECLAIM_TRANSACTION),
  [OBJECT_TAG_NAME_SERVICE_CLAIM_TRANSACTION]: TX_SCHEMA_FIELD(NAME_CLAIM_TX, OBJECT_TAG_NAME_SERVICE_CLAIM_TRANSACTION),
  [OBJECT_TAG_NAME_SERVICE_UPDATE_TRANSACTION]: TX_SCHEMA_FIELD(NAME_UPDATE_TX, OBJECT_TAG_NAME_SERVICE_UPDATE_TRANSACTION),
  [OBJECT_TAG_NAME_SERVICE_TRANSFER_TRANSACTION]: TX_SCHEMA_FIELD(NAME_TRANSFER_TX, OBJECT_TAG_NAME_SERVICE_TRANSFER_TRANSACTION),
  [OBJECT_TAG_NAME_SERVICE_REVOKE_TRANSACTION]: TX_SCHEMA_FIELD(NAME_REVOKE_TX, OBJECT_TAG_NAME_SERVICE_REVOKE_TRANSACTION),
  [OBJECT_TAG_CONTRACT]: TX_SCHEMA_FIELD(CONTRACT_TX, OBJECT_TAG_CONTRACT),
  [OBJECT_TAG_CONTRACT_CREATE_TRANSACTION]: TX_SCHEMA_FIELD(CONTRACT_CREATE_TX, OBJECT_TAG_CONTRACT_CREATE_TRANSACTION),
  [OBJECT_TAG_CONTRACT_CALL_TRANSACTION]: TX_SCHEMA_FIELD(CONTRACT_CALL_TX, OBJECT_TAG_CONTRACT_CALL_TRANSACTION),
  [OBJECT_TAG_ORACLE_REGISTER_TRANSACTION]: TX_SCHEMA_FIELD(ORACLE_REGISTER_TX, OBJECT_TAG_ORACLE_REGISTER_TRANSACTION),
  [OBJECT_TAG_ORACLE_EXTEND_TRANSACTION]: TX_SCHEMA_FIELD(ORACLE_EXTEND_TX, OBJECT_TAG_ORACLE_EXTEND_TRANSACTION),
  [OBJECT_TAG_ORACLE_QUERY_TRANSACTION]: TX_SCHEMA_FIELD(ORACLE_QUERY_TX, OBJECT_TAG_ORACLE_QUERY_TRANSACTION),
  [OBJECT_TAG_ORACLE_RESPONSE_TRANSACTION]: TX_SCHEMA_FIELD(ORACLE_RESPOND_TX, OBJECT_TAG_ORACLE_RESPONSE_TRANSACTION),
  [OBJECT_TAG_CHANNEL_CREATE_TX]: TX_SCHEMA_FIELD(CHANNEL_CREATE_TX, OBJECT_TAG_CHANNEL_CREATE_TX),
  [OBJECT_TAG_CHANNEL_CLOSE_MUTUAL_TX]: TX_SCHEMA_FIELD(CHANNEL_CLOSE_MUTUAL_TX, OBJECT_TAG_CHANNEL_CLOSE_MUTUAL_TX),
  [OBJECT_TAG_CHANNEL_CLOSE_SOLO_TX]: TX_SCHEMA_FIELD(CHANNEL_CLOSE_SOLO_TX, OBJECT_TAG_CHANNEL_CLOSE_SOLO_TX),
  [OBJECT_TAG_CHANNEL_SLASH_TX]: TX_SCHEMA_FIELD(CHANNEL_SLASH_TX, OBJECT_TAG_CHANNEL_SLASH_TX),
  [OBJECT_TAG_CHANNEL_DEPOSIT_TX]: TX_SCHEMA_FIELD(CHANNEL_DEPOSIT_TX, OBJECT_TAG_CHANNEL_DEPOSIT_TX),
  [OBJECT_TAG_CHANNEL_WITHRAW_TX]: TX_SCHEMA_FIELD(CHANNEL_WITHDRAW_TX, OBJECT_TAG_CHANNEL_WITHRAW_TX),
  [OBJECT_TAG_CHANNEL_SETTLE_TX]: TX_SCHEMA_FIELD(CHANNEL_SETTLE_TX, OBJECT_TAG_CHANNEL_SETTLE_TX),
  [OBJECT_TAG_CHANNEL_OFFCHAIN_TX]: TX_SCHEMA_FIELD(CHANNEL_OFFCHAIN_TX, OBJECT_TAG_CHANNEL_OFFCHAIN_TX),
  [OBJECT_TAG_CHANNEL_OFFCHAIN_UPDATE_TRANSFER_TX]: TX_SCHEMA_FIELD(CHANNEL_OFFCHAIN_UPDATE_TRANSFER_TX, OBJECT_TAG_CHANNEL_OFFCHAIN_UPDATE_TRANSFER_TX),
  [OBJECT_TAG_CHANNEL_OFFCHAIN_UPDATE_DEPOSIT_TX]: TX_SCHEMA_FIELD(CHANNEL_OFFCHAIN_UPDATE_DEPOSIT_TX, OBJECT_TAG_CHANNEL_OFFCHAIN_UPDATE_DEPOSIT_TX),
  [OBJECT_TAG_CHANNEL_OFFCHAIN_UPDATE_WITHDRAWAL_TX]: TX_SCHEMA_FIELD(CHANNEL_OFFCHAIN_UPDATE_WITHDRAWAL_TX, OBJECT_TAG_CHANNEL_OFFCHAIN_UPDATE_WITHDRAWAL_TX),
  [OBJECT_TAG_CHANNEL_OFFCHAIN_CREATE_CONTRACT_TX]: TX_SCHEMA_FIELD(CHANNEL_OFFCHAIN_CREATE_CONTRACT_TX, OBJECT_TAG_CHANNEL_OFFCHAIN_CREATE_CONTRACT_TX),
  [OBJECT_TAG_CHANNEL_OFFCHAIN_CALL_CONTRACT_TX]: TX_SCHEMA_FIELD(CHANNEL_OFFCHAIN_CALL_CONTRACT_TX, OBJECT_TAG_CHANNEL_OFFCHAIN_CALL_CONTRACT_TX),
  [OBJECT_TAG_PROOF_OF_INCLUSION]: TX_SCHEMA_FIELD(PROOF_OF_INCLUSION_TX, OBJECT_TAG_PROOF_OF_INCLUSION),
  [OBJECT_TAG_STATE_TREES]: TX_SCHEMA_FIELD(STATE_TREES_TX, OBJECT_TAG_STATE_TREES),
  [OBJECT_TAG_MERKLE_PATRICIA_TREE]: TX_SCHEMA_FIELD(MERKLE_PATRICIA_TREE_TX, OBJECT_TAG_MERKLE_PATRICIA_TREE),
  [OBJECT_TAG_MERKLE_PATRICIA_TREE_VALUE]: TX_SCHEMA_FIELD(MERKLE_PATRICIA_TREE_VALUE_TX, OBJECT_TAG_MERKLE_PATRICIA_TREE_VALUE),
  [OBJECT_TAG_CONTRACTS_TREE]: TX_SCHEMA_FIELD(CONTRACTS_TREE_TX, OBJECT_TAG_CONTRACTS_TREE),
  [OBJECT_TAG_CONTRACT_CALLS_TREE]: TX_SCHEMA_FIELD(CONTRACT_CALLS_TREE_TX, OBJECT_TAG_CONTRACT_CALLS_TREE)
}

// VERIFICATION SCHEMA

const ERROR_TYPE = { ERROR: 'error', WARNING: 'warning' }
const VERIFICATION_FIELD = (msg, verificationFn, error) => [msg, verificationFn, error]

const VALIDATORS = {
  signature: 'signature',
  insufficientFee: 'insufficientFee',
  expiredTTL: 'expiredTTL',
  insufficientBalanceForAmountFee: 'insufficientBalanceForAmountFee',
  insufficientBalanceForAmount: 'insufficientBalanceForAmount',
  nonceUsed: 'nonceUsed',
  nonceHigh: 'nonceHigh'
}

const ERRORS = {
  invalidSignature: { key: 'InvalidSignature', type: ERROR_TYPE.ERROR, txKey: 'signature' },
  insufficientFee: { key: 'InsufficientFee', type: ERROR_TYPE.ERROR, txKey: 'fee' },
  expiredTTL: { key: 'ExpiredTTL', type: ERROR_TYPE.ERROR, txKey: 'ttl' },
  insufficientBalanceForAmountFee: { key: 'InsufficientBalanceForAmountFee', type: ERROR_TYPE.WARNING, txKey: 'fee' },
  insufficientBalanceForAmount: { key: 'InsufficientBalanceForAmount', type: ERROR_TYPE.WARNING, txKey: 'amount' },
  nonceUsed: { key: 'NonceUsed', type: ERROR_TYPE.ERROR, txKey: 'nonce' },
  nonceHigh: { key: 'NonceHigh', type: ERROR_TYPE.WARNING, txKey: 'nonce' }
}

export const SIGNATURE_VERIFICATION_SCHEMA = [
  VERIFICATION_FIELD(
    () => `The signature cannot be verified, please verify that you used the correct network id and the correct private key for the sender address`,
    VALIDATORS.signature,
    ERRORS.invalidSignature
  )
]
export const BASE_VERIFICATION_SCHEMA = [
  VERIFICATION_FIELD(
    ({ minFee }) => `The fee for the transaction is too low, the minimum fee for this transaction is ${minFee}`,
    VALIDATORS.insufficientFee,
    ERRORS.insufficientFee
  ),
  VERIFICATION_FIELD(
    ({ height }) => `The TTL is already expired, the current height is ${height}`,
    VALIDATORS.expiredTTL,
    ERRORS.expiredTTL
  ),
  VERIFICATION_FIELD(
    ({ balance }) => `The account balance ${balance} is not enough to execute the transaction`,
    VALIDATORS.insufficientBalanceForAmountFee,
    ERRORS.insufficientBalanceForAmountFee
  ),
  VERIFICATION_FIELD(
    ({ balance }) => `The account balance ${balance} is not enough to execute the transaction`,
    VALIDATORS.insufficientBalanceForAmount,
    ERRORS.insufficientBalanceForAmount
  ),
  VERIFICATION_FIELD(
    ({ accountNonce }) => `The nonce is invalid(already used). Next valid nonce is ${accountNonce + 1})`,
    VALIDATORS.nonceUsed,
    ERRORS.nonceUsed
  ),
  VERIFICATION_FIELD(
    ({ accountNonce }) => `The nonce is technically valid but will not be processed immediately by the node (next valid nonce is ${accountNonce + 1})`,
    VALIDATORS.nonceHigh,
    ERRORS.nonceHigh
  )
]
