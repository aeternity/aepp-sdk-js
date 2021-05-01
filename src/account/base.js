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
 * AccountBase module
 * @module @aeternity/aepp-sdk/es/account/base
 * @export AccountBase
 * @export isAccountBase
 */

import stampit from '@stamp/it'
import { required } from '@stamp/required'
import { hash, personalMessageToBinary, decodeBase64Check, assertedType, verifyPersonalMessage } from '../utils/crypto'
import { buildTx, buildTxHash } from '../tx/builder'
import { decode } from '../tx/builder/helpers'
import { TX_TYPE } from '../tx/builder/schema'
import { getNetworkId } from '../node'

/**
 * Check is provided object looks like an instance of AccountBase
 * @rtype (Object) => Boolean
 * @param {Object} acc - Object to check
 * @return {Boolean}
 */
export const isAccountBase = (acc) => !['sign', 'address'].find(f => typeof acc[f] !== 'function')

/**
 * Sign encoded transaction
 * @instance
 * @category async
 * @rtype (tx: String) => tx: Promise[String], throws: Error
 * @param {String} tx - Transaction to sign
 * @param {Object} opt - Options
 * @return {String} Signed transaction
 */
async function signTransaction (tx, opt) {
  const networkId = this.getNetworkId(opt)
  const rlpBinaryTx = decodeBase64Check(assertedType(tx, 'tx'))
  const txWithNetworkId = Buffer.concat([
    Buffer.from(networkId),
    buildTxHash(rlpBinaryTx, { raw: true })
  ])

  const signatures = [await this.sign(txWithNetworkId, opt)]
  return buildTx({ encodedTx: rlpBinaryTx, signatures }, TX_TYPE.signed).tx
}

/**
 * Get network Id
 * @instance
 * @function getNetworkId
 * @category async
 * @rtype () => networkId: String
 * @return {String} Network Id
 */

/**
 * Sign message
 * @instance
 * @category async
 * @rtype (msg: String) => signature: Promise[String], throws: Error
 * @param {String} message - Message to sign
 * @param {Object} opt - Options
 * @return {String} Signature
 */
async function signMessage (message, opt = { returnHex: false }) {
  const sig = await this.sign(hash(personalMessageToBinary(message)), opt)
  return opt.returnHex ? Buffer.from(sig).toString('hex') : sig
}

/**
 * Verify message
 * @instance
 * @category async
 * @rtype (msg: String, signature: String, publicKey: String) => signature: Promise[String], throws: Error
 * @param {String} message - Message to verify
 * @param {String} signature - Signature
 * @param {Object} opt - Options
 * @return {Boolean}
 */
async function verifyMessage (message, signature, opt = {}) {
  return verifyPersonalMessage(message, typeof signature === 'string' ? Buffer.from(signature, 'hex') : signature, decode(await this.address(opt)))
}

/**
 * AccountBase Stamp
 *
 * Attempting to create instances from the Stamp without overwriting all
 * abstract methods using composition will result in an exception.
 *
 * Account is one of the three basic building blocks of an
 * {@link module:@aeternity/aepp-sdk/es/ae--Ae} client and provides access to a
 * signing key pair.
 * @function
 * @alias module:@aeternity/aepp-sdk/es/account
 * @rtype Stamp
 * @param {Object} [options={}] - Initializer object
 * @param {String} options.networkId - NETWORK_ID using for signing transaction's
 * @return {Object} Account instance
 */
export default stampit({
  init ({ networkId }) { // NETWORK_ID using for signing transaction's
    if (!this.networkId && networkId) {
      this.networkId = networkId
    }
  },
  methods: { signTransaction, getNetworkId, signMessage, verifyMessage }
}, required({
  methods: {
    sign: required,
    address: required
  }
}))

/**
 * Sign data blob
 * @function sign
 * @instance
 * @abstract
 * @category async
 * @rtype (data: String) => data: Promise[String]
 * @param {String} data - Data blob to sign
 * @return {String} Signed data blob
 */

/**
 * Obtain account address
 * @function address
 * @instance
 * @abstract
 * @category async
 * @rtype () => address: Promise[String]
 * @return {String} Public account address
 */
