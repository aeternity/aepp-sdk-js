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
  AensPointerContextError,
  DryRunError,
  InvalidAensNameError,
  InvalidTxError,
  RequestTimedOutError,
  TxTimedOutError,
  TxNotInChainError,
  ArgumentError
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
  const opt = { ...this.Ae.defaults, ...options }
  if (opt.verify) {
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
    const { txHash } = await this.api.postTransaction({ tx }, {
      __queue: `tx-${await this.address?.(options).catch(() => '')}`
    })

    if (opt.waitMined) {
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
  const { blockHeight } = await this.api.getTransactionByHash(txHash)
  const height = await this.awaitHeight(blockHeight + options.confirm, options)
  const { blockHeight: newBlockHeight } = await this.api.getTransactionByHash(txHash)
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
  const { balance } = await this.getAccount(address, { hash, height }).catch(() => ({ balance: 0 }))

  return formatAmount(balance, { targetDenomination: format }).toString()
}

/**
 * @deprecated use `sdk.api.getTransactionByHash/getTransactionInfoByHash` instead
 */
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
  return (await this.api.getCurrentKeyBlockHeight()).height
}

async function awaitHeight (
  height,
  { interval = this._getPollInterval('block'), attempts = 20 } = {}
) {
  let currentHeight
  for (let i = 0; i < attempts; i++) {
    if (i) await pause(interval)
    currentHeight = await this.height()
    if (currentHeight >= height) return currentHeight
  }
  throw new RequestTimedOutError((attempts - 1) * interval, currentHeight, height)
}

async function poll (th, { blocks = 10, interval = this._getPollInterval('microblock') } = {}) {
  const max = await this.height() + blocks
  do {
    const tx = await this.api.getTransactionByHash(th)
    if (tx.blockHeight !== -1) return tx
    await pause(interval)
  } while (await this.height() < max)
  const status = this.api.getCheckTxInPool && (await this.api.getCheckTxInPool(th)).status
  throw new TxTimedOutError(blocks, th, status)
}

/**
 * @deprecated use `sdk.api.getTransactionInfoByHash` instead
 */
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
  throw new ArgumentError('hashOrHeight', 'a string or number', hashOrHeight)
}

async function getMicroBlockTransactions (hash) {
  return (await this.api.getMicroBlockTransactionsByHash(hash)).transactions
}

async function getKeyBlock (hashOrHeight) {
  if (typeof hashOrHeight === 'string') return this.api.getKeyBlockByHash(hashOrHeight)
  if (typeof hashOrHeight === 'number') return this.api.getKeyBlockByHeight(hashOrHeight)
  throw new ArgumentError('hashOrHeight', 'a string or number', hashOrHeight)
}

async function getMicroBlockHeader (hash) {
  return this.api.getMicroBlockHeaderByHash(hash)
}

async function txDryRunHandler (key) {
  const rs = this._txDryRun[key]
  delete this._txDryRun[key]

  let dryRunRes
  try {
    dryRunRes = await this.api.protectedDryRunTxs({
      top: rs[0].top,
      txEvents: rs[0].txEvents,
      txs: rs.map(req => ({ tx: req.tx })),
      accounts: Array.from(new Set(rs.map(req => req.accountAddress)))
        .map(pubKey => ({ pubKey, amount: DRY_RUN_ACCOUNT.amount }))
    })
  } catch (error) {
    rs.forEach(({ reject }) => reject(error))
    return
  }

  const { results, txEvents } = dryRunRes
  results.forEach(({ result, reason, ...resultPayload }, idx) => {
    const { resolve, reject, tx, options, accountAddress } = rs[idx]
    if (result === 'ok') return resolve({ ...resultPayload, txEvents })
    reject(Object.assign(
      new DryRunError(reason), { tx, accountAddress, options }
    ))
  })
}

async function txDryRun (tx, accountAddress, { top, txEvents, combine }) {
  const key = combine ? [top, txEvents].join() : 'immediate'
  this._txDryRun ??= {}
  this._txDryRun[key] ??= []
  return new Promise((resolve, reject) => {
    this._txDryRun[key].push({ tx, accountAddress, top, txEvents, resolve, reject })
    if (!combine) {
      txDryRunHandler.call(this, key)
      return
    }
    this._txDryRun[key].timeout ??= setTimeout(txDryRunHandler.bind(this, key))
  })
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
      const name = await this.api.getNameEntryByName(nameOrId)
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
