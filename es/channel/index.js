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
 * Channel module
 * @module @aeternity/aepp-sdk/es/channel/index
 * @export Channel
 * @example import Channel from '@aeternity/aepp-sdk/es/channel/index'
 */

import AsyncInit from '../utils/async-init'
import { snakeToPascal } from '../utils/string'
import * as handlers from './handlers'
import {
  eventEmitters,
  status as channelStatus,
  state as channelState,
  initialize,
  enqueueAction,
  send,
  call
} from './internal'
import * as R from 'ramda'

function snakeToPascalObjKeys (obj) {
  return Object.entries(obj).reduce((result, [key, val]) => ({
    ...result,
    [snakeToPascal(key)]: val
  }), {})
}

/**
 * Register event listener function
 *
 * @param {string} event - Event name
 * @param {function} callback - Callback function
 */
function on (event, callback) {
  eventEmitters.get(this).on(event, callback)
}

/**
 * Get current status
 *
 * @return {string}
 */
function status () {
  return channelStatus.get(this)
}

/**
 * Get current state
 *
 * @return {object}
 */
function state () {
  return channelState.get(this)
}

/**
 * Trigger an update
 *
 * @param {string} from - Sender's public address
 * @param {string} to - Receiver's public address
 * @param {number} amount - Transaction amount
 * @param {function} sign - Function which verifies and signs transaction
 * @return {Promise<object>}
 * @example channel.update(
 *   'ak$2QC98ahNHSrZLWKrpQyv91eQfCDA3aFVSNoYKdQ1ViYWVF8Z9d',
 *   'ak$Gi42jcRm9DcZjk72UWQQBSxi43BG3285C9n4QSvP5JdzDyH2o',
 *   10,
 *   async (tx) => await account.signTransaction(tx)
 * ).then({ accepted, state } =>
 *   if (accepted) {
 *     console.log('Update has been accepted')
 *   }
 * )
 */
function update (from, to, amount, sign) {
  return new Promise((resolve, reject) => {
    enqueueAction(
      this,
      (channel, state) => state.handler === handlers.channelOpen,
      (channel, state) => {
        send(channel, {
          jsonrpc: '2.0',
          method: 'channels.update.new',
          params: { from, to, amount }
        })
        return {
          handler: handlers.awaitingOffChainTx,
          state: {
            resolve,
            reject,
            sign
          }
        }
      }
    )
  })
}

/**
 * Get proof of inclusion
 *
 * @param {object} addresses
 * @param {array<string>} [addresses.accounts] - List of account addresses to include in poi
 * @param {array<string>} [addresses.contracts] - List of contract addresses to include in poi
 * @return {Promise<string>}
 * @example channel.poi({
 *   accounts: [
 *     'ak_Y1NRjHuoc3CGMYMvCmdHSBpJsMDR6Ra2t5zjhRcbtMeXXLpLH',
 *     'ak_V6an1xhec1xVaAhLuak7QoEbi6t7w5hEtYWp9bMKaJ19i6A9E'
 *   ],
 *   contracts: ['ct_2dCUAWYZdrWfACz3a2faJeKVTVrfDYxCQHCqAt5zM15f3u2UfA']
 * }).then(poi => console.log(poi))
 */
async function poi ({ accounts, contracts }) {
  return (await call(this, 'channels.get.poi', { accounts, contracts })).poi
}

/**
 * Get balances
 *
 * @param {array<string>} accounts - List of addresses to fetch balances from
 * @return {Promise<object>}
 * @example channel.balances([
 *   'ak_Y1NRjHuoc3CGMYMvCmdHSBpJsMDR6Ra2t5zjhRcbtMeXXLpLH',
 *   'ak_V6an1xhec1xVaAhLuak7QoEbi6t7w5hEtYWp9bMKaJ19i6A9E'
 *   'ct_2dCUAWYZdrWfACz3a2faJeKVTVrfDYxCQHCqAt5zM15f3u2UfA'
 * ]).then(balances =>
 *   console.log(balances['ak_Y1NRjHuoc3CGMYMvCmdHSBpJsMDR6Ra2t5zjhRcbtMeXXLpLH'])
 * )
 */
async function balances (accounts) {
  return R.reduce((acc, item) => ({
    ...acc,
    [item.account]: item.balance
  }), {}, await call(this, 'channels.get.balances', { accounts }))
}

/**
 * Leave channel
 *
 * @return {Promise<object>}
 * @example channel.leave().then(({channelId, state}) =>
 *   console.log(channelId)
 *   console.log(state)
 * )
 */
function leave () {
  return new Promise((resolve) => {
    enqueueAction(
      this,
      (channel, state) => state.handler === handlers.channelOpen,
      (channel, state) => {
        send(channel, { jsonrpc: '2.0', method: 'channels.leave', params: {} })
        return {
          handler: handlers.awaitingLeave,
          state: { resolve }
        }
      })
  })
}

/**
 * Trigger a channel shutdown
 *
 * @param {function} sign - Function which verifies and signs transaction
 * @return {Promise<string>}
 * @example channel.shutdown(
 *   async (tx) => await account.signTransaction(tx)
 * ).then(tx => console.log('on_chain_tx', tx))
 */
function shutdown (sign) {
  return new Promise((resolve) => {
    enqueueAction(
      this,
      (channel, state) => state.handler === handlers.channelOpen,
      (channel, state) => {
        send(channel, { jsonrpc: '2.0', method: 'channels.shutdown', params: {} })
        return {
          handler: handlers.awaitingShutdownTx,
          state: {
            sign,
            resolveShutdownPromise: resolve
          }
        }
      }
    )
  })
}

/**
 * Withdraw tokens from the channel
 *
 * @param {number} amount - Amount of tokens to withdraw
 * @param {function} sign - Function which verifies and signs withdraw transaction
 * @param {object} [callbacks]
 * @param {function} [callbacks.onOnChainTx] - Called when withdraw transaction has been posted on chain
 * @param {function} [callbacks.onOwnWithdrawLocked]
 * @param {function} [callbacks.onWithdrawLocked]
 * @return {Promise<object>}
 * @example channel.withdraw(
 *   100,
 *   async (tx) => await account.signTransaction(tx),
 *   { onOnChainTx: (tx) => console.log('on_chain_tx', tx) }
 * ).then(({ accepted, state }) => {
 *   if (accepted) {
 *     console.log('Withdrawal has been accepted')
 *     console.log('The new state is:', state)
 *   } else {
 *     console.log('Withdrawal has been rejected')
 *   }
 * })
 */
function withdraw (amount, sign, { onOnChainTx, onOwnWithdrawLocked, onWithdrawLocked } = {}) {
  return new Promise((resolve) => {
    enqueueAction(
      this,
      (channel, state) => state.handler === handlers.channelOpen,
      (channel, state) => {
        send(channel, { jsonrpc: '2.0', method: 'channels.withdraw', params: { amount } })
        return {
          handler: handlers.awaitingWithdrawTx,
          state: {
            sign,
            resolve,
            onOnChainTx,
            onOwnWithdrawLocked,
            onWithdrawLocked
          }
        }
      }
    )
  })
}

/**
 * Deposit tokens into the channel
 *
 * @param {number} amount - Amount of tokens to deposit
 * @param {function} sign - Function which verifies and signs deposit transaction
 * @param {object} [callbacks]
 * @param {function} [callbacks.onOnChainTx] - Called when deposit transaction has been posted on chain
 * @param {function} [callbacks.onOwnDepositLocked]
 * @param {function} [callbacks.onDepositLocked]
 * @return {Promise<object>}
 * @example channel.deposit(
 *   100,
 *   async (tx) => await account.signTransaction(tx),
 *   { onOnChainTx: (tx) => console.log('on_chain_tx', tx) }
 * ).then(({ accepted, state }) => {
 *   if (accepted) {
 *     console.log('Deposit has been accepted')
 *     console.log('The new state is:', state)
 *   } else {
 *     console.log('Deposit has been rejected')
 *   }
 * })
 */
function deposit (amount, sign, { onOnChainTx, onOwnDepositLocked, onDepositLocked } = {}) {
  return new Promise((resolve) => {
    enqueueAction(
      this,
      (channel, state) => state.handler === handlers.channelOpen,
      (channel, state) => {
        send(channel, { jsonrpc: '2.0', method: 'channels.deposit', params: { amount } })
        return {
          handler: handlers.awaitingDepositTx,
          state: {
            sign,
            resolve,
            onOnChainTx,
            onOwnDepositLocked,
            onDepositLocked
          }
        }
      }
    )
  })
}

/**
 * Create a contract
 *
 * @param {object} options
 * @param {string} [options.code] - Api encoded compiled AEVM byte code
 * @param {string} [options.callData] - Api encoded compiled AEVM call data for the code
 * @param {number} [options.deposit] - Initial amount the owner of the contract commits to it
 * @param {number} [options.vmVersion] - Version of the AEVM
 * @param {number} [options.abiVersion] - Version of the ABI
 * @param {function} sign - Function which verifies and signs create contract transaction
 * @return {Promise<object>}
 * @example channel.createContract({
 *   code: 'cb_HKtpipK4aCgYb17wZ...',
 *   callData: 'cb_1111111111111111...',
 *   deposit: 10,
 *   vmVersion: 3,
 *   abiVersion: 1
 * }).then(({ accepted, state, address }) => {
 *   if (accepted) {
 *     console.log('New contract has been created')
 *     console.log('Contract address:', address)
 *   } else {
 *     console.log('New contract has been rejected')
 *   }
 * })
 */
function createContract ({ code, callData, deposit, vmVersion, abiVersion }, sign) {
  return new Promise((resolve) => {
    enqueueAction(
      this,
      (channel, state) => state.handler === handlers.channelOpen,
      (channel, state) => {
        send(channel, {
          jsonrpc: '2.0',
          method: 'channels.update.new_contract',
          params: {
            code,
            call_data: callData,
            deposit,
            vm_version: vmVersion,
            abi_version: abiVersion
          }
        })
        return {
          handler: handlers.awaitingNewContractTx,
          state: {
            sign,
            resolve
          }
        }
      }
    )
  })
}

/**
 * Call a contract
 *
 * @param {object} options
 * @param {string} [options.amount] - Amount the caller of the contract commits to it
 * @param {string} [options.callData] - ABI encoded compiled AEVM call data for the code
 * @param {number} [options.contract] - Address of the contract to call
 * @param {number} [options.abiVersion] - Version of the ABI
 * @param {function} sign - Function which verifies and signs contract call transaction
 * @return {Promise<object>}
 * @example channel.callContract({
 *   contract: 'ct_9sRA9AVE4BYTAkh5RNfJYmwQe1NZ4MErasQLXZkFWG43TPBqa',
 *   callData: 'cb_1111111111111111...',
 *   amount: 0,
 *   abiVersion: 1
 * }).then(({ accepted, state }) => {
 *   if (accepted) {
 *     console.log('Contract called succesfully')
 *     console.log('The new state is:', state)
 *   } else {
 *     console.log('Contract call has been rejected')
 *   }
 * })
 */
function callContract ({ amount, callData, contract, abiVersion }, sign) {
  return new Promise((resolve) => {
    enqueueAction(
      this,
      (channel, state) => state.handler === handlers.channelOpen,
      (channel, state) => {
        send(channel, {
          jsonrpc: '2.0',
          method: 'channels.update.call_contract',
          params: {
            amount,
            call_data: callData,
            contract,
            abi_version: abiVersion
          }
        })
        return {
          handler: handlers.awaitingCallContractUpdateTx,
          state: { resolve, sign }
        }
      }
    )
  })
}

/**
 * Call contract using dry-run
 *
 * @param {object} options
 * @param {string} [options.amount] - Amount the caller of the contract commits to it
 * @param {string} [options.callData] - ABI encoded compiled AEVM call data for the code
 * @param {number} [options.contract] - Address of the contract to call
 * @param {number} [options.abiVersion] - Version of the ABI
 * @return {Promise<object>}
 * @example channel.callContractStatic({
  *   contract: 'ct_9sRA9AVE4BYTAkh5RNfJYmwQe1NZ4MErasQLXZkFWG43TPBqa',
  *   callData: 'cb_1111111111111111...',
  *   amount: 0,
  *   abiVersion: 1
  * }).then(({ returnValue, gasUsed }) => {
  *   console.log('Returned value:', returnValue)
  *   console.log('Gas used:', gasUsed)
  * })
  */
async function callContractStatic ({ amount, callData, contract, abiVersion }) {
  return snakeToPascalObjKeys(await call(this, 'channels.dry_run.call_contract', {
    amount,
    call_data: callData,
    contract,
    abi_version: abiVersion
  }))
}

/**
 * Get contract call result
 *
 * @param {object} options
 * @param {string} [options.caller] - Address of contract caller
 * @param {string} [options.contract] - Address of the contract
 * @param {number} [options.round] - Round when contract was called
 * @return {Promise<object>}
 * @example channel.getContractCall({
 *   caller: 'ak_Y1NRjHuoc3CGMYMvCmdHSBpJsMDR6Ra2t5zjhRcbtMeXXLpLH',
 *   contract: 'ct_9sRA9AVE4BYTAkh5RNfJYmwQe1NZ4MErasQLXZkFWG43TPBqa',
 *   round: 3
 * }).then(({ returnType, returnValue }) => {
 *   if (returnType === 'ok') console.log(returnValue)
 * })
 */
async function getContractCall ({ caller, contract, round }) {
  const result = await call(this, 'channels.get.contract_call', { caller, contract, round })
  return R.fromPairs(
    R.map(
      ([key, value]) => ([snakeToPascal(key), value]),
      R.toPairs(result)
    )
  )
}

/**
 * Get contract latest state
 *
 * @param {string} contract - Address of the contract
 * @return {Promise<object>}
 * @example channel.getContractState(
  *   'ct_9sRA9AVE4BYTAkh5RNfJYmwQe1NZ4MErasQLXZkFWG43TPBqa',
  * ).then(({ contract }) => {
  *   console.log('deposit:', contract.deposit)
  * })
  */
async function getContractState (contract) {
  const result = await call(this, 'channels.get.contract', { pubkey: contract })
  return snakeToPascalObjKeys({
    ...result,
    contract: snakeToPascalObjKeys(result.contract)
  })
}

/**
 * Send generic message
 *
 * If message is an object it will be serialized into JSON string
 * before sending.
 *
 * @param {string|object} message
 * @param {string} recipient - Address of the recipient
 * @example channel.sendMessage(
 *   'hello world',
 *   'ak_Y1NRjHuoc3CGMYMvCmdHSBpJsMDR6Ra2t5zjhRcbtMeXXLpLH'
 * )
 */
function sendMessage (message, recipient) {
  let info = message
  if (typeof message === 'object') {
    info = JSON.stringify(message)
  }
  // TODO: is it possible to send a message when channel is in other state
  //       than `channelOpen`? For example in the middle of an update.
  enqueueAction(
    this,
    (channel, state) => state.handler === handlers.channelOpen,
    (channel, state) => {
      send(channel, { jsonrpc: '2.0', method: 'channels.message', params: { info, to: recipient } })
      return state
    }
  )
}

/**
 * Channel
 *
 * @function
 * @alias module:@aeternity/aepp-sdk/es/channel/index
 * @rtype Channel
 * @param {Object} [options={}] - Initializer object
 * @param {String} options.url - Channel url (for example: "ws://localhost:3001/channel")
 * @param {String} options.role - Participant role ("initiator" or "responder")
 * @param {String} options.initiatorId - Initiator's public key
 * @param {String} options.responderId - Responder's public key
 * @param {Number} options.pushAmount - Initial deposit in favour of the responder by the initiator
 * @param {Number} options.initiatorAmount - Amount of tokens the initiator has committed to the channel
 * @param {Number} options.responderAmount - Amount of tokens the responder has committed to the channel
 * @param {Number} options.channelReserve - The minimum amount both peers need to maintain
 * @param {Number} [options.ttl] - Minimum block height to include the channel_create_tx
 * @param {String} options.host - Host of the responder's node
 * @param {Number} options.port - The port of the responders node
 * @param {Number} options.lockPeriod - Amount of blocks for disputing a solo close
 * @param {Number} [options.existingChannelId] - Existing channel id (required if reestablishing a channel)
 * @param {Number} [options.offchainTx] - Offchain transaction (required if reestablishing a channel)
 * @param {Function} options.sign - Function which verifies and signs transactions
 * @return {Object} Channel instance
 * @example Channel({
  url: 'ws://localhost:3001',
  role: 'initiator'
  initiatorId: 'ak$2QC98ahNHSrZLWKrpQyv91eQfCDA3aFVSNoYKdQ1ViYWVF8Z9d',
  responderId: 'ak$Gi42jcRm9DcZjk72UWQQBSxi43BG3285C9n4QSvP5JdzDyH2o',
  pushAmount: 3,
  initiatorAmount: 10,
  responderAmount: 10,
  channelReserve: 2,
  ttl: 1000,
  host: 'localhost',
  port: 3002,
  lockPeriod: 10,
  async sign (tag, tx) => await account.signTransaction(tx)
})
 */
const Channel = AsyncInit.compose({
  async init (options) {
    initialize(this, options)
  },
  methods: {
    on,
    status,
    state,
    update,
    poi,
    balances,
    leave,
    shutdown,
    sendMessage,
    withdraw,
    deposit,
    createContract,
    callContract,
    callContractStatic,
    getContractCall,
    getContractState
  }
})

export default Channel
