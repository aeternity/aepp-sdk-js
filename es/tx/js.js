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

import stampit from '@stamp/it'
import {
  encodeBase58Check,
  decodeBase58Check,
  hash,
  nameId,
  salt,
  encodeTx,
  assertedType
} from '../utils/crypto'
import { toBytes } from '../utils/bytes'

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
// const OBJECT_TAG_ORACLE_REGISTER_TRANSACTION = 22
// const OBJECT_TAG_ORACLE_QUERY_TRANSACTION = 23
// const OBJECT_TAG_ORACLE_RESPONSE_TRANSACTION = 24
// const OBJECT_TAG_ORACLE_EXTEND_TRANSACTION = 25
// const OBJECT_TAG_NAME_SERVICE_NAME = 30
// const OBJECT_TAG_NAME_SERVICE_COMMITMENT = 31
const OBJECT_TAG_NAME_SERVICE_CLAIM_TRANSACTION = 32
const OBJECT_TAG_NAME_SERVICE_PRECLAIM_TRANSACTION = 33
const OBJECT_TAG_NAME_SERVICE_UPDATE_TRANSACTION = 34
const OBJECT_TAG_NAME_SERVICE_REVOKE_TRANSACTION = 35
const OBJECT_TAG_NAME_SERVICE_TRANSFER_TRANSACTION = 36
// const OBJECT_TAG_CONTRACT = 40
// const OBJECT_TAG_CONTRACT_CALL = 41
// const OBJECT_TAG_CONTRACT_CREATE_TRANSACTION = 42
// const OBJECT_TAG_CONTRACT_CALL_TRANSACTION = 43
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

const createSalt = salt
/**
 * JavaScript-based Tx Stamp
 *
 * This incomplete implementation of {@link module:@aeternity/aepp-sdk/es/tx--Tx}
 * will eventually provide native code to produce transactions from scratch.
 * @function
 * @alias module:@aeternity/aepp-sdk/es/tx/js
 * @rtype Stamp
 * @param {Object} [options={}] - Initializer object
 * @return {Object} Tx instance
 * @example JsTx()
 */


/**
 * Decode data using the default encoding/decoding algorithm
 *
 * @param {string} data  An encoded and prefixed string (ex tx_..., sg_..., ak_....)
 * @param {string} type Prefix of Transaction
 * @return {Buffer} Buffer of decoded Base58 data
 */
export function decode (data, type) {
  if (!type) return decodeBase58Check(data.split('_')[1])
  return decodeBase58Check(assertedType(data, type))
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
 * Format the salt into a 64-byte hex string
 *
 * @param {number} salt
 * @return {string} Zero-padded hex string of salt
 */
function formatSalt (salt) {
  return Buffer.from(salt.toString(16).padStart(64, '0'), 'hex')
}

/**
 * Generate the commitment hash by hashing the formatted salt and
 * name, base 58 encoding the result and prepending 'cm_'
 *
 * @param {string} name - Name to be registered
 * @param {number} salt
 * @return {string} Commitment hash
 */
async function commitmentHash (name, salt = createSalt()) {
  return `cm_${encodeBase58Check(hash(Buffer.concat([nameId(name), formatSalt(salt)])))}`
}

/**
 * Helper function to build pointers for name update TX
 *
 * @param {Array} pointers - Array of pointers ([ { key: 'account_pubkey', id: 'ak_32klj5j23k23j5423l434l2j3423'} ])
 * @return {Array} Serialized pointers array
 */
function buildPointers (pointers) {
  const POINTERS_TAGS = {
    "account_pubkey": ID_TAG_ACCOUNT,
    "oracle_pubkey": ID_TAG_ORACLE,
    "contract_pubkey": ID_TAG_CONTRACT,
    "channel_pubkey": ID_TAG_CHANNEL
  }
  return pointers.map(p => [toBytes(p['key']), _id(POINTERS_TAGS[p['key']], p['id'])])
}

/**
 * Create a spend transaction
 *
 * @param {string} recipientId The public key of the recipient
 * @param {number} amount The amount to send
 * @param {string} payload The payload associated with the data
 * @param {number} fee The fee for the transaction
 * @param {number} ttl The relative ttl of the transaction
 * @param {number} nonce the nonce of the transaction
 * @return {Object}  { tx } Encrypted spend tx hash
 */
async function spendTxNative ({ recipientId, amount, payload, fee, ttl, nonce }) {
  const address = await this.address()

  let tx = [
    toBytes(OBJECT_TAG_SPEND_TRANSACTION),
    toBytes(VSN),
    _id(ID_TAG_ACCOUNT, address, 'ak'),
    _id(ID_TAG_ACCOUNT, recipientId, 'ak'),
    toBytes(amount, true),
    toBytes(fee),
    toBytes(ttl),
    toBytes(nonce),
    toBytes(payload)
  ]
  // Encode RLP
  tx = encodeTx(tx)
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
 * @return {Object} { tx } Encrypted name pre-claim tx hash
 */
function namePreclaimTxNative ({ accountId, nonce, commitmentId, fee, ttl }) {
  let tx = [
    toBytes(OBJECT_TAG_NAME_SERVICE_PRECLAIM_TRANSACTION),
    toBytes(VSN),
    _id(ID_TAG_ACCOUNT, accountId, 'ak'),
    toBytes(nonce),
    _id(ID_TAG_COMMITMENT, commitmentId, 'cm'),
    toBytes(fee),
    toBytes(ttl),
  ]

  // Encode RLP
  tx = encodeTx(tx)
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
 * @return {Object}  { tx } Encrypted name claim tx hash
 */
function nameClaimTxNative ({ accountId, nonce, name, nameSalt, fee, ttl }) {
  let tx = [
    toBytes(OBJECT_TAG_NAME_SERVICE_CLAIM_TRANSACTION),
    toBytes(VSN),
    _id(ID_TAG_ACCOUNT, accountId, 'ak'),
    toBytes(nonce),
    decode(name, 'nm'),
    toBytes(nameSalt),
    toBytes(fee),
    toBytes(ttl),
  ]

  // Encode RLP
  tx = encodeTx(tx)
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
 * @return {Object} { tx } Encrypted name update tx hash
 */
function nameUpdateTxNative ({ accountId, nonce, nameId, nameTtl, pointers, clientTtl, fee, ttl }) {
  // Build pointers
  pointers = buildPointers(pointers)

  let tx = [
    toBytes(OBJECT_TAG_NAME_SERVICE_UPDATE_TRANSACTION),
    toBytes(VSN),
    _id(ID_TAG_ACCOUNT, accountId, 'ak'),
    toBytes(nonce),
    _id(ID_TAG_NAME, nameId, 'nm'),
    toBytes(nameTtl),
    pointers,
    toBytes(clientTtl),
    toBytes(fee),
    toBytes(ttl),
  ]

  // Encode RLP
  tx = encodeTx(tx)
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
 * @return {Object} { tx } Encrypted name transfer tx hash
 */
function nameTransferTxNative ({ accountId, nonce, nameId, recipientId, fee, ttl }) {
  let tx = [
    toBytes(OBJECT_TAG_NAME_SERVICE_TRANSFER_TRANSACTION),
    toBytes(VSN),
    _id(ID_TAG_ACCOUNT, accountId, 'ak'),
    toBytes(nonce),
    _id(ID_TAG_NAME, nameId, 'nm'),
    _id(ID_TAG_ACCOUNT, recipientId, 'ak'),
    toBytes(fee),
    toBytes(ttl),
  ]

  // Encode RLP
  tx = encodeTx(tx)
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
 * @return {Object} { tx } Encrypted name revoke tx hash
 */
function nameRevokeTxNative ({ accountId, nonce, nameId, fee, ttl }) {
  let tx = [
    toBytes(OBJECT_TAG_NAME_SERVICE_REVOKE_TRANSACTION),
    toBytes(VSN),
    _id(ID_TAG_ACCOUNT, accountId, 'ak'),
    toBytes(nonce),
    _id(ID_TAG_NAME, nameId, 'nm'),
    toBytes(fee),
    toBytes(ttl),
  ]

  // Encode RLP
  tx = encodeTx(tx)
  return { tx }
}

const JsTx = stampit({
  methods: {
    commitmentHash,
    spendTxNative,
    namePreclaimTxNative,
    nameClaimTxNative,
    nameUpdateTxNative,
    nameTransferTxNative,
    nameRevokeTxNative
  }
})

export default JsTx
