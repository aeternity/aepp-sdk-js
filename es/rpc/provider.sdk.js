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
import AsyncInit from '../utils/async-init'
import Account from '../account'

const IDENTITY_METHODS = {
  broadcast: 'ae:broadcast',
  walletDetail: 'ae:walletDetail',
  registerRequest: 'ae:registerProvider'
}

const SDK_METHODS = {
  sign: 'ae:sign', // WITH CALLBACK
  ready: 'ae:sdkReady',
  registerProvider: 'ae:registrationComplete',
  deregisterProvider: 'ae:deregister'
}

const METHODS = {
  ...SDK_METHODS,
  ...IDENTITY_METHODS
}

const RPC_METHOD = (encrypted = true, hasCallback = false) => [encrypted, hasCallback]

const RPC = {
  [METHODS.sign]: RPC_METHOD(true, METHODS.broadcast),
  [METHODS.ready]: RPC_METHOD(false),
  [METHODS.registerProvider]: RPC_METHOD(false),
  [METHODS.deregisterProvider]: RPC_METHOD(false),
  [METHODS.walletDetail]: RPC_METHOD(true),
  [METHODS.registerRequest]: RPC_METHOD(false),
  [METHODS.broadcast]: RPC_METHOD(false, true)
}

const HANDLERS = {
  [IDENTITY_METHODS.walletDetail]: ({ providerId, params: { address, meta } }) => this.providers[providerId] = { meta, address },
  [IDENTITY_METHODS.registerRequest]: ({ params: [providerId] }) => this.providers[providerId] = {}
}

const getActiveProvider = () => Object.entries(this.providers).find(([_, { active }]) => active)

const decryptMsg = ({ params }) => {
  // @TODO Implement encryption
  return params
}

function encryptMsg ({ params }) {
  // @TODO Implement encryption
  return params
}

function postMessage (method, params) {
  debugger
  const [encrypted, callback] = RPC[method]

  const ret = new Promise((resolve, reject) => {
    if (callback) {
      const providerId = 1
      const unsignedTx = ''
      this.providers[providerId].callbacks[unsignedTx] = { meta: { unsignedTx }, resolve, reject }
    } else {
      resolve()
    }
  })

  window.postMessage({ jsonrpc: '2.0', id: 1, method, params: encrypted ? encryptMsg({ params }) : params }, '*')

  return ret
}

function processMessage (msg) {
  const [encrypted, callback] = RPC[msg.method]
  const message = encrypted ? decryptMsg(msg) : msg

  const { method, error, params: { providerId, signedTx } } = message

  if (HANDLERS[method]) HANDLERS[method].bind(this)(message)
  if (typeof callback === 'string') {
    if (this.providers[providerId].callbacks[method]) {
      if (providerId) {
        this.providers[providerId].callbacks[method].resolve({ signedTx })
      } else if (error) {
        this.providers[providerId].callbacks[method].reject(error)
      }
      delete this.providers[providerId].callbacks[method]
    }
  }
}

async function sign (unsignedTx, meta) {
  return this.postMessage(METHODS.sign, { unsignedTx, meta })
}

async function address () {
  const provider = this.getActiveProvider()
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
      if (typeof data !== 'object' || data.type === 'webpackOk') {
        return
      }
      debugger

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
  props: {
    providers: {}
  },
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
