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
import AsyncInit from './async-init'
import BrowserRuntimeConnection from './aepp-wallet-communication/wallet-connection/browser-runtime'

const wallets = {}

const getWindow = () => {
  if (!window) throw new Error('Browser is not detected')
  return window
}

const handleDetection = (onDetected) => (msg) => {
  if (!msg || !msg.data || msg.data.type === 'webpackOk') return undefined
  const { data } = msg
  const ifExist = wallets.hasOwnProperty(data.id)
  if (msg && !ifExist) {
    const w = {
      ...data,
      async getConnection () {
        return BrowserRuntimeConnection({ connectionInfo: { extensionId: this.id } })
      }
    }
    onDetected({ wallets, newWallet: w })
    wallets[data.id] = w
  }
}

function scan (onDetected) {
  this.walletDetectionHandler = handleDetection(onDetected)
  getWindow().addEventListener('message', this.walletDetectionHandler, false)
}

function stopScan () {
  getWindow().removeEventListener('message', this.walletDetectionHandler, false)
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
  async init () {
  },
  methods: { scan, stopScan }
})

export default ExtWalletDetector
