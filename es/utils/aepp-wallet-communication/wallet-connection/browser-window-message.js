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
import WalletConnection from '.'
import AsyncInit from '../../async-init'
import uuid from 'uuid/v4'

function connect (onMessage) {
  const origin = this.origin
  if (this.listener) throw new Error('You already connected')
  this.listener = (msg) => {
    if (!msg || typeof msg.data !== 'object') return
    if (origin && origin !== msg.origin) return
    onMessage(msg.data, msg.source)
  }
  this.subscribeFn(this.listener)
}

function disconnect () {
  if (!this.listener) throw new Error('You dont have connection. Please connect before')
  this.unsubscribeFn(this.listener)
  this.listener = null
}

function sendMessage (msg) {
  this.postFn(msg)
}

/**
 * BrowserWindowMessageConnection
 * @function
 * @alias module:@aeternity/aepp-sdk/es/account/remote
 * @rtype Stamp
 * @param {Object} [options={}] - Initializer object
 * @param {Object} options.keypair - Key pair to use
 * @param {String} options.keypair.publicKey - Public key
 * @param {String} options.keypair.secretKey - Private key
 * @return {Account}
 */
export const BrowserWindowMessageConnection = AsyncInit.compose(WalletConnection, {
  async init ({ connectionInfo = {}, target = window.parent, self = window, origin }) {
    this.connectionInfo = { ...{ id: uuid() }, ...connectionInfo }

    this.origin = origin
    this.subscribeFn = (listener) => self.addEventListener('message', listener, false)
    this.unsubscribeFn = (listener) => self.removeEventListener('message', listener, false)
    this.postFn = (msg) => target.postMessage(msg, this.origin || '*')
    if (!this.connectionInfo.id) throw new Error('ID required.')
  },
  methods: { connect, sendMessage, disconnect, isConnected () { return this.listener } }
})

export default BrowserWindowMessageConnection
