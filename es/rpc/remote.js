/* eslint-disable no-return-assign */
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
 * RPC client module
 * @module @aeternity/aepp-sdk/es/rpc/client
 * @export RpcClient
 * @example import RpcClient from '@aeternity/aepp-sdk/es/rpc/client'
 */

import stampit from '@stamp/it'

const providers = {}

const IDENTITY_METHODS = {
  broadcast: 'ae:broadcast',
  walletDetail: 'ae:walletDetail',
  registerRequest: 'ae:registerProvider'
}

const SDK_METHODS = {
  sign: 'ae:sign',
  ready: 'ae:sdkReady',
  registerProvider: 'ae:registrationComplete',
  deregisterProvider: 'ae:deregister'
}

const sdkID = '1KGVZ2AFqAybJkpdKCzP/0W4W/0BQZaDH6en8g7VstQ='

const SEND_HANDLERS = {
  [SDK_METHODS.sign]: ([unsignedTx, tx]) => {
    const [providerId] = getActiveProvider()
    if (!providerId) return Promise.reject(new Error('Active provider not found'))
    const params = [providerId, unsignedTx, tx]

    return new Promise((resolve, reject) => {
      providers[providerId].callbacks[tx] = { meta: { unsignedTx }, resolve, reject }
      post(SDK_METHODS.sign, params)
    })
  },
  [SDK_METHODS.ready]: (params) => post(SDK_METHODS.ready, params, false)
}

const RECEIVE_HANDLERS = {
  [IDENTITY_METHODS.walletDetail]: (msg) => {
    const message = { ...msg, params: decryptMsg(msg) } // TODO check if sdkId is own sdkID
    const { params: [_, address, meta] } = message

    const [providerId] = Object.keys(providers)

    providers[providerId] = { meta, address, active: true, callbacks: {}, status: 'REGISTERED' }
    // @TODO call callback that notify dapp about change
  },
  [IDENTITY_METHODS.registerRequest]: ({ params: [providerId] }) => { // TODO Think about multiple provider registration
    if (this.getActiveProvider().length) return // TODO Allow only one active provider
    providers[providerId] = { status: 'WAIT_FOR_REGISTER' }
    post(SDK_METHODS.registerProvider, [providerId, sdkID], false) // Register provider
  },
  [IDENTITY_METHODS.broadcast]: (msg) => {
    const message = { ...msg, params: decryptMsg(msg) } // TODO check if sdkId is own ID
    const { error, params: [_, rawTx, signedTx] } = message

    const [providerId] = getActiveProvider()

    if (providers[providerId].callbacks[rawTx]) {
      if (rawTx) {
        providers[providerId].callbacks[rawTx].resolve(signedTx)
      } else if (error) {
        providers[providerId].callbacks[rawTx].reject(error)
      }
      delete providers[providerId].callbacks[rawTx]
    }
  }
}

const post = (method, params, encrypted = true) => window.postMessage({
  jsonrpc: '2.0',
  id: 1,
  method,
  params: encrypted ? encryptMsg({ params }) : params
}, '*')

const getActiveProvider = () => Object.entries(providers).find(([_, { active }]) => active) || []

const decryptMsg = ({ params }) => {
  // @TODO Implement encryption
  return params
}

function encryptMsg ({ params }) {
  // @TODO Implement encryption
  return params
}

// INTERFACE
function postMessage (method, params) {
  if (SEND_HANDLERS[method]) return SEND_HANDLERS[method].bind(this)(params)
  console.warn('Unknown message method')
}

function processMessage (msg) {
  if (RECEIVE_HANDLERS[msg.method]) return RECEIVE_HANDLERS[msg.method].bind(this)(msg)
  console.warn('Unknown message method')
}

/**
 * Sign the transaction
 * @async
 * @function sing
 * @rtype (unsignedTx: Buffer, options: Object) => Promise<Buffer>
 * @param unsignedTx Buffer like [...networkId, ...unsignedTx]
 * @param tx [options.tx] Unsigned transaction base64c string
 * @return Promise<Buffer> Signature
 */
async function sign (unsignedTx, { tx }) {
  return this.postMessage(SDK_METHODS.sign, [unsignedTx, tx])
}

/**
 * Get Account Public key
 * @async
 * @function address
 * @rtype () => Promise<String>
 * @throws Error('Provider not found')
 * @return String address Account public key
 * Send `ready` message that notify that sdk is initialized
 */
async function address () {
  const [_, provider] = this.getActiveProvider()
  return provider.address
    ? Promise.resolve(provider.address)
    : Promise.reject(new Error('Active provider not found'))
}

/**
 * Send `ready` message that notify that sdk is initialized
 * @rtype () => void
 * @return void
 */
function ready () {
  this.postMessage(SDK_METHODS.ready, [true])
}

/**
 * RemoteAccount client Stamp
 * @function
 * @alias module:@aeternity/aepp-sdk/es/rpc/remote
 * @rtype Stamp
 * @param {Object} [options={}] - Initializer object
 * @param {Object} [options.self=window] - Window object
 * @return {Object} Remote Account Client
 * @example RemoteAccount({ self = window }).then(async account => console.log(await account.address())
 */
const RemoteAccount = stampit({
  async init ({ self = window }) {
    function receive ({ data }) {
      if (typeof data !== 'object' || data.type === 'webpackOk' || Object.values(SDK_METHODS).includes(data.method)) {
        return
      }

      this.processMessage(data)
      return true
    }

    const handler = receive.bind(this)
    self.addEventListener('message', handler, false)

    this.destroyClient = () =>
      self.removeEventListener('message', handler, false)
    // SEND READY
    this.ready()
  },
  props: {},
  methods: {
    postMessage,
    processMessage,
    getActiveProvider,
    ready,
    sign,
    address
  }
})

export default RemoteAccount
