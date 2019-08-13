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
  initialize,
  enqueueAction,
  send,
  channelId,
  call,
  disconnect as channelDisconnect
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
 * Possible events:
 *
 *   - "error"
 *   - "onChainTx"
 *   - "ownWithdrawLocked"
 *   - "withdrawLocked"
 *   - "ownDepositLocked"
 *   - "depositLocked"
 *
 * @param {String} event - Event name
 * @param {Function} callback - Callback function
 */
function on (event, callback) {
  eventEmitters.get(this).on(event, callback)
}

/**
 * Close the connection
 */
function disconnect () {
  return channelDisconnect(this)
}

/**
 * Get current status
 *
 * @return {String}
 */
function status () {
  return channelStatus.get(this)
}

/**
 * Get current state
 *
 * @return {Promise<Object>}
 */
async function state () {
  return snakeToPascalObjKeys(await call(this, 'channels.get.offchain_state', {}))
}

/**
 * Get channel id
 *
 * @return {String}
 */
function id () {
  return channelId.get(this)
}

/**
 * Trigger a transfer update
 *
 * The transfer update is moving tokens from one channel account to another.
 * The update is a change to be applied on top of the latest state.
 *
 * Sender and receiver are the channel parties. Both the initiator and responder
 * can take those roles. Any public key outside of the channel is considered invalid.
 *
 * @param {String} from - Sender's public address
 * @param {String} to - Receiver's public address
 * @param {Number} amount - Transaction amount
 * @param {Function} sign - Function which verifies and signs offchain transaction
 * @return {Promise<Object>}
 * @example channel.update(
 *   'ak_Y1NRjHuoc3CGMYMvCmdHSBpJsMDR6Ra2t5zjhRcbtMeXXLpLH',
 *   'ak_V6an1xhec1xVaAhLuak7QoEbi6t7w5hEtYWp9bMKaJ19i6A9E',
 *   10,
 *   async (tx) => await account.signTransaction(tx)
 * ).then(({ accepted, signedTx }) =>
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
 * If a certain address of an account or a contract is not found
 * in the state tree - the response is an error.
 *
 * @param {Object} addresses
 * @param {Array<String>} [addresses.accounts] - List of account addresses to include in poi
 * @param {Array<String>} [addresses.contracts] - List of contract addresses to include in poi
 * @return {Promise<String>}
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
 * The accounts paramcontains a list of addresses to fetch balances of.
 * Those can be either account balances or a contract ones, encoded as an account addresses.
 *
 * If a certain account address had not being found in the state tree - it is simply
 * skipped in the response.
 *
 * @param {Array<String>} accounts - List of addresses to fetch balances from
 * @return {Promise<Object>}
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
 * It is possible to leave a channel and then later reestablish the channel
 * off-chain state and continue operation. When a leave method is called,
 * the channel fsm passes it on to the peer fsm, reports the current mutually
 * signed state and then terminates.
 *
 * The channel can be reestablished by instantiating another Channel instance
 * with two extra params: existingChannelId and offchainTx (returned from leave
 * method as channelId and signedTx respectively).
 *
 * @return {Promise<Object>}
 * @example channel.leave().then(({ channelId, signedTx }) => {
 *   console.log(channelId)
 *   console.log(signedTx)
 * })
 */
function leave () {
  return new Promise((resolve, reject) => {
    enqueueAction(
      this,
      (channel, state) => state.handler === handlers.channelOpen,
      (channel, state) => {
        send(channel, { jsonrpc: '2.0', method: 'channels.leave', params: {} })
        return {
          handler: handlers.awaitingLeave,
          state: { resolve, reject }
        }
      })
  })
}

/**
 * Trigger mutual close
 *
 * At any moment after the channel is opened, a closing procedure can be triggered.
 * This can be done by either of the parties. The process is similar to the off-chain updates.
 *
 * @param {Function} sign - Function which verifies and signs mutual close transaction
 * @return {Promise<String>}
 * @example channel.shutdown(
 *   async (tx) => await account.signTransaction(tx)
 * ).then(tx => console.log('on_chain_tx', tx))
 */
function shutdown (sign) {
  return new Promise((resolve, reject) => {
    enqueueAction(
      this,
      (channel, state) => state.handler === handlers.channelOpen,
      (channel, state) => {
        send(channel, { jsonrpc: '2.0', method: 'channels.shutdown', params: {} })
        return {
          handler: handlers.awaitingShutdownTx,
          state: {
            sign,
            resolve,
            reject
          }
        }
      }
    )
  })
}

/**
 * Withdraw tokens from the channel
 *
 * After the channel had been opened any of the participants can initiate a withdrawal.
 * The process closely resembles the update. The most notable difference is that the
 * transaction has been co-signed: it is channel_withdraw_tx and after the procedure
 * is finished - it is being posted on-chain.
 *
 * Any of the participants can initiate a withdrawal. The only requirements are:
 *
 *   - Channel is already opened
 *   - No off-chain update/deposit/withdrawal is currently being performed
 *   - Channel is not being closed or in a solo closing state
 *   - The withdrawal amount must be equal to or greater than zero, and cannot exceed
 *     the available balance on the channel (minus the channel_reserve)
 *
 * After the other party had signed the withdraw transaction, the transaction is posted
 * on-chain and onOnChainTx callback is called with on-chain transaction as first argument.
 * After computing transaction hash it can be tracked on the chain: entering the mempool,
 * block inclusion and a number of confirmations.
 *
 * After the minimum_depth block confirmations onOwnWithdrawLocked callback is called
 * (without any arguments).
 *
 * When the other party had confirmed that the block height needed is reached
 * onWithdrawLocked callback is called (without any arguments).
 *
 * @param {Number} amount - Amount of tokens to withdraw
 * @param {Function} sign - Function which verifies and signs withdraw transaction
 * @param {Object} [callbacks]
 * @param {Function} [callbacks.onOnChainTx] - Called when withdraw transaction has been posted on chain
 * @param {Function} [callbacks.onOwnWithdrawLocked]
 * @param {Function} [callbacks.onWithdrawLocked]
 * @return {Promise<Object>}
 * @example channel.withdraw(
 *   100,
 *   async (tx) => await account.signTransaction(tx),
 *   { onOnChainTx: (tx) => console.log('on_chain_tx', tx) }
 * ).then(({ accepted, signedTx }) => {
 *   if (accepted) {
 *     console.log('Withdrawal has been accepted')
 *   } else {
 *     console.log('Withdrawal has been rejected')
 *   }
 * })
 */
function withdraw (amount, sign, { onOnChainTx, onOwnWithdrawLocked, onWithdrawLocked } = {}) {
  return new Promise((resolve, reject) => {
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
            reject,
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
 * After the channel had been opened any of the participants can initiate a deposit.
 * The process closely resembles the update. The most notable difference is that the
 * transaction has been co-signed: it is channel_deposit_tx and after the procedure
 * is finished - it is being posted on-chain.
 *
 * Any of the participants can initiate a deposit. The only requirements are:
 *
 *   - Channel is already opened
 *   - No off-chain update/deposit/withdrawal is currently being performed
 *   - Channel is not being closed or in a solo closing state
 *   - The deposit amount must be equal to or greater than zero, and cannot exceed
 *     the available balance on the channel (minus the channel_reserve)
 *
 * After the other party had signed the deposit transaction, the transaction is posted
 * on-chain and onOnChainTx callback is called with on-chain transaction as first argument.
 * After computing transaction hash it can be tracked on the chain: entering the mempool,
 * block inclusion and a number of confirmations.
 *
 * After the minimum_depth block confirmations onOwnDepositLocked callback is called
 * (without any arguments).
 *
 * When the other party had confirmed that the block height needed is reached
 * onDepositLocked callback is called (without any arguments).
 *
 * @param {Number} amount - Amount of tokens to deposit
 * @param {Function} sign - Function which verifies and signs deposit transaction
 * @param {Object} [callbacks]
 * @param {Function} [callbacks.onOnChainTx] - Called when deposit transaction has been posted on chain
 * @param {Function} [callbacks.onOwnDepositLocked]
 * @param {Function} [callbacks.onDepositLocked]
 * @return {Promise<Object>}
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
  return new Promise((resolve, reject) => {
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
            reject,
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
 * Trigger create contract update
 *
 * The create contract update is creating a contract inside the channel's internal state tree.
 * The update is a change to be applied on top of the latest state.
 *
 * That would create a contract with the poster being the owner of it. Poster commits initially
 * a deposit amount of tokens to the new contract.
 *
 * @param {Object} options
 * @param {String} options.code - Api encoded compiled AEVM byte code
 * @param {String} options.callData - Api encoded compiled AEVM call data for the code
 * @param {Number} options.deposit - Initial amount the owner of the contract commits to it
 * @param {Number} options.vmVersion - Version of the AEVM
 * @param {Number} options.abiVersion - Version of the ABI
 * @param {Function} sign - Function which verifies and signs create contract transaction
 * @return {Promise<Object>}
 * @example channel.createContract({
 *   code: 'cb_HKtpipK4aCgYb17wZ...',
 *   callData: 'cb_1111111111111111...',
 *   deposit: 10,
 *   vmVersion: 3,
 *   abiVersion: 1
 * }).then(({ accepted, signedTx, address }) => {
 *   if (accepted) {
 *     console.log('New contract has been created')
 *     console.log('Contract address:', address)
 *   } else {
 *     console.log('New contract has been rejected')
 *   }
 * })
 */
function createContract ({ code, callData, deposit, vmVersion, abiVersion }, sign) {
  return new Promise((resolve, reject) => {
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
            resolve,
            reject
          }
        }
      }
    )
  })
}

/**
 * Trigger call a contract update
 *
 * The call contract update is calling a preexisting contract inside the channel's
 * internal state tree. The update is a change to be applied on top of the latest state.
 *
 * That would call a contract with the poster being the caller of it. Poster commits
 * an amount of tokens to the contract.
 *
 * The call would also create a call object inside the channel state tree. It contains
 * the result of the contract call.
 *
 * It is worth mentioning that the gas is not consumed, because this is an off-chain
 * contract call. It would be consumed if it were a on-chain one. This could happen
 * if a call with a similar computation amount is to be forced on-chain.
 *
 * @param {Object} options
 * @param {String} [options.amount] - Amount the caller of the contract commits to it
 * @param {String} [options.callData] - ABI encoded compiled AEVM call data for the code
 * @param {Number} [options.contract] - Address of the contract to call
 * @param {Number} [options.abiVersion] - Version of the ABI
 * @param {Function} sign - Function which verifies and signs contract call transaction
 * @return {Promise<Object>}
 * @example channel.callContract({
 *   contract: 'ct_9sRA9AVE4BYTAkh5RNfJYmwQe1NZ4MErasQLXZkFWG43TPBqa',
 *   callData: 'cb_1111111111111111...',
 *   amount: 0,
 *   abiVersion: 1
 * }).then(({ accepted, signedTx }) => {
 *   if (accepted) {
 *     console.log('Contract called succesfully')
 *   } else {
 *     console.log('Contract call has been rejected')
 *   }
 * })
 */
function callContract ({ amount, callData, contract, abiVersion }, sign) {
  return new Promise((resolve, reject) => {
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
            contract_id: contract,
            abi_version: abiVersion
          }
        })
        return {
          handler: handlers.awaitingCallContractUpdateTx,
          state: { resolve, reject, sign }
        }
      }
    )
  })
}

/**
 * Call contract using dry-run
 *
 * In order to get the result of a potential contract call, one might need to
 * dry-run a contract call. It takes the exact same arguments as a call would
 * and returns the call object.
 *
 * The call is executed in the channel's state but it does not impact the state
 * whatsoever. It uses as an environment the latest channel's state and the current
 * top of the blockchain as seen by the node.
 *
 * @param {Object} options
 * @param {String} [options.amount] - Amount the caller of the contract commits to it
 * @param {String} [options.callData] - ABI encoded compiled AEVM call data for the code
 * @param {Number} [options.contract] - Address of the contract to call
 * @param {Number} [options.abiVersion] - Version of the ABI
 * @return {Promise<Object>}
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
    contract_id: contract,
    abi_version: abiVersion
  }))
}

/**
 * Get contract call result
 *
 * The combination of a caller, contract and a round of execution determines the
 * contract call. Providing an incorrect set of those results in an error response.
 *
 * @param {Object} options
 * @param {String} [options.caller] - Address of contract caller
 * @param {String} [options.contract] - Address of the contract
 * @param {Number} [options.round] - Round when contract was called
 * @return {Promise<Object>}
 * @example channel.getContractCall({
 *   caller: 'ak_Y1NRjHuoc3CGMYMvCmdHSBpJsMDR6Ra2t5zjhRcbtMeXXLpLH',
 *   contract: 'ct_9sRA9AVE4BYTAkh5RNfJYmwQe1NZ4MErasQLXZkFWG43TPBqa',
 *   round: 3
 * }).then(({ returnType, returnValue }) => {
 *   if (returnType === 'ok') console.log(returnValue)
 * })
 */
async function getContractCall ({ caller, contract, round }) {
  return snakeToPascalObjKeys(
    await call(this, 'channels.get.contract_call', {
      caller_id: caller,
      contract_id: contract,
      round
    })
  )
}

/**
 * Get contract latest state
 *
 * @param {String} contract - Address of the contract
 * @return {Promise<Object>}
 * @example channel.getContractState(
 *   'ct_9sRA9AVE4BYTAkh5RNfJYmwQe1NZ4MErasQLXZkFWG43TPBqa'
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
 * Clean up all locally stored contract calls
 *
 * Contract calls are kept locally in order for the participant to be able to look them up.
 * They consume memory and in order for the participant to free it - one can prune all messages.
 * This cleans up all locally stored contract calls and those will no longer be available for
 * fetching and inspection.
 *
 * @return {Promise}
 */
function cleanContractCalls () {
  return new Promise((resolve, reject) => {
    enqueueAction(
      this,
      (channel, state) => state.handler === handlers.channelOpen,
      (channel, state) => {
        send(channel, {
          jsonrpc: '2.0',
          method: 'channels.clean_contract_calls',
          params: {}
        })
        return {
          handler: handlers.awaitingCallsPruned,
          state: { resolve, reject }
        }
      }
    )
  })
}

/**
 * Send generic message
 *
 * If message is an object it will be serialized into JSON string
 * before sending.
 *
 * If there is ongoing update that has not yet been finished the message
 * will be sent after that update is finalized.
 *
 * @param {String|Object} message
 * @param {String} recipient - Address of the recipient
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
  send(this, { jsonrpc: '2.0', method: 'channels.message', params: { info, to: recipient } })
}

/**
 * Channel
 *
 * @function
 * @alias module:@aeternity/aepp-sdk/es/channel/index
 * @rtype Channel
 * @param {Object} options - Channel params
 * @param {String} options.url - Channel url (for example: "ws://localhost:3001")
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
 * @param {Number} [options.timeoutIdle] - The time waiting for a new event to be initiated (default: 600000)
 * @param {Number} [options.timeoutFundingCreate] - The time waiting for the initiator to produce the create channel transaction after the noise session had been established (default: 120000)
 * @param {Number} [options.timeoutFundingSign] - The time frame the other client has to sign an off-chain update after our client had initiated and signed it. This applies only for double signed on-chain intended updates: channel create transaction, deposit, withdrawal and etc. (default: 120000)
 * @param {Number} [options.timeoutFundingLock] - The time frame the other client has to confirm an on-chain transaction reaching maturity (passing minimum depth) after the local node has detected this. This applies only for double signed on-chain intended updates: channel create transaction, deposit, withdrawal and etc. (default: 360000)
 * @param {Number} [options.timeoutSign] - The time frame the client has to return a signed off-chain update or to decline it. This applies for all off-chain updates (default: 500000)
 * @param {Number} [options.timeoutAccept] - The time frame the other client has to react to an event. This applies for all off-chain updates that are not meant to land on-chain, as well as some special cases: opening a noise connection, mutual closing acknowledgement and reestablishing an existing channel (default: 120000)
 * @param {Number} [options.timeoutInitialized] - the time frame the responder has to accept an incoming noise session. Applicable only for initiator (default: timeout_accept's value)
 * @param {Number} [options.timeoutAwaitingOpen] - The time frame the initiator has to start an outgoing noise session to the responder's node. Applicable only for responder (default: timeout_idle's value)
 * @param {Function} options.sign - Function which verifies and signs transactions
 * @return {Promise<Object>} Channel instance
 * @example Channel({
 *   url: 'ws://localhost:3001',
 *   role: 'initiator'
 *   initiatorId: 'ak_Y1NRjHuoc3CGMYMvCmdHSBpJsMDR6Ra2t5zjhRcbtMeXXLpLH',
 *   responderId: 'ak_V6an1xhec1xVaAhLuak7QoEbi6t7w5hEtYWp9bMKaJ19i6A9E',
 *   initiatorAmount: 1e18,
 *   responderAmount: 1e18,
 *   pushAmount: 0,
 *   channelReserve: 0,
 *   ttl: 1000,
 *   host: 'localhost',
 *   port: 3002,
 *   lockPeriod: 10,
 *   async sign (tag, tx) => await account.signTransaction(tx)
 * })
 */
const Channel = AsyncInit.compose({
  async init (options) {
    initialize(this, options)
  },
  methods: {
    on,
    status,
    state,
    id,
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
    getContractState,
    disconnect,
    cleanContractCalls
  }
})

export default Channel
