/* eslint-disable no-undef */
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
 * Browser runtime connector module
 *
 * This is the complement to {@link module:@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection}.
 * @module @aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-runtime
 * @export BrowserRuntimeConnection
 * @example import BrowserRuntimeConnection from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-runtime'
 */
import stampit from '@stamp/it'

import WalletConnection from '.'
import { getBrowserAPI } from '../helpers'

/**
 * Disconnect
 * @function disconnect
 * @instance
 * @rtype () => void
 * @return {void}
 */
function disconnect () {
  this.port.disconnect()
}

/**
 * Connect
 * @function connect
 * @instance
 * @rtype (onMessage: Function, onDisconnect: Function) => void
 * @param {Function} onMessage - Message handler
 * @param {Function} onDisconnect - trigger when runtime connection in closed
 * @return {void}
 */
function connect (onMessage, onDisconnect) {
  if (this.port.onMessage.hasListeners()) throw new Error('You already connected')
  this.port.onMessage.addListener((msg, source) => {
    if (this.debug) console.log('Receive message: ', msg)
    onMessage(msg, source)
  })
  this.port.onDisconnect.addListener(() => {
    onDisconnect({}, this)
    this.port.disconnect()
  })
}

/**
 * Send message
 * @function sendMessage
 * @instance
 * @rtype (msg: Object) => void
 * @param {Object} msg - Message
 * @return {void}
 */
function sendMessage (msg) {
  if (!this.port) throw new Error('You dont have connection. Please connect before')
  if (this.debug) console.log('Send message: ', msg)
  this.port.postMessage(msg)
}

/**
 * Check if connected
 * @function isConnected
 * @instance
 * @rtype () => Boolean
 * @return {Boolean} Is connected
 */
function isConnected () {
  return this.port.onMessage.hasListeners()
}

/**
 * BrowserRuntimeConnection stamp
 * Handle browser runtime communication
 * @function
 * @alias module:@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-runtime
 * @rtype Stamp
 * @param {Object} params={} - Initializer object
 * @param {Object} params.port - Runtime `port` object
 * @param {Object} [params.connectionInfo={}] - Connection info object
 * @param {Boolean} [params.debug=false] - Debug flag
 * @return {Object}
 */

export const BrowserRuntimeConnection = stampit({
  init ({ connectionInfo = {}, port, debug = false }) {
    this.debug = debug
    this.connectionInfo = connectionInfo
    this.port = port || getBrowserAPI().runtime.connect(...[connectionInfo.id || undefined])
  },
  methods: { connect, sendMessage, disconnect, isConnected }
}, WalletConnection)

export default BrowserRuntimeConnection
