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

function run () {
  // Connect to extension using runtime
  this.extConnection.connect((msg) => {
    this.pageConnection.sendMessage(msg)
  })
  // Connect to page using window.postMessage
  this.pageConnection.connect((msg, source) => {
    if (source !== window) return
    this.extConnection.sendMessage(msg)
  })
}

function stop () {
  this.extConnection.disconnect()
  this.pageConnection.disconnect()
}

/**
 * ContentScriptBridge
 * @function
 * @alias module:@aeternity/aepp-sdk/es/account/remote
 * @rtype Stamp
 * @param {Object} [options={}] - Initializer object
 * @param {Object} options.keypair - Key pair to use
 * @param {String} options.keypair.publicKey - Public key
 * @param {String} options.keypair.secretKey - Private key
 * @return {Account}
 */
export const ContentScriptBridge = stampit({
  init ({ pageConnection, extConnection }) {
    if (!window) throw new Error('Window object not found, you can run bridge only in browser')
    if (!pageConnection) throw new Error('pageConnection required')
    if (!extConnection) throw new Error('extConnection required')
    this.pageConnection = pageConnection
    this.extConnection = extConnection
  },
  methods: { run, stop }
})

export default ContentScriptBridge
