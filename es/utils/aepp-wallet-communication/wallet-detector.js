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
import AsyncInit from '../async-init'
import BrowserRuntimeConnection from './wallet-connection/browser-runtime'
import BrowserWindowMessageConnection from './wallet-connection/browser-window-message'
import { METHODS } from './schema'

const wallets = {}

const isInIframe = () => window !== window.parent

const handleDetection = (onDetected) => ({ method, params }, source) => {
  if (!method || !params) return
  const ifExist = wallets.hasOwnProperty(params.id)
  if (method === METHODS.wallet.readyToConnect && !ifExist) {
    const w = {
      ...params,
      async getConnection () {
        // if detect extension wallet or page wallet
        return this.type === 'extension'
          ? BrowserRuntimeConnection({ connectionInfo: this })
          : BrowserWindowMessageConnection({ connectionInfo: this, origin: this.origin, target: isInIframe() ? window.parent : source })
      }
    }
    wallets[w.id] = w
    onDetected({ wallets, newWallet: w })
  }
}

function scan (onDetected) {
  this.connection.connect(handleDetection(onDetected))
}

function stopScan () {
  this.connection.disconnect()
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
export const ExtWalletDetector = AsyncInit.compose({
  async init ({ connection }) {
    if (!window) throw new Error('Window object not found, you can run wallet detector only in browser')
    this.connection = connection
  },
  methods: { scan, stopScan }
})

export default ExtWalletDetector
