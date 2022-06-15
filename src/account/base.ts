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
 */

import { messageToHash, verifyMessage as verifyMessageCrypto, hash } from '../utils/crypto'
import { buildTx } from '../tx/builder'
import { decode } from '../tx/builder/helpers'
import { TX_TYPE } from '../tx/builder/schema'
import { getNetworkId } from '../node'
import { EncodedData } from '../utils/encoder'
import { concatBuffers } from '../utils/other'

/**
 * Check is provided object looks like an instance of AccountBase
 * @param {Object} acc - Object to check
 */
export const isAccountBase = (acc: AccountBase | any): boolean =>
  !['sign', 'address', 'signTransaction', 'signMessage'].some(f => typeof acc[f] !== 'function')

/**
 * Account is one of the three basic building blocks of an
 * {@link module:@aeternity/aepp-sdk/es/ae--Ae} client and provides access to a
 * signing key pair.
 * @alias module:@aeternity/aepp-sdk/es/account
 * @param {Object} [options={}] - Initializer object
 * @param {String} options.networkId - NETWORK_ID using for signing transaction's
 */
export default abstract class AccountBase {
  networkId?: string

  constructor ({ networkId }: { networkId?: string } = {}) {
    this.networkId ??= networkId
  }

  /**
   * Sign encoded transaction
   * @param {String} tx - Transaction to sign
   * @param {Object} opt - Options
   * @param {Object} [opt.innerTx] - Sign as inner transaction for PayingFor
   * @returns Signed transaction
   */
  async signTransaction (
    tx: EncodedData<'tx'>,
    { innerTx, networkId, ...options }: { innerTx?: boolean, networkId?: string } = {}
  ): Promise<EncodedData<'tx'>> {
    const prefixes = [await this.getNetworkId({ networkId })]
    if (innerTx === true) prefixes.push('inner_tx')
    const rlpBinaryTx = decode(tx)
    const txWithNetworkId = concatBuffers([Buffer.from(prefixes.join('-')), hash(rlpBinaryTx)])

    const signatures = [await this.sign(txWithNetworkId, options)]
    return buildTx({ encodedTx: rlpBinaryTx, signatures }, TX_TYPE.signed).tx
  }

  /**
   * Get network Id
   * @returns Network Id
   */
  readonly getNetworkId = getNetworkId

  /**
   * Sign message
   * @param {String} message - Message to sign
   * @param {Object} opt - Options
   * @returns Signature as hex string of Uint8Array
   */
  async signMessage (
    message: string, { returnHex = false, ...options }: { returnHex?: boolean } = {}
  ): Promise<string | Uint8Array> {
    const sig = await this.sign(messageToHash(message), options)
    return returnHex ? Buffer.from(sig).toString('hex') : sig
  }

  /**
   * Verify message
   * @param {String} message - Message to verify
   * @param {string | Uint8Array} signature - Signature
   * @param {Object} options - Options
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
   * @rtype (data: String) => data: Promise[String]
   * @param {String} data - Data blob to sign
   * @param {Object} options
   * @returns Signed data blob
   */
  abstract sign (data: string | Buffer, options?: any): Promise<Uint8Array>

  /**
   * Obtain account address
   * @returns Public account address
   */
  abstract address (opt?: object): Promise<EncodedData<'ak'>>
}
