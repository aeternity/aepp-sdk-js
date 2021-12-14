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
import Chain from './'
import { AE_AMOUNT_FORMATS, formatAmount } from '../utils/amount-formatter'
import verifyTransaction from '../tx/validator'
import NodePool from '../node-pool'
import { pause } from '../utils/other'
import { isNameValid, produceNameId, decode } from '../tx/builder/helpers'
import { DRY_RUN_ACCOUNT } from '../tx/builder/schema'
import {
  AensNameNotFoundError,
  AensPointerContextError,
  DryRunError,
  InvalidAensNameError,
  InvalidTxError,
  RequestTimedOutError,
  TxTimedOutError,
  TxNotInChainError,
  IllegalArgumentError
} from '../utils/errors'

/**
 * ChainNode module
 *
 * This is the complement to {@link module:@aeternity/aepp-sdk/es/chain}.
 * @module @aeternity/aepp-sdk/es/chain/node
 * @export ChainNode
 * @example import { ChainNode } from '@aeternity/aepp-sdk'
 */

async function sendTransaction (tx, options = {}) {
  const { waitMined, verify } = { ...this.Ae.defaults, ...options }
  if (verify) {
    const validation = await verifyTransaction(tx, this.selectedNode.instance)
    if (validation.length) {
      const message = 'Transaction verification errors: ' +
        validation.map(v => v.message).join(', ')
      throw Object.assign(new InvalidTxError(message), {
        code: 'TX_VERIFICATION_ERROR',
        validation,
        transaction: tx
      })
    }
  }

  try {
    const { txHash } = await this.api.postTransaction({ tx })

    if (waitMined) {
      const txData = { ...await this.poll(txHash, options), rawTx: tx }
      // wait for transaction confirmation
      if (options.confirm) {
        return { ...txData, confirmationHeight: await this.waitForTxConfirm(txHash, options) }
      }
      return txData
    }
    return { hash: txHash, rawTx: tx }
  } catch (error) {
    throw Object.assign(error, {
      rawTx: tx,
      verifyTx: () => verifyTransaction(tx, this.selectedNode.instance)
    })
  }
}

async function waitForTxConfirm (txHash, options = { confirm: 3 }) {
  options.confirm = options.confirm === true ? 3 : options.confirm
  const { blockHeight } = await this.tx(txHash)
  const height = await this.awaitHeight(blockHeight + options.confirm, options)
  const { blockHeight: newBlockHeight } = await this.tx(txHash)
  switch (newBlockHeight) {
    case -1:
      throw new TxNotInChainError(txHash)
    case blockHeight:
      return height
    default:
      return waitForTxConfirm(txHash, options)
  }
}

async function getAccount (address, { height, hash } = {}) {
  if (height) return this.api.getAccountByPubkeyAndHeight(address, height)
  if (hash) return this.api.getAccountByPubkeyAndHash(address, hash)
  return this.api.getAccountByPubkey(address)
}

/**
 * @function
 * @deprecated
 */
async function balance (address, { height, hash, format = AE_AMOUNT_FORMATS.AETTOS } = {}) {
  const { balance } = await this.getAccount(address, { hash, height })

  return formatAmount(balance, { targetDenomination: format }).toString()
}

async function getBalance (address, { height, hash, format = AE_AMOUNT_FORMATS.AETTOS } = {}) {
  const { balance } = await this.getAccount(address, { hash, height }).catch(_ => ({ balance: 0 }))

  return formatAmount(balance, { targetDenomination: format }).toString()
}

async function tx (hash, info = true) {
  const tx = await this.api.getTransactionByHash(hash)
  if (['ContractCreateTx', 'ContractCallTx', 'ChannelForceProgressTx'].includes(tx.tx.type) && info && tx.blockHeight !== -1) {
    try {
      return { ...tx, ...await this.getTxInfo(hash) }
    } catch (e) {}
  }
  return tx
}

async function height () {
  try {
    if (!this._heightPromise) {
      this._heightPromise = this.api.getCurrentKeyBlockHeight()
    }
    return (await this._heightPromise).height
  } finally {
    delete this._heightPromise
  }
}

async function awaitHeight (height, { interval = 5000, attempts = 20 } = {}) {
  let currentHeight
  for (let i = 0; i < attempts; i++) {
    if (i) await pause(interval)
    currentHeight = await this.height()
    if (currentHeight >= height) return currentHeight
  }
  throw new RequestTimedOutError((attempts - 1) * interval, currentHeight, height)
}

/**
 * @deprecated
 */
async function topBlock () {
  return this.api.getTopHeader()
}

async function poll (th, { blocks = 10, interval = 500, allowUnsynced = false } = {}) {
  const max = await this.height() + blocks
  do {
    const tx = await this.tx(th).catch(_ => null)
    if (tx && (tx.blockHeight !== -1 || (allowUnsynced && tx.height))) {
      return tx
    }
    await pause(interval)
  } while (await this.height() < max)
  throw new TxTimedOutError(blocks, th)
}

async function getTxInfo (hash) {
  const result = await this.api.getTransactionInfoByHash(hash)
  return result.callInfo || result
}

async function mempool () {
  return this.api.getPendingTransactions()
}

async function getCurrentGeneration () {
  return this.api.getCurrentGeneration()
}

async function getGeneration (hashOrHeight) {
  if (typeof hashOrHeight === 'string') return this.api.getGenerationByHash(hashOrHeight)
  if (typeof hashOrHeight === 'number') return this.api.getGenerationByHeight(hashOrHeight)
  throw new IllegalArgumentError('Invalid param, param must be hash or height')
}

async function getMicroBlockTransactions (hash) {
  return (await this.api.getMicroBlockTransactionsByHash(hash)).transactions
}

async function getKeyBlock (hashOrHeight) {
  if (typeof hashOrHeight === 'string') return this.api.getKeyBlockByHash(hashOrHeight)
  if (typeof hashOrHeight === 'number') return this.api.getKeyBlockByHeight(hashOrHeight)
  throw new IllegalArgumentError('Invalid param, param must be hash or height')
}

async function getMicroBlockHeader (hash) {
  return this.api.getMicroBlockHeaderByHash(hash)
}

async function txDryRun (tx, accountAddress, options) {
  const { results: [{ result, reason, ...resultPayload }], ...other } =
    await this.api.protectedDryRunTxs({
      ...options,
      txs: [{ tx }],
      accounts: [{
        pubKey: accountAddress,
        amount: DRY_RUN_ACCOUNT.amount
      }]
    })

  if (result === 'ok') return { ...resultPayload, ...other }

  throw Object.assign(
    new DryRunError(reason),
    { tx, accountAddress, options }
  )
}

async function getContractByteCode (contractId) {
  return this.api.getContractCode(contractId)
}

async function getContract (contractId) {
  return this.api.getContract(contractId)
}

async function getName (name) {
  return this.api.getNameEntryByName(name)
}

/**
 * Resolve AENS name and return name hash
 * @param {String} nameOrId
 * @param {String} key in AENS pointers record
 * @param {Object} [options]
 * @param {Boolean} [options.verify] To ensure that name exist and have a corresponding pointer
 * // TODO: avoid that to don't trust to current api gateway
 * @param {Boolean} [options.resolveByNode] Enables pointer resolving using node
 * @return {String} Address or AENS name hash
 */
async function resolveName (nameOrId, key, { verify, resolveByNode } = {}) {
  if (!nameOrId || typeof nameOrId !== 'string') {
    throw new InvalidAensNameError(`Name or address should be a string: ${nameOrId}`)
  }
  try {
    decode(nameOrId)
    return nameOrId
  } catch (error) {}
  if (isNameValid(nameOrId)) {
    if (verify || resolveByNode) {
      const name = await this.api.getNameEntryByName(nameOrId).catch(_ => null)
      if (!name) throw new AensNameNotFoundError(`Name not found: ${nameOrId}`)
      const pointer = name.pointers.find(pointer => pointer.key === key)
      if (!pointer) {
        throw new AensPointerContextError(`Name ${nameOrId} don't have pointers for ${key}`)
      }
      if (resolveByNode) return pointer.id
    }
    return produceNameId(nameOrId)
  }
  throw new InvalidAensNameError(`Invalid name or address: ${nameOrId}`)
}

/**
 * ChainNode Stamp
 *
 * This is implementation of {@link module:@aeternity/aepp-sdk/es/chain--Chain}
 * composed with {@link module:@aeternity/aepp-sdk/es/contract/node--ContractNodeAPI} and
 * {@link module:@aeternity/aepp-sdk/es/oracle/node--OracleNodeAPI}
 * @function
 * @alias module:@aeternity/aepp-sdk/es/chain/node
 * @rtype Stamp
 * @param {Object} [options={}] - Initializer object
 * @return {Object} ChainNode instance
 * @example ChainNode({url: 'https://testnet.aeternity.io/'})
 */
const ChainNode = Chain.compose(NodePool, {
  methods: {
    sendTransaction,
    balance,
    getBalance,
    getAccount,
    topBlock,
    tx,
    height,
    awaitHeight,
    poll,
    getTxInfo,
    mempool,
    getCurrentGeneration,
    getGeneration,
    getMicroBlockHeader,
    getMicroBlockTransactions,
    getKeyBlock,
    txDryRun,
    getContractByteCode,
    getContract,
    getName,
    waitForTxConfirm,
    resolveName
  }
})

export default ChainNode
