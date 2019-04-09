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

import { unpackTx } from '../tx/builder'
import { decryptMsg, encryptMsg, IDENTITY_METHODS, SDK_METHODS } from './helper'
import { assertedType } from '../utils/crypto'
import AsyncInit from '../utils/async-init'

const sdks = {}

const indentityID = 'bobS3qRvWfDxCpmedQYzp3xrK5jVUS4MSto99QrCdySSMjYnd'

const RECEIVE_HANDLERS = {
  [SDK_METHODS.sign]: async function (msg) {
    const message = decryptMsg(msg)
    const [sdkId, unsignedTx, tx] = message
    const unpackedTx = unpackTx(tx)

    sdks[sdkId].txCallbacks[tx] = { unsignedTx, meta: { tx, txObject: { type: unpackedTx.txType, ...unpackedTx.tx } } }

    if (sdks[sdkId].autoSign) await this.postMessage(IDENTITY_METHODS.broadcast, [sdkId, tx, unsignedTx])
    this.onSign({
      sdkId,
      ...sdks[sdkId].txCallbacks[tx].meta,
      sign: async () => this.postMessage(IDENTITY_METHODS.broadcast, [sdkId, tx, unsignedTx])
    })
  },
  [SDK_METHODS.ready]: function () { this.postMessage(IDENTITY_METHODS.registerRequest) },
  [SDK_METHODS.registerProvider]: function ({ params: [identityId, sdkId] }) {
    if (!sdks[sdkId]) {
      sdks[sdkId] = {
        txCallbacks: {},
        sdkId,
        autoSign: false,
        status: 'WAIT_FOR_ACCOUNT_DETAILS',
        shareWallet: () => this.postMessage(IDENTITY_METHODS.walletDetail, [sdkId])
      }
    }

    this.onSdkRegister(sdks[sdkId])
  },
  [SDK_METHODS.deregisterProvider]: function (msg) {
    const message = decryptMsg(msg)
    const [_, sdkId] = message

    delete sdks[sdkId]
  },
  [SDK_METHODS.broadcastResponse]: function (msg) {
    const message = decryptMsg(msg)
    const [sdkId, tx, result] = message

    if (sdks[sdkId] && sdks[sdkId].txCallbacks[tx]) {
      sdks[sdkId].txCallbacks[tx].result = result
      sdks[sdkId].txCallbacks[tx].status = 'BROADCASTED'
    }
  }
}

const SEND_HANDLERS = {
  [IDENTITY_METHODS.walletDetail]: function (params) {
    const [sdkId] = params

    post(this.postFunction)(IDENTITY_METHODS.walletDetail, [sdkId, this.account[0], {}])
    sdks[sdkId].status = 'ACTIVE'
  },
  [IDENTITY_METHODS.registerRequest]: function () { post(this.postFunction)(IDENTITY_METHODS.registerRequest, [indentityID], false) },
  [IDENTITY_METHODS.broadcast]: async function (params) {
    const [sdkId, tx, unsignedTx] = params
    const data = [sdkId, tx, Array.from(await this.sign(unsignedTx))]

    post(this.postFunction)(IDENTITY_METHODS.broadcast, data)
    // mark as signed
    sdks[sdkId].txCallbacks[tx].status = 'SIGNED'
  }
}

const post = (postFunction) => (method, params, encrypted = true, options = []) => {
  postFunction({
    jsonrpc: '2.0',
    id: 1,
    method,
    providerId: indentityID,
    params: encrypted ? encryptMsg({ params }) : params
  }, ...options)
}

// INTERFACE
async function postMessage (method, params) {
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

async function sendAccountDetails (sdkId) {
  if (!sdks[sdkId]) throw new Error('Sdk with id ' + sdkId + ' not found!')
  this.postMessage(IDENTITY_METHODS.walletDetail, [sdkId])
}

// HOOKS
function onSdkRegister (sdk) {
  sdk.shareWallet() // Share wallet detail
}

function onSign ({ sdkId, meta, sign: signFn }) {
  return signFn() // SIGN TRANSACTION
}

// Getter / Setter
function setAutoSign (sdkId, value) {
  if (!sdks[sdkId]) throw new Error('Sdk with id ' + sdkId + ' not found!')
  sdks[sdkId].autoSign = !!value
}

function getSdks () {
  return sdks
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
  async init ({ postFunction = window.postMessage, accounts = [], onSdkRegister = this.onSdkRegister, onSign = this.onSign }) {
    // INIT PARAMS
    this.postFunction = postFunction
    this.onSdkRegister = onSdkRegister
    this.onSign = onSign
    // PREPARE ACCOUNTS
    this.accounts =
      (await Promise.all(accounts.map(async acc => [await acc.address(), acc])))
        .filter(acc => acc[0] && assertedType(acc[0], 'ak')) // REMOVE INVALID ACCOUNTS
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
    getSdks,
    setAutoSign,
    sendAccountDetails
  }
})

export default ExtensionProvider
