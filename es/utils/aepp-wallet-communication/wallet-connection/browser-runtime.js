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
 * This is the complement to {@link module:@aeternity/aepp-sdk/es/utils/wallet-connection}.
 * @module @aeternity/aepp-sdk/es/utils/wallet-connection/browser-runtime
 * @export BrowserRuntimeConnection
 * @example import BrowserRuntimeConnection from '@aeternity/aepp-sdk/es/utils/wallet-connection/browser-runtime'
 */
import stampit from '@stamp/it'
import WalletConnection from '.'
import { getBrowserAPI } from '../helpers'

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

function disconnect () {
  this.port.disconnect()
}

function sendMessage (msg) {
  if (!this.port) throw new Error('You dont have connection. Please connect before')
  if (this.debug) console.log('Send message: ', msg)
  this.port.postMessage(msg)
}

/**
 * RemoteAccount
 * @function
 * @alias module:@aeternity/aepp-sdk/es/account/remote
 * @rtype Stamp
 * @param {Object} [options={}] - Initializer object
 * @param {Object} options.keypair - Key pair to use
 * @param {String} options.keypair.publicKey - Public key
 * @param {String} options.keypair.secretKey - Private key
 * @return {Account}
 */

export const BrowserRuntimeConnection = stampit({
  init ({ connectionInfo = {}, port, debug = false }) {
    this.debug = debug
    this.connectionInfo = connectionInfo
    this.port = port || getBrowserAPI().runtime.connect(...[connectionInfo.id || undefined])
  },
  methods: { connect, sendMessage, disconnect, isConnected () { return this.port.onMessage.hasListeners() } }
}, WalletConnection)

export default BrowserRuntimeConnection
