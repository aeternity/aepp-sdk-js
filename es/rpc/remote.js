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

const METHODS = {
  ...SDK_METHODS,
  ...IDENTITY_METHODS
}

const sdkID = '1KGVZ2AFqAybJkpdKCzP/0W4W/0BQZaDH6en8g7VstQ='

const HANDLERS = {
  [IDENTITY_METHODS.walletDetail]: ({ params: [sdkId, address, meta] }) => {
    const [providerId] = Object.keys(providers)
    providers[providerId] = { meta, address, active: true, callbacks: {} }
    // @TODO call callback that notify dapp about change
  },
  [IDENTITY_METHODS.registerRequest]: ({ params: [providerId] }) => {
    if (Object.keys(providers).length) return
    providers[providerId] = {}
    post(METHODS.registerProvider, [providerId, sdkID], false)
  },
  [IDENTITY_METHODS.broadcast]: (msg) => {
    const message = { ...msg, params: decryptMsg(msg) }
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
  },
  [SDK_METHODS.sign]: ([unsignedTx, tx]) => {
    const [providerId] = getActiveProvider()
    const params = [providerId, unsignedTx, tx]
    return new Promise((resolve, reject) => {
      providers[providerId].callbacks[tx] = { meta: { unsignedTx }, resolve, reject }
      post(SDK_METHODS.sign, params)
    })
  },
  [SDK_METHODS.ready]: (params) => post(SDK_METHODS.ready, params, false)
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
  const handler = HANDLERS[method].bind(this)
  if (handler) return handler(params)

  console.warn('Unknown message method')
}

function processMessage (msg) {
  if (HANDLERS[msg.method]) return HANDLERS[msg.method].bind(this)(msg)
  console.warn('Unknown message method')
}

async function sign (unsignedTx, { tx }) {
  return this.postMessage(METHODS.sign, [unsignedTx, tx])
}

async function address () {
  const [_, provider] = this.getActiveProvider()
  return provider.address
    ? Promise.resolve(provider.address)
    : Promise.reject(new Error('Provider not found'))
}

function ready () {
  this.postMessage(METHODS.ready, [true])
}

/**
 * RPC client Stamp
 * @function
 * @alias module:@aeternity/aepp-sdk/es/rpc/client
 * @rtype Stamp
 * @param {Object} [options={}] - Initializer object
 * @param {Object} [options.parent=window.parent] - IFrame parent window
 * @param {Object} [options.self=window] - IFrame window
 * @return {Object} RPC client
 * @example RpcClient()
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
