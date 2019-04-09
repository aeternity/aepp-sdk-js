/* eslint-disable no-return-assign,no-unused-vars */
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
import { decryptMsg, encryptMsg, IDENTITY_METHODS, SDK_METHODS } from './helper'
import * as R from 'ramda'

const providers = {}
const sdkID = Math.random().toString(36).substring(7)

const SEND_HANDLERS = {
  [SDK_METHODS.sign]: function ([unsignedTx, tx]) {
    const [providerId] = getActiveProvider()
    if (!providerId) return Promise.reject(new Error('Active provider not found'))
    const params = [sdkID, Array.from(unsignedTx), tx]

    return new Promise((resolve, reject) => {
      providers[providerId].callbacks[tx] = { meta: { unsignedTx }, resolve, reject }
      post(this.self)(SDK_METHODS.sign, params)
    })
  },
  [SDK_METHODS.ready]: function (params) { post(this.self)(SDK_METHODS.ready, params, false) },
  [SDK_METHODS.deregisterProvider]: function (params) { post(this.self)(SDK_METHODS.deregisterProvider, params) },
  [SDK_METHODS.registerProvider]: function ([providerId]) {
    if (providers[providerId].status !== 'WAIT_FOR_REGISTER') return
    post(this.self)(SDK_METHODS.registerProvider, [providerId, sdkID], false)
    providers[providerId] = { status: 'REGISTERED_WAIT_FOR_ACCOUNT' }
  },
  [SDK_METHODS.broadcastResponse]: function (res) {
    if (res instanceof Error) return post(this.self)(SDK_METHODS.broadcastResponse, res)
    return post(this.self)(SDK_METHODS.broadcastResponse, res)
  }
}

const RECEIVE_HANDLERS = {
  [IDENTITY_METHODS.walletDetail]: function (msg) {
    const message = { ...msg, params: decryptMsg(msg) } // TODO check if sdkId is own sdkID
    const { params: [_, address, meta], providerId } = message

    if (providers[providerId].status !== 'REGISTERED_WAIT_FOR_ACCOUNT') return

    providers[providerId] = {
      meta,
      address,
      callbacks: {},
      status: 'REGISTRATION_COMPLETE',
      active: !getActiveProvider().length,
      deregisterProvider: () => this.postMessage(SDK_METHODS.deregisterProvider, [providerId])
    }
    this.onWalletChange(providers[providerId])
  },
  [IDENTITY_METHODS.registerRequest]: function ({ params: [providerId] }) {
    if (providers[providerId]) return
    providers[providerId] = {
      status: 'WAIT_FOR_REGISTER',
      providerId,
      registerProvider: () => this.postMessage(SDK_METHODS.registerProvider, [providerId])
    }
    this.onRegister(providers[providerId])
  },
  [IDENTITY_METHODS.broadcast]: function (msg) {
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

const post = (self) => (method, params, encrypted = true) => self.postMessage({
  jsonrpc: '2.0',
  id: 1,
  method,
  sdkId: sdkID,
  params: encrypted ? encryptMsg({ params }) : params
}, '*')

const getActiveProvider = () => Object.entries(providers).find(([_, { active }]) => active) || []

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
  if (!provider) throw new Error('Active provider not found')
  return provider && provider.address
    ? Promise.resolve(provider.address)
    : Promise.reject(new Error('Invalid address or address not defined'))
}

async function send (tx, options = {}) {
  const opt = R.merge(this.Ae.defaults, options)
  const signed = await this.signTransaction(tx)
  try {
    const response = await this.sendTransaction(signed, opt)
    this.postMessage(SDK_METHODS, [tx, response])
    return response
  } catch (e) {
    throw e
  }
}

/**
 * Send `ready` message that notify that sdk is initialized
 * @rtype () => void
 * @return void
 */
function ready () {
  this.postMessage(SDK_METHODS.ready, [true])
}

function onWalletChange (provider) {
  return true
}

function onRegister (provider) {
  return provider.registerProvider() // Register provider
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
  async init ({ self = window, onWalletChange = this.onWalletChange, onRegister = this.onRegister }) {
    this.self = self
    this.onWalletChange = onWalletChange
    this.onRegister = onRegister

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
  methods: {
    onWalletChange,
    onRegister,
    postMessage,
    processMessage,
    getActiveProvider,
    ready,
    sign,
    address,
    send
  }
})

export default RemoteAccount
