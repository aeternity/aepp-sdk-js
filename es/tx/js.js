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
import {encodeBase58Check, hash, salt} from '../utils/crypto'

const createSalt = salt

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
 * name, base 58 encoding the result and prepending 'cm$'
 *
 * @param {string} name - Name to be registered
 * @param {number} salt
 * @return {string} Commitment hash
 */
async function commitmentHash (name, salt = createSalt()) {
  return `cm$${encodeBase58Check(hash(Buffer.concat([hash(name), formatSalt(salt)])))}`
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
const JsTx = stampit({methods: {commitmentHash}})

export default JsTx
