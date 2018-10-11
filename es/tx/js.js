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
import { encodeBase58Check, decodeBase58Check, hash, nameId, salt } from '../utils/crypto'

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

const OBJECT_TAG_ACCOUNT = 10
const OBJECT_TAG_SIGNED_TRANSACTION = 11
const OBJECT_TAG_SPEND_TRANSACTION = 12
const OBJECT_TAG_ORACLE = 20
const OBJECT_TAG_ORACLE_QUERY = 21
const OBJECT_TAG_ORACLE_REGISTER_TRANSACTION = 22
const OBJECT_TAG_ORACLE_QUERY_TRANSACTION = 23
const OBJECT_TAG_ORACLE_RESPONSE_TRANSACTION = 24
const OBJECT_TAG_ORACLE_EXTEND_TRANSACTION = 25
const OBJECT_TAG_NAME_SERVICE_NAME = 30
const OBJECT_TAG_NAME_SERVICE_COMMITMENT = 31
const OBJECT_TAG_NAME_SERVICE_CLAIM_TRANSACTION = 32
const OBJECT_TAG_NAME_SERVICE_PRECLAIM_TRANSACTION = 33
const OBJECT_TAG_NAME_SERVICE_UPDATE_TRANSACTION = 34
const OBJECT_TAG_NAME_SERVICE_REVOKE_TRANSACTION = 35
const OBJECT_TAG_NAME_SERVICE_TRANSFER_TRANSACTION = 36
const OBJECT_TAG_CONTRACT = 40
const OBJECT_TAG_CONTRACT_CALL = 41
const OBJECT_TAG_CONTRACT_CREATE_TRANSACTION = 42
const OBJECT_TAG_CONTRACT_CALL_TRANSACTION = 43
const OBJECT_TAG_CHANNEL_CREATE_TRANSACTION = 50
const OBJECT_TAG_CHANNEL_DEPOSIT_TRANSACTION = 51
const OBJECT_TAG_CHANNEL_WITHDRAW_TRANSACTION = 52
const OBJECT_TAG_CHANNEL_FORCE_PROGRESS_TRANSACTION = 521
const OBJECT_TAG_CHANNEL_CLOSE_MUTUAL_TRANSACTION = 53
const OBJECT_TAG_CHANNEL_CLOSE_SOLO_TRANSACTION = 54
const OBJECT_TAG_CHANNEL_SLASH_TRANSACTION = 55
const OBJECT_TAG_CHANNEL_SETTLE_TRANSACTION = 56
const OBJECT_TAG_CHANNEL_OFF_CHAIN_TRANSACTION = 57
const OBJECT_TAG_CHANNEL_OFF_CHAIN_UPDATE_TRANSFER = 570
const OBJECT_TAG_CHANNEL_OFF_CHAIN_UPDATE_DEPOSIT = 571
const OBJECT_TAG_CHANNEL_OFF_CHAIN_UPDATE_WITHDRAWAL = 572
const OBJECT_TAG_CHANNEL_OFF_CHAIN_UPDATE_CREATE_CONTRACT = 573
const OBJECT_TAG_CHANNEL_OFF_CHAIN_UPDATE_CALL_CONTRACT = 574
const OBJECT_TAG_CHANNEL = 58
const OBJECT_TAG_CHANNEL_SNAPSHOT_TRANSACTION = 59
const OBJECT_TAG_POI = 60
const OBJECT_TAG_MICRO_BODY = 101
const OBJECT_TAG_LIGHT_MICRO_BLOCK = 102


const createSalt = salt
// HELPERS

/**
 * Compute the absolute ttl by adding the ttl to the current height of the chain
 *
 * @param {number} relativeTtl
 * @return {number} Absolute Ttl
 */
async function computeAbsoluteTtl (relativeTtl) {
  if (relativeTtl <= 0) throw new Error('ttl must be greather than 0')

  const { height } = await this.api.getCurrentKeyBlock()
  return +(height) + relativeTtl
}

/**
 * Get the next nonce to be used for a transaction for an account
 *
 * @param {string} accountAddress
 * @return {number} Next Nonce
 */
async function getNextNonce (accountAddress) {
  return +(await this.api.getAccountByPubkey(accountId)).nonce + 1
}

/**
 * Helper method to compute both ttl and nonce
 *
 * @param {number} relativeTtl
 * @param {string} accountAddress
 * @return {object} { nonce, ttl } Object which contain next nonce and absolute ttl
 */
async function getNonceTtl (relativeTtl, accountAddress) {
  return {
    ttl: await computeAbsoluteTtl.bind(this)(relativeTtl),
    nonce: await getNextNonce.bind(this)(accountAddress)
  }
}

//


/**
 * Generate the hash from a signed and encoded transaction
 *
 * @param {number} signedTx an encoded signed transaction
 */
async function computeTxHash(signedTx) {
  if (signedTx[2] !== '_') throw new Error('Invalid hash')

  const signed = decodeBase58Check(signedTx.slice(3))
  return encode('tx', hash(signed))
}

/**
 * Encode data using the default encoding/decoding algorithm and prepending the prefix with a prefix, ex: ak_encoded_data, th_encoded_data,...
 *
 * @param {string} pref TX Prefix
 * @param {buffer} data Data to encode
 */
async function encode(pref, data) {
  return `${pref}_${encodeBase58Check(data)}`
}

async function encodeSignedTransaction(signedTx, signature) {}

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
const JsTx = stampit({ methods: { commitmentHash } })

export default JsTx
