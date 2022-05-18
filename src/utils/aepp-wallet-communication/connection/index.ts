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
 * Wallet Connection base module
 * @module @aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection
 * @export WalletConnection
 * @example
 * import WalletConnection from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection'
 */

/**
 * Basic Wallet Connection
 *
 * This stamp include interface for wallet connection functionality.
 * Attempting to create instances from the Stamp without overwriting all
 * abstract methods using composition will result in an exception.
 * @alias module:@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection
 * @param {Object} [options={}] - Initializer object
 * @return {Object} WalletConnection instance
 */
export default interface WalletConnection{
  /**
   * Connect
   * @instance
   * @param onMessage - Message handler
   * @param onDisconnect - trigger when runtime connection in closed
   */
  connect: (onMessage: Function, onDisconnect?: (msg?: any, client?: any) => void
  ) => void
  /**
   * Disconnect
   * @instance
   * @return {void}
   */
  disconnect: () => void
  /**
   * Send message
   * @instance
   * @param msg - Message
   */
  sendMessage: (msg: object) => void
  /**
   * Check if connected
   * @instance
   * @return Is connected
   */
  isConnected: () => boolean
}
