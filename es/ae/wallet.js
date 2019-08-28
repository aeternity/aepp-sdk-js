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
 * Wallet module
 * @module @aeternity/aepp-sdk/es/ae/wallet
 * @export Wallet
 * @example import Wallet from '@aeternity/aepp-sdk/es/ae/wallet'
 */

import Ae from './'
import Account from '../account'
import ContractBase from '../contract'
import Accounts from '../accounts'
import Chain from '../chain/node'
import Rpc from '../rpc/server'
import * as R from 'ramda'
import Tx from '../tx/tx'
import Contract from './contract'
import NodePool from '../node-pool'
// Todo Enable GA
// import GeneralizeAccount from '../contract/ga'

const contains = R.flip(R.contains)
const isTxMethod = contains(Tx.compose.deepConfiguration.Ae.methods)
const isChainMethod = contains(Chain.compose.deepConfiguration.Ae.methods)
const isAccountMethod = contains(Account.compose.deepConfiguration.Ae.methods)
const isContractMethod = contains(ContractBase.compose.deepConfiguration.Contract.methods)
const handlers = [
  { pred: isTxMethod, handler: 'onTx', error: 'Creating transaction [{}] rejected' },
  { pred: isChainMethod, handler: 'onChain', error: 'Chain operation [{}] rejected' },
  { pred: isAccountMethod, handler: 'onAccount', error: 'Account operation [{}] rejected' },
  { pred: isContractMethod, handler: 'onContract', error: 'Contract operation [{}] rejected' }
]

/**
 * Confirm client connection attempt and associate new session with currently
 * selected account preset
 * @instance
 * @category async
 * @return {Promise<String>} Session ID
 */
async function hello () {
  const id = await Rpc.compose.deepProperties.rpcMethods.hello.call(this)
  this.rpcSessions[id].address = await this.address()
  return Promise.resolve(id)
}

async function rpc (method, params, session) {
  const { handler, error } = R.find(({ pred }) => pred(method), handlers)

  if (handler === undefined) {
    return Promise.reject(Error(`Unknown method ${method}`))
  } else if (await this[handler](method, params, session)) {
    return this[method].apply(this, params)
  } else {
    return Promise.reject(Error(error.replace(/{}/, method)))
  }
}

function onTx () {
  console.log('Implement onTx!')
  return Promise.resolve(false)
}

function onChain () {
  console.log('Implement onChain!')
  return Promise.resolve(false)
}

function onAccount () {
  console.log('Implement onAccount!')
  return Promise.resolve(false)
}

function onContract () {
  console.log('Implement onContract!')
  return Promise.resolve(false)
}

async function rpcSign ({ params, session }) {
  if (await this.onAccount('sign', params, session)) {
    return this.signWith(session.address, params[0])
  } else {
    return Promise.reject(Error('Signing rejected'))
  }
}

async function rpcAddress ({ params, session }) {
  if (await this.onAccount('address', params, session)) {
    return Promise.resolve(session.address)
  } else {
    return Promise.reject(Error('Address rejected'))
  }
}

/**
 * Wallet Stamp
 * @function
 * @alias module:@aeternity/aepp-sdk/es/ae/wallet
 * @rtype Stamp
 * @param {Object} [options={}] - Initializer object
 * @param {String} options.url - Node instance to connect to
 * @param {Account[]} [options.accounts] - Accounts to initialize with
 * @param {String} [options.account] - Public key of account to preselect
 * @param {Function} [options.onTx] - Tx method protector function
 * @param {Function} [options.onChain] - Chain method protector function
 * @param {Function} [options.onAccount] - Account method protector function
 * @param {Function} [options.onContract] - Contract method protector function
 * @return {Object} Wallet instance
 * @example Wallet({
  url: 'https://sdk-testnet.aepps.com/',
  accounts: [MemoryAccount({keypair})],
  address: keypair.publicKey,
  onTx: confirm,
  onChain: confirm,
  onAccount: confirm
  onContract: confirm
})
 */
const Wallet = Ae.compose(Accounts, Chain, NodePool, Tx, Contract, Rpc, {
  init ({ onTx = this.onTx, onChain = this.onChain, onAccount = this.onAccount, onContract = this.onContract }, { stamp }) {
    this.onTx = onTx
    this.onChain = onChain
    this.onAccount = onAccount
    this.onContract = onContract

    // Combine `AE` methods with `Contract` and `AENS`
    const methods = [
      ...stamp.compose.deepConfiguration.Ae.methods,
      ...stamp.compose.deepConfiguration.Contract.methods
    ]
    this.rpcMethods = Object.assign(R.fromPairs(methods.map(m => [m, ({ params, session }) => this.rpc(m, params, session)])), this.rpcMethods)
  },
  methods: { rpc, onTx, onChain, onAccount, onContract },
  deepProps: {
    rpcMethods: {
      sign: rpcSign,
      address: rpcAddress,
      hello
    }
  }
})

export default Wallet
