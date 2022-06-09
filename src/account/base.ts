/*
 * ISC License (ISC)
 * Copyright (c) 2022 aeternity developers
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
import { messageToHash, verifyMessage as verifyMessageCrypto, hash } from '../utils/crypto'
import { buildTx } from '../tx/builder'
import { decode } from '../tx/builder/helpers'
import { TX_TYPE } from '../tx/builder/schema'
// @ts-expect-error
import { getNetworkId } from '../node'
import { EncodedData } from '../utils/encoder'
import { concatBuffers } from '../utils/other'

/**
 * Check is provided object looks like an instance of AccountBase
 * @rtype (Object) => Boolean
 * @param {Object} acc - Object to check
 * @return {Boolean}
 */
export const isAccountBase = (acc: _AccountBase | any): boolean =>
  !['sign', 'address', 'signTransaction', 'signMessage'].some(f => typeof acc[f] !== 'function')

export abstract class _AccountBase {
  networkId?: string

  // TODO: replace with constructor after dropping account stamps
  init ({ networkId }: { networkId?: string } = {}): void {
    this.networkId ??= networkId
  }

  /**
   * Sign encoded transaction
   * @instance
   * @category async
   * @rtype (tx: String) => tx: Promise[String], throws: Error
   * @param {String} tx - Transaction to sign
   * @param {Object} opt - Options
   * @param {Object} [opt.innerTx] - Sign as inner transaction for PayingFor
   * @return {String} Signed transaction
   */
  async signTransaction (
    tx: EncodedData<'tx'>,
    { innerTx, networkId, ...options }: { innerTx?: boolean, networkId?: string } = {}
  ): Promise<EncodedData<'tx'>> {
    const prefixes = [this.getNetworkId({ networkId })]
    if (innerTx === true) prefixes.push('inner_tx')
    const rlpBinaryTx = decode(tx)
    const txWithNetworkId = concatBuffers([Buffer.from(prefixes.join('-')), hash(rlpBinaryTx)])

    const signatures = [await this.sign(txWithNetworkId, options)]
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
  readonly getNetworkId = getNetworkId

  /**
   * Sign message
   * @instance
   * @category async
   * @rtype (msg: String) => signature: Promise[String], throws: Error
   * @param {String} message - Message to sign
   * @param {Object} opt - Options
   * @return {String} Signature
   */
  async signMessage (
    message: string, { returnHex = false, ...options }: { returnHex?: boolean } = {}
  ): Promise<string | Uint8Array> {
    const sig = await this.sign(messageToHash(message), options)
    return returnHex ? Buffer.from(sig).toString('hex') : sig
  }

  /**
   * Verify message
   * @instance
   * @category async
   * @rtype (
   *   msg: String, signature: String, publicKey: String
   * ) => isValid: Promise[boolean], throws: Error
   * @param {String} message - Message to verify
   * @param {string | Uint8Array} signature - Signature
   * @param {Object} options - Options
   * @return {Boolean}
   */
  async verifyMessage (
    message: string, signature: string | Uint8Array, options?: object
  ): Promise<boolean> {
    return verifyMessageCrypto(
      message,
      typeof signature === 'string' ? Buffer.from(signature, 'hex') : signature,
      decode(await this.address(options))
    )
  }

  /**
   * Sign data blob
   * @function sign
   * @instance
   * @abstract
   * @category async
   * @rtype (data: String) => data: Promise[String]
   * @param {String} data - Data blob to sign
   * @param {Object} options
   * @return {Uint8Array} Signed data blob
   */
  abstract sign (data: string | Buffer, options?: any): Promise<Uint8Array>

  /**
   * Obtain account address
   * @function address
   * @instance
   * @abstract
   * @category async
   * @rtype () => address: Promise[String]
   * @return {String} Public account address
   */
  abstract address (opt?: object): Promise<EncodedData<'ak'>>
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
 * @return {_AccountBase} Account instance
 */
export default stampit<_AccountBase>({
  init: _AccountBase.prototype.init,
  methods: {
    signTransaction: _AccountBase.prototype.signTransaction,
    getNetworkId,
    signMessage: _AccountBase.prototype.signMessage,
    verifyMessage: _AccountBase.prototype.verifyMessage
  }
}, required({
  methods: {
    sign: required,
    address: required
  }
}) as stampit.Composable)
