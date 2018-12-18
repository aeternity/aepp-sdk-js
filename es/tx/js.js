/*
 * ISC License (ISC)
 * Copyright (c) 2018 aeternity developers
 *
 *  Permission to use, copy, modify, and/or distribute this software for any
 *  purpose with or without fee is hereby granted, provided that the above
 *  copyright notice and this permission notice appear in all copies.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
 *  REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
 *  AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 *  INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
 *  LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
 *  OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
 *  PERFORMANCE OF THIS SOFTWARE.
 */

/**
 * Js Tx module
 * @module @aeternity/aepp-sdk/es/tx/js
 * @export JsTx
 * @example import JsTx from '@aeternity/aepp-sdk/es/tx/js'
 */

import {
  encodeBase58Check,
  decodeBase58Check,
  hash,
  nameId,
  salt,
  encodeTx,
  assertedType,
  decodeBase64Check,
  encodeBase64Check
} from '../utils/crypto'
import { toBytes } from '../utils/bytes'

const ORACLE_TTL_TYPES = {
  delta: 'delta',
  block: 'block'
}

// # RLP version number
// # https://github.com/aeternity/protocol/blob/epoch-v0.10.1/serializations.md#binary-serialization
const VSN = 1

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

// const OBJECT_TAG_ACCOUNT = 10
// const OBJECT_TAG_SIGNED_TRANSACTION = 11
const OBJECT_TAG_SPEND_TRANSACTION = 12
// const OBJECT_TAG_ORACLE = 20
// const OBJECT_TAG_ORACLE_QUERY = 21
const OBJECT_TAG_ORACLE_REGISTER_TRANSACTION = 22
const OBJECT_TAG_ORACLE_QUERY_TRANSACTION = 23
const OBJECT_TAG_ORACLE_RESPONSE_TRANSACTION = 24
const OBJECT_TAG_ORACLE_EXTEND_TRANSACTION = 25
// const OBJECT_TAG_NAME_SERVICE_NAME = 30
// const OBJECT_TAG_NAME_SERVICE_COMMITMENT = 31
const OBJECT_TAG_NAME_SERVICE_CLAIM_TRANSACTION = 32
const OBJECT_TAG_NAME_SERVICE_PRECLAIM_TRANSACTION = 33
const OBJECT_TAG_NAME_SERVICE_UPDATE_TRANSACTION = 34
const OBJECT_TAG_NAME_SERVICE_REVOKE_TRANSACTION = 35
const OBJECT_TAG_NAME_SERVICE_TRANSFER_TRANSACTION = 36
// const OBJECT_TAG_CONTRACT = 40
// const OBJECT_TAG_CONTRACT_CALL = 41
const OBJECT_TAG_CONTRACT_CREATE_TRANSACTION = 42
const OBJECT_TAG_CONTRACT_CALL_TRANSACTION = 43
// const OBJECT_TAG_CHANNEL_CREATE_TRANSACTION = 50
// const OBJECT_TAG_CHANNEL_DEPOSIT_TRANSACTION = 51
// const OBJECT_TAG_CHANNEL_WITHDRAW_TRANSACTION = 52
// const OBJECT_TAG_CHANNEL_FORCE_PROGRESS_TRANSACTION = 521
// const OBJECT_TAG_CHANNEL_CLOSE_MUTUAL_TRANSACTION = 53
// const OBJECT_TAG_CHANNEL_CLOSE_SOLO_TRANSACTION = 54
// const OBJECT_TAG_CHANNEL_SLASH_TRANSACTION = 55
// const OBJECT_TAG_CHANNEL_SETTLE_TRANSACTION = 56
// const OBJECT_TAG_CHANNEL_OFF_CHAIN_TRANSACTION = 57
// const OBJECT_TAG_CHANNEL_OFF_CHAIN_UPDATE_TRANSFER = 570
// const OBJECT_TAG_CHANNEL_OFF_CHAIN_UPDATE_DEPOSIT = 571
// const OBJECT_TAG_CHANNEL_OFF_CHAIN_UPDATE_WITHDRAWAL = 572
// const OBJECT_TAG_CHANNEL_OFF_CHAIN_UPDATE_CREATE_CONTRACT = 573
// const OBJECT_TAG_CHANNEL_OFF_CHAIN_UPDATE_CALL_CONTRACT = 574
// const OBJECT_TAG_CHANNEL = 58
// const OBJECT_TAG_CHANNEL_SNAPSHOT_TRANSACTION = 59
// const OBJECT_TAG_POI = 60
// const OBJECT_TAG_MICRO_BODY = 101
// const OBJECT_TAG_LIGHT_MICRO_BLOCK = 102

export const createSalt = salt
/**
 * JavaScript-based Transaction build function''
 *
 * Will provide ability to build all type of transaction'' natively
 */

const base64Types = ['tx', 'st', 'ss', 'pi', 'ov', 'or', 'cb']
/**
 * Decode data using the default encoding/decoding algorithm
 *
 * @param {string} data  An encoded and prefixed string (ex tx_..., sg_..., ak_....)
 * @param {string} type Prefix of Transaction
 * @return {Buffer} Buffer of decoded Base58 or Base64 data
 */
export function decode (data, type) {
  if (!type) type = data.split('_')[0]
  return base64Types.includes(type)
    ? decodeBase64Check(assertedType(data, type))
    : decodeBase58Check(assertedType(data, type))
}

/**
 * Encode data using the default encoding/decoding algorithm
 *
 * @param {Buffer|String} data  An decoded data
 * @param {string} type Prefix of Transaction
 * @return {String} Encoded string Base58 or Base64 data
 */
export function encode (data, type) {
  return `${type}_${base64Types.includes(type)
    ? encodeBase64Check(data)
    : encodeBase58Check(data)}`
}

/**
 * Utility function to create and _id type
 *
 * @param {number} idTag Tag
 * @param {string} hashId Encoded hash
 * @param {string} hashType Prefix of hash (examples: ak, tx, cm, nm, ...)
 * @return {Buffer} Buffer Buffer with ID tag and decoded HASh
 */
export function _id (idTag, hashId, hashType) {
  return Buffer.from([...toBytes(idTag), ...decode(hashId, hashType)])
}

/**
 * Utility function to convert int to bytes
 *
 * @param {Number|String|BigNumber} val Value
 * @return {Buffer} Buffer Buffer from number(BigEndian)
 */
export function _int (val) {
  return toBytes(val, true)
}

/**
 * Format the salt into a 64-byte hex string
 *
 * @param {number} salt
 * @return {string} Zero-padded hex string of salt
 */
export function formatSalt (salt) {
  return Buffer.from(salt.toString(16).padStart(64, '0'), 'hex')
}

/**
 * Generate the commitment hash by hashing the formatted salt and
 * name, base 58 encoding the result and prepending 'cm_'
 *
 * @function commitmentHash
 * @category async
 * @rtype (name: String, salt?: String) => hash: Promise[String]
 * @param {String} name - Name to be registered
 * @param {Number} salt Random salt
 * @return {String} Commitment hash
 */
export async function commitmentHash (name, salt = createSalt()) {
  return `cm_${encodeBase58Check(hash(Buffer.concat([nameId(name), formatSalt(salt)])))}`
}

/**
 * Helper function to build pointers for name update TX
 *
 * @param {Array} pointers - Array of pointers ([ { key: 'account_pubkey', id: 'ak_32klj5j23k23j5423l434l2j3423'} ])
 * @return {Array} Serialized pointers array
 */
export function buildPointers (pointers) {
  const POINTERS_TAGS = {
    'account_pubkey': ID_TAG_ACCOUNT,
    'oracle_pubkey': ID_TAG_ORACLE,
    'contract_pubkey': ID_TAG_CONTRACT,
    'channel_pubkey': ID_TAG_CHANNEL
  }
  return pointers.map(p => [toBytes(p['key']), _id(POINTERS_TAGS[p['key']], p['id'])])
}

/**
 * Build a contract public key
 *
 * @param {string} ownerId The public key of the owner account
 * @param {number} nonce the nonce of the transaction
 * @return {string} Contract public key
 */
export function buildContractId (ownerId, nonce) {
  const ownerIdAndNonce = Buffer.from([...decodeBase58Check(ownerId.slice(3)), ...toBytes(nonce)])
  const b2bHash = hash(ownerIdAndNonce)
  return encode(b2bHash, 'ct')
}

/**
 * Build a oracle query id
 *
 * @param {String} senderId The public key of the sender account
 * @param {Number} nonce the nonce of the transaction
 * @param {Number} oracleId The oracle public key
 * @return {string} Contract public key
 */
export function oracleQueryId (senderId, nonce, oracleId) {
  function _int32 (val) {
    const nonceBE = toBytes(val, true)
    return Buffer.concat([Buffer.alloc(32 - nonceBE.length), nonceBE])
  }
  const b2bHash = hash(Buffer.from([...decode(senderId, 'ak'), ..._int32(nonce), ...decode(oracleId, 'ok')]))
  return encode(b2bHash, 'oq')
}

/**
 * Create a spend transaction
 *
 * @param {string} senderId The public key of the sender
 * @param {string} recipientId The public key of the recipient
 * @param {number} amount The amount to send
 * @param {string} payload The payload associated with the data
 * @param {number} fee The fee for the transaction
 * @param {number} ttl The relative ttl of the transaction
 * @param {number} nonce the nonce of the transaction
 * @param {Boolean} encode encode transaction using Rlp and base64
 * @return {Object}  { tx } Unsigned spend tx hash
 */
export function spendTxNative ({ senderId, recipientId, amount, payload, fee, ttl, nonce }, encode = true) {
  let tx = [
    _int(OBJECT_TAG_SPEND_TRANSACTION),
    _int(VSN),
    _id(ID_TAG_ACCOUNT, senderId, 'ak'),
    _id(ID_TAG_ACCOUNT, recipientId, 'ak'),
    _int(amount),
    _int(fee),
    _int(ttl),
    _int(nonce),
    toBytes(payload)
  ]

  // Encode RLP
  tx = encode ? encodeTx(tx) : tx
  return { tx }
}

/**
 * Create a name pre-claim transaction
 *
 * @param {string} accountId The public key of the account
 * @param {string} commitmentId Commitment hash
 * @param {number} fee The fee for the transaction
 * @param {number} ttl The relative ttl of the transaction
 * @param {number} nonce the nonce of the transaction
 * @param {Boolean} encode encode transaction using Rlp and base64
 * @return {Object} { tx } Unsigned name pre-claim tx hash
 */
export function namePreclaimTxNative ({ accountId, nonce, commitmentId, fee, ttl }, encode = true) {
  let tx = [
    _int(OBJECT_TAG_NAME_SERVICE_PRECLAIM_TRANSACTION),
    _int(VSN),
    _id(ID_TAG_ACCOUNT, accountId, 'ak'),
    _int(nonce),
    _id(ID_TAG_COMMITMENT, commitmentId, 'cm'),
    _int(fee),
    _int(ttl)
  ]

  // Encode RLP
  tx = encode ? encodeTx(tx) : tx
  return { tx }
}

/**
 * Create a name claim transaction
 *
 * @param {string} accountId The public key of the account
 * @param {string} name Name hash
 * @param {string} nameSalt salt
 * @param {number} fee The fee for the transaction
 * @param {number} ttl The relative ttl of the transaction
 * @param {number} nonce the nonce of the transaction
 * @param {Boolean} encode encode transaction using Rlp and base64
 * @return {Object}  { tx } Unsigned name claim tx hash
 */
export function nameClaimTxNative ({ accountId, nonce, name, nameSalt, fee, ttl }, encode = true) {
  let tx = [
    _int(OBJECT_TAG_NAME_SERVICE_CLAIM_TRANSACTION),
    _int(VSN),
    _id(ID_TAG_ACCOUNT, accountId, 'ak'),
    _int(nonce),
    decode(name, 'nm'),
    _int(nameSalt),
    _int(fee),
    _int(ttl)
  ]

  // Encode RLP
  tx = encode ? encodeTx(tx) : tx
  return { tx }
}

/**
 * Create a name update transaction
 *
 * @param {string} accountId The public key of the account
 * @param {string} nameId name hash
 * @param {number} fee The fee for the transaction
 * @param {number} ttl The relative ttl of the transaction
 * @param {number} nameTtl The relative ttl of the name
 * @param {number} clientTtl The relative ttl of the client
 * @param {Array} pointers Array of pointers
 * @param {number} nonce the nonce of the transaction
 * @param {Boolean} encode encode transaction using Rlp and base64
 * @return {Object} { tx } Unsigned name update tx hash
 */
export function nameUpdateTxNative ({ accountId, nonce, nameId, nameTtl, pointers, clientTtl, fee, ttl }, encode = true) {
  // Build pointers
  pointers = buildPointers(pointers)

  let tx = [
    _int(OBJECT_TAG_NAME_SERVICE_UPDATE_TRANSACTION),
    _int(VSN),
    _id(ID_TAG_ACCOUNT, accountId, 'ak'),
    _int(nonce),
    _id(ID_TAG_NAME, nameId, 'nm'),
    _int(nameTtl),
    pointers,
    _int(clientTtl),
    _int(fee),
    _int(ttl)
  ]
  // Encode RLP
  tx = encode ? encodeTx(tx) : tx
  return { tx }
}

/**
 * Create a name transfer transaction
 *
 * @param {string} accountId The public key of the account
 * @param {string} recipientId The public key of the recipient
 * @param {string} nameId name hash
 * @param {number} fee The fee for the transaction
 * @param {number} ttl The relative ttl of the transaction
 * @param {number} nonce the nonce of the transaction
 * @param {Boolean} encode encode transaction using Rlp and base64
 * @return {Object} { tx } Unsigned name transfer tx hash
 */
export function nameTransferTxNative ({ accountId, nonce, nameId, recipientId, fee, ttl }, encode = true) {
  let tx = [
    _int(OBJECT_TAG_NAME_SERVICE_TRANSFER_TRANSACTION),
    _int(VSN),
    _id(ID_TAG_ACCOUNT, accountId, 'ak'),
    _int(nonce),
    _id(ID_TAG_NAME, nameId, 'nm'),
    _id(ID_TAG_ACCOUNT, recipientId, 'ak'),
    _int(fee),
    _int(ttl)
  ]

  // Encode RLP
  tx = encode ? encodeTx(tx) : tx
  return { tx }
}

/**
 * Create a name revoke transaction
 *
 * @param {string} accountId The public key of the account
 * @param {string} nameId name hash
 * @param {number} fee The fee for the transaction
 * @param {number} ttl The relative ttl of the transaction
 * @param {number} nonce the nonce of the transaction
 * @param {Boolean} encode encode transaction using Rlp and base64
 * @return {Object} { tx } Unsigned name revoke tx hash
 */
export function nameRevokeTxNative ({ accountId, nonce, nameId, fee, ttl }, encode = true) {
  let tx = [
    _int(OBJECT_TAG_NAME_SERVICE_REVOKE_TRANSACTION),
    _int(VSN),
    _id(ID_TAG_ACCOUNT, accountId, 'ak'),
    _int(nonce),
    _id(ID_TAG_NAME, nameId, 'nm'),
    _int(fee),
    _int(ttl)
  ]

  // Encode RLP
  tx = encode ? encodeTx(tx) : tx
  return { tx }
}

/**
 * Create a contract create transaction
 *
 * @param {string} ownerId The public key of the owner account
 * @param {string} code Compiled contract
 * @param {number} vmVersion VM Version
 * @param {number} deposit deposit amount
 * @param {number} amount Amount to spend on contract account
 * @param {number} gas Gas for contract create
 * @param {number} gasPrice Gas price
 * @param {number} fee The fee for the transaction
 * @param {number} ttl The relative ttl of the transaction
 * @param {number} nonce the nonce of the transaction
 * @param {string} callData Call Data
 * @param {Boolean} encode encode transaction using Rlp and base64
 * @return {Object} { tx } Encrypted contract create tx hash
 */
export function contractCreateTxNative ({ ownerId, nonce, code, vmVersion, deposit, amount, gas, gasPrice, fee, ttl, callData }, encode = true) {
  let tx = [
    _int(OBJECT_TAG_CONTRACT_CREATE_TRANSACTION),
    _int(VSN),
    _id(ID_TAG_ACCOUNT, ownerId, 'ak'),
    _int(nonce),
    decode(code, 'cb'),
    _int(vmVersion),
    _int(fee),
    _int(ttl),
    _int(deposit),
    _int(amount),
    _int(gas),
    _int(gasPrice),
    decode(callData, 'cb')
  ]

  // Encode RLP
  tx = encode ? encodeTx(tx) : tx
  return { tx, contractId: buildContractId(ownerId, nonce) }
}

/**
 * Create a contract call transaction
 *
 * @param {string} callerId The public key of the caller account
 * @param {number} vmVersion VM Version
 * @param {string} contractId Contract public key
 * @param {number} amount Amount to spend on contract account
 * @param {number} gas Gas for contract create
 * @param {number} gasPrice Gas price
 * @param {number} fee The fee for the transaction
 * @param {number} ttl The relative ttl of the transaction
 * @param {number} nonce the nonce of the transaction
 * @param {string} callData Call Data
 * @param {Boolean} encode encode transaction using Rlp and base64
 * @return {Object} { tx } Encrypted contract call tx hash
 */
export function contractCallTxNative ({ callerId, nonce, contractId, vmVersion, fee, ttl, amount, gas, gasPrice, callData }, encode = true) {
  let tx = [
    _int(OBJECT_TAG_CONTRACT_CALL_TRANSACTION),
    _int(VSN),
    _id(ID_TAG_ACCOUNT, callerId, 'ak'),
    _int(nonce),
    _id(ID_TAG_CONTRACT, contractId, 'ct'),
    _int(vmVersion),
    _int(fee),
    _int(ttl),
    _int(amount),
    _int(gas),
    _int(gasPrice),
    decode(callData, 'cb')
  ]

  // Encode RLP
  tx = encode ? encodeTx(tx) : tx
  return { tx }
}

/**
 * Create a oracle register transaction
 *
 * @param {String} accountId The public key of the account
 * @param {String} queryFormat Oracle query format
 * @param {String} responseFormat Oracle query response format
 * @param {String|Number} queryFee Oracle query fee
 * @param {Object} oracleTtl Oracle time to leave
 * @param {Number|String} fee The fee for the transaction
 * @param {Number|String} ttl The relative ttl of the transaction
 * @param {Number|String} nonce the nonce of the transaction
 * @param {Number} vmVersion VM Version
 * @param {Boolean} encode encode transaction using Rlp and base64
 * @return {Object} { tx } Oracle register tx
 */
export function oracleRegisterTxNative ({ accountId, queryFormat, responseFormat, queryFee, oracleTtl, fee, ttl, nonce, vmVersion }, encode = true) {
  let tx = [
    _int(OBJECT_TAG_ORACLE_REGISTER_TRANSACTION),
    _int(VSN),
    _id(ID_TAG_ACCOUNT, accountId, 'ak'),
    _int(nonce),
    toBytes(queryFormat),
    toBytes(responseFormat),
    _int(queryFee),
    _int(oracleTtl.type === ORACLE_TTL_TYPES.delta ? 0 : 1),
    _int(oracleTtl.value),
    _int(fee),
    _int(ttl),
    _int(vmVersion)
  ]

  // Encode RLP
  tx = encode ? encodeTx(tx) : tx
  return { tx }
}

/**
 * Create a oracle extend transaction
 *
 * @param {String} oracleId The public key of the oracle
 * @param {Object} oracleTtl Oracle time to leave
 * @param {Number|String} fee The fee for the transaction
 * @param {Number|String} ttl The relative ttl of the transaction
 * @param {Number|String} nonce the nonce of the transaction
 * @param {Boolean} encode encode transaction using Rlp and base64
 * @return {Object} { tx } Oracle extend tx hash
 */
export function oracleExtendTxNative ({ oracleId, oracleTtl, fee, nonce, ttl }, encode = true) {
  let tx = [
    _int(OBJECT_TAG_ORACLE_EXTEND_TRANSACTION),
    _int(VSN),
    _id(ID_TAG_ORACLE, oracleId, 'ok'),
    _int(nonce),
    _int(oracleTtl.type === ORACLE_TTL_TYPES.delta ? 0 : 1),
    _int(oracleTtl.value),
    _int(fee),
    _int(ttl)
  ]

  // Encode RLP
  tx = encode ? encodeTx(tx) : tx
  return { tx }
}

/**
 * Create a oracle post query transaction
 *
 * @param {String} oracleId The public key of the oracle
 * @param {String} senderId The public key of sender account
 * @param {Object} responseTtl Oracle query response time to leave
 * @param {String} query Oracle query data
 * @param {Object} queryTtl Oracle query time to leave
 * @param {Number|String} queryFee Oracle query fee
 * @param {Number|String} fee The fee for the transaction
 * @param {Number|String} ttl The relative ttl of the transaction
 * @param {Number|String} nonce the nonce of the transaction
 * @param {Boolean} encode encode transaction using Rlp and base64
 * @return {Object} { tx } Oracle post query tx hash
 */
export function oraclePostQueryTxNative ({ senderId, oracleId, responseTtl, query, queryTtl, fee, queryFee, ttl, nonce }, encode = true) {
  let tx = [
    _int(OBJECT_TAG_ORACLE_QUERY_TRANSACTION),
    _int(VSN),
    _id(ID_TAG_ACCOUNT, senderId, 'ak'),
    _int(nonce),
    _id(ID_TAG_ORACLE, oracleId, 'ok'),
    toBytes(query),
    _int(queryFee),
    _int(queryTtl.type === ORACLE_TTL_TYPES.delta ? 0 : 1),
    _int(queryTtl.value),
    _int(responseTtl.type === ORACLE_TTL_TYPES.delta ? 0 : 1),
    _int(responseTtl.value),
    _int(fee),
    _int(ttl)
  ]

  // Encode RLP
  tx = encode ? encodeTx(tx) : tx
  return { tx }
}

/**
 * Create a oracle respond query transaction
 *
 * @param {String} oracleId The public key of the oracle
 * @param {String} queryId The oracle query id
 * @param {Object} responseTtl Oracle query response time to leave
 * @param {String} response Oracle query response data
 * @param {Number|String} fee The fee for the transaction
 * @param {Number|String} ttl The relative ttl of the transaction
 * @param {Number|String} nonce the nonce of the transaction
 * @param {Boolean} encode encode transaction using Rlp and base64
 * @return {Object} { tx } Oracle respond query tx hash
 */
export function oracleRespondQueryTxNative ({ oracleId, responseTtl, queryId, response, fee, ttl, nonce }, encode = true) {
  let tx = [
    _int(OBJECT_TAG_ORACLE_RESPONSE_TRANSACTION),
    _int(VSN),
    _id(ID_TAG_ORACLE, oracleId, 'ok'),
    _int(nonce),
    decode(queryId, 'oq'),
    toBytes(response),
    _int(responseTtl.type === ORACLE_TTL_TYPES.delta ? 0 : 1),
    _int(responseTtl.value),
    _int(fee),
    _int(ttl)
  ]

  // Encode RLP
  tx = encode ? encodeTx(tx) : tx
  return { tx }
}
