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
 * ExtensionProvider
 * @module @aeternity/aepp-sdk/es/provider/extension
 * @export RpcClient
 * @example import RpcClient from '@aeternity/aepp-sdk/provider/extension'
 */

import { decryptMsg, encryptMsg, IDENTITY_METHODS, SDK_METHODS } from './helper'
import AsyncInit from '../utils/async-init'

const sdks = {}

const indentityID = 'bobS3qRvWfDxCpmedQYzp3xrK5jVUS4MSto99QrCdySSMjYnd'

const RECEIVE_HANDLERS = {
  [SDK_METHODS.sign]: async function (msg) {
    const message = decryptMsg(msg)
    const [sdkId, unsignedTx, tx] = message

    sdks[sdkId].signCallbacks[tx] = { unsignedTx, meta: { tx } }
    this.onSign({ sdkId, meta: { tx } })
    // TODO show confirm
    this.postMessage(IDENTITY_METHODS.broadcast, [sdkId, tx, unsignedTx])
  },
  [SDK_METHODS.ready]: () => post(IDENTITY_METHODS.registerRequest, [indentityID], false),
  [SDK_METHODS.registerProvider]: function ({ params: [identityId, sdkId] }) {
    if (!sdks[sdkId]) sdks[sdkId] = { signCallbacks: {}, sdkId }

    this.onSdkRegister(sdks[sdkId])
    // TODO share detail without asking
    this.postMessage(IDENTITY_METHODS.walletDetail, [sdkId])
  },
  [SDK_METHODS.deregisterProvider]: function (msg) {
    const message = decryptMsg(msg)
    const [_, sdkId] = message

    delete sdks[sdkId]
  }
}

const SEND_HANDLERS = {
  [IDENTITY_METHODS.walletDetail]: function (params) {
    const [sdkId] = params

    post(IDENTITY_METHODS.walletDetail, [sdkId, this.account[0], {}])
  },
  [IDENTITY_METHODS.registerRequest]: () => post(IDENTITY_METHODS.registerRequest, [indentityID], false),
  [IDENTITY_METHODS.broadcast]: async function (params) {
    const [sdkId, tx, unsignedTx] = params
    post(IDENTITY_METHODS.broadcast, [sdkId, tx, await this.sign(unsignedTx)])
    // Remove from callBacks
    delete sdks[sdkId].signCallbacks[tx]
  }
}

const post = (method, params, encrypted = true) => window.postMessage({
  jsonrpc: '2.0',
  id: 1,
  method,
  params: encrypted ? encryptMsg({ params }) : params
}, '*')

// INTERFACE
function postMessage (method, params) {
  if (SEND_HANDLERS[method]) return SEND_HANDLERS[method].bind(this)(params)
  console.warn('Unknown message method')
}

async function processMessage ({ data }) {
  if (typeof data !== 'object' || data.type === 'webpackOk' || Object.values(IDENTITY_METHODS).includes(data.method)) {
    return
  }

  if (RECEIVE_HANDLERS[data.method]) return RECEIVE_HANDLERS[data.method].bind(this)(data)
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
async function sign (unsignedTx, { tx } = {}) {
  return this.account[1].sign(unsignedTx)
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
  return this.account[0]
}

function selectAccount (address) {
  const acc = this.accounts.find(acc => acc[0] === address)
  if (!acc) throw new Error('Account ' + address + ' not found!')
  this.account = acc
}

async function sendAccountDetails (sdkId, meta) {
  post(IDENTITY_METHODS.walletDetail, [sdkId, await this.address(), {}])
}

function onSdkRegister (params) {
  return true
}

function onSign (params) {
  return true
}

/**
 * ExtensionProvider client Stamp
 * @function
 * @alias module:@aeternity/aepp-sdk/es/provider/extension
 * @rtype Stamp
 * @param {Object} [options={}] - Initializer object
 * @param {Object} [options.self=window] - Window object
 * @return {Object} Remote Account Client
 * @example RemoteAccount({ self = window }).then(async account => console.log(await account.address())
 */
const ExtensionProvider = AsyncInit.compose({
  async init ({ self = window, accounts = [], onSdkRegister = this.onSdkRegister, onSign = this.onSign }) {
    this.onSdkRegister = onSdkRegister
    this.onSign = onSign
    this.accounts = await Promise.all(accounts.map(async acc => [await acc.address(), acc]))
    this.account = this.accounts[0]

    if (!this.account) throw new Error('You need to provider at least one account')
    // REGISTER PROVIDER
    this.postMessage(IDENTITY_METHODS.registerRequest)
  },
  props: {
    accounts: [],
    account: null
  },
  methods: {
    postMessage,
    processMessage,
    selectAccount,
    onSdkRegister,
    onSign,
    sign,
    address,
    sendAccountDetails
  }
})

export default ExtensionProvider
