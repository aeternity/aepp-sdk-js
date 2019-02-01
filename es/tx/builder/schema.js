/**
 * Transaction Schema for TxBuilder
 * @module @aeternity/aepp-sdk/es/tx/builder/schema
 * @export TxSchema
 * @example import TxSchema from '@aeternity/aepp-sdk/es/tx/builder/schema'
 */
/* eslint-disable no-unused-vars */
// # RLP version number
// # https://github.com/aeternity/protocol/blob/epoch-v0.10.1/serializations.md#binary-serialization

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
const OBJECT_TAG_CONTRACT_CREATE_TRANSACTION = 42
const OBJECT_TAG_CONTRACT_CALL_TRANSACTION = 43

const TX_FIELD = (name, type, prefix) => [name, type, prefix]
const TX_SCHEMA_FIELD = (schema, objectId) => [schema, objectId]

/**
 * @constant
 * @description Object with transaction types
 * @type {Object} TX_TYPE
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
  signed: 'signedTx',
  spend: 'spendTx',
  // AENS
  nameClaim: 'nameClaimTx',
  namePreClaim: 'namePreClaimTx',
  nameUpdate: 'nameUpdateTx',
  nameRevoke: 'nameRevokeTx',
  nameTransfer: 'nameTransfer',
  // CONTRACT
  contractCreate: 'contractCreateTx',
  contractCall: 'contractCallTx',
  // ORACLE
  oracleRegister: 'oracleRegister',
  oracleExtend: 'oracleExtend',
  oracleQuery: 'oracleQuery',
  oracleResponse: 'oracleResponse'
}

export const OBJECT_ID_TX_TYPE = {
  [OBJECT_TAG_SPEND_TRANSACTION]: TX_TYPE.spend,
  // AENS
  [OBJECT_TAG_NAME_SERVICE_CLAIM_TRANSACTION]: TX_TYPE.nameClaim,
  [OBJECT_TAG_NAME_SERVICE_PRECLAIM_TRANSACTION]: TX_TYPE.namePreClaim,
  [OBJECT_TAG_NAME_SERVICE_UPDATE_TRANSACTION]: TX_TYPE.nameUpdate,
  [OBJECT_TAG_NAME_SERVICE_REVOKE_TRANSACTION]: TX_TYPE.nameRevoke,
  [OBJECT_TAG_NAME_SERVICE_TRANSFER_TRANSACTION]: TX_TYPE.nameTransfer,
  // CONTRACT
  [OBJECT_TAG_CONTRACT_CREATE_TRANSACTION]: TX_TYPE.contractCreate,
  [OBJECT_TAG_CONTRACT_CALL_TRANSACTION]: TX_TYPE.contractCall,
  // ORACLE
  [OBJECT_TAG_ORACLE_REGISTER_TRANSACTION]: TX_TYPE.oracleRegister,
  [OBJECT_TAG_ORACLE_EXTEND_TRANSACTION]: TX_TYPE.oracleExtend,
  [OBJECT_TAG_ORACLE_QUERY_TRANSACTION]: TX_TYPE.oracleQuery,
  [OBJECT_TAG_ORACLE_RESPONSE_TRANSACTION]: TX_TYPE.oracleResponse
}

export const FIELD_TYPES = {
  int: 'int',
  id: 'id',
  string: 'string',
  binary: 'binary',
  rlpBinary: 'rlpBinary',
  signatures: 'signatures',
  pointers: 'pointers'
}

// FEE CALCULATION
export const BASE_GAS = 15000
export const GAS_PER_BYTE = 20
export const FEE_BYTE_SIZE = 8
export const DEFAULT_FEE = 20000

// MAP WITH FEE CALCULATION https://github.com/aeternity/protocol/blob/epoch-v1.0.0-rc6/consensus/consensus.md#gas
export const TX_FEE_FORMULA = {
  [TX_TYPE.spend]: () => BASE_GAS,
  [TX_TYPE.contractCreate]: (gas) => 5 * BASE_GAS + gas,
  [TX_TYPE.contractCall]: (gas) => 30 * BASE_GAS + gas,
  [TX_TYPE.nameTransfer]: () => BASE_GAS,
  [TX_TYPE.nameUpdate]: () => BASE_GAS,
  [TX_TYPE.nameClaim]: () => BASE_GAS,
  [TX_TYPE.namePreClaim]: () => BASE_GAS,
  [TX_TYPE.nameRevoke]: () => BASE_GAS
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

export const ID_TAG_PREFIX = {
  [ID_TAG.account]: 'ak',
  [ID_TAG.name]: 'nm',
  [ID_TAG.commitment]: 'cm',
  [ID_TAG.oracle]: 'ok',
  [ID_TAG.contract]: 'ct',
  [ID_TAG.channel]: 'ch'
}
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

export const TX_SERIALIZATION_SCHEMA = {
  [TX_TYPE.signed]: TX_SCHEMA_FIELD(SIGNED_TX, OBJECT_TAG_SIGNED_TRANSACTION),
  [TX_TYPE.spend]: TX_SCHEMA_FIELD(SPEND_TX, OBJECT_TAG_SPEND_TRANSACTION),
  [TX_TYPE.namePreClaim]: TX_SCHEMA_FIELD(NAME_PRE_CLAIM_TX, OBJECT_TAG_NAME_SERVICE_PRECLAIM_TRANSACTION),
  [TX_TYPE.nameClaim]: TX_SCHEMA_FIELD(NAME_CLAIM_TX, OBJECT_TAG_NAME_SERVICE_CLAIM_TRANSACTION),
  [TX_TYPE.nameUpdate]: TX_SCHEMA_FIELD(NAME_UPDATE_TX, OBJECT_TAG_NAME_SERVICE_UPDATE_TRANSACTION),
  [TX_TYPE.nameTransfer]: TX_SCHEMA_FIELD(NAME_TRANSFER_TX, OBJECT_TAG_NAME_SERVICE_TRANSFER_TRANSACTION),
  [TX_TYPE.nameRevoke]: TX_SCHEMA_FIELD(NAME_REVOKE_TX, OBJECT_TAG_NAME_SERVICE_REVOKE_TRANSACTION),
  [TX_TYPE.contractCreate]: TX_SCHEMA_FIELD(CONTRACT_CREATE_TX, OBJECT_TAG_CONTRACT_CREATE_TRANSACTION),
  [TX_TYPE.contractCall]: TX_SCHEMA_FIELD(CONTRACT_CALL_TX, OBJECT_TAG_CONTRACT_CALL_TRANSACTION),
  [TX_TYPE.oracleRegister]: TX_SCHEMA_FIELD(ORACLE_REGISTER_TX, OBJECT_TAG_ORACLE_REGISTER_TRANSACTION),
  [TX_TYPE.oracleExtend]: TX_SCHEMA_FIELD(ORACLE_EXTEND_TX, OBJECT_TAG_ORACLE_EXTEND_TRANSACTION),
  [TX_TYPE.oracleQuery]: TX_SCHEMA_FIELD(ORACLE_QUERY_TX, OBJECT_TAG_ORACLE_QUERY_TRANSACTION),
  [TX_TYPE.oracleResponse]: TX_SCHEMA_FIELD(ORACLE_RESPOND_TX, OBJECT_TAG_ORACLE_RESPONSE_TRANSACTION)
}

export const TX_DESERIALIZATION_SCHEMA = {
  [OBJECT_TAG_SIGNED_TRANSACTION]: TX_SCHEMA_FIELD(SIGNED_TX, OBJECT_TAG_SIGNED_TRANSACTION),
  [OBJECT_TAG_SPEND_TRANSACTION]: TX_SCHEMA_FIELD(SPEND_TX, OBJECT_TAG_SPEND_TRANSACTION),
  [OBJECT_TAG_NAME_SERVICE_PRECLAIM_TRANSACTION]: TX_SCHEMA_FIELD(NAME_PRE_CLAIM_TX, OBJECT_TAG_NAME_SERVICE_PRECLAIM_TRANSACTION),
  [OBJECT_TAG_NAME_SERVICE_CLAIM_TRANSACTION]: TX_SCHEMA_FIELD(NAME_CLAIM_TX, OBJECT_TAG_NAME_SERVICE_CLAIM_TRANSACTION),
  [OBJECT_TAG_NAME_SERVICE_UPDATE_TRANSACTION]: TX_SCHEMA_FIELD(NAME_UPDATE_TX, OBJECT_TAG_NAME_SERVICE_UPDATE_TRANSACTION),
  [OBJECT_TAG_NAME_SERVICE_TRANSFER_TRANSACTION]: TX_SCHEMA_FIELD(NAME_TRANSFER_TX, OBJECT_TAG_NAME_SERVICE_TRANSFER_TRANSACTION),
  [OBJECT_TAG_NAME_SERVICE_REVOKE_TRANSACTION]: TX_SCHEMA_FIELD(NAME_REVOKE_TX, OBJECT_TAG_NAME_SERVICE_REVOKE_TRANSACTION),
  [OBJECT_TAG_CONTRACT_CREATE_TRANSACTION]: TX_SCHEMA_FIELD(CONTRACT_CREATE_TX, OBJECT_TAG_CONTRACT_CREATE_TRANSACTION),
  [OBJECT_TAG_CONTRACT_CALL_TRANSACTION]: TX_SCHEMA_FIELD(CONTRACT_CALL_TX, OBJECT_TAG_CONTRACT_CALL_TRANSACTION),
  [OBJECT_TAG_ORACLE_REGISTER_TRANSACTION]: TX_SCHEMA_FIELD(ORACLE_REGISTER_TX, OBJECT_TAG_ORACLE_REGISTER_TRANSACTION),
  [OBJECT_TAG_ORACLE_EXTEND_TRANSACTION]: TX_SCHEMA_FIELD(ORACLE_EXTEND_TX, OBJECT_TAG_ORACLE_EXTEND_TRANSACTION),
  [OBJECT_TAG_ORACLE_QUERY_TRANSACTION]: TX_SCHEMA_FIELD(ORACLE_QUERY_TX, OBJECT_TAG_ORACLE_QUERY_TRANSACTION),
  [OBJECT_TAG_ORACLE_RESPONSE_TRANSACTION]: TX_SCHEMA_FIELD(ORACLE_RESPOND_TX, OBJECT_TAG_ORACLE_RESPONSE_TRANSACTION)
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
  invalidSignature: { key: 'InvalidSignature', type: ERROR_TYPE.ERROR },
  insufficientFee: { key: 'InsufficientFee', type: ERROR_TYPE.ERROR },
  expiredTTL: { key: 'ExpiredTTL', type: ERROR_TYPE.ERROR },
  insufficientBalanceForAmountFee: { key: 'InsufficientBalanceForAmountFee', type: ERROR_TYPE.WARNING },
  insufficientBalanceForAmount: { key: 'InsufficientBalanceForAmount', type: ERROR_TYPE.WARNING },
  nonceUsed: { key: 'NonceUsed', type: ERROR_TYPE.ERROR },
  nonceHigh: { key: 'NonceHigh', type: ERROR_TYPE.WARNING }
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
    ({balance}) => `The account balance ${balance} is not enough to execute the transaction`,
    VALIDATORS.insufficientBalanceForAmount,
    ERRORS.insufficientBalanceForAmount
  ),
  VERIFICATION_FIELD(
    ({ accountNonce }) => `The nonce is invalid(already used). Next valid nonce is ${accountNonce + 1})`,
    VALIDATORS.nonceUsed,
    ERRORS.nonceUsed
  ),
  VERIFICATION_FIELD(
    ({accountNonce}) => `The nonce is technically valid but will not be processed immediately by the node (next valid nonce is ${accountNonce + 1})`,
    VALIDATORS.nonceHigh,
    ERRORS.nonceHigh
  )
]
