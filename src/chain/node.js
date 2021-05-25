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
import * as R from 'ramda'

import Chain from './'
import { AE_AMOUNT_FORMATS, formatAmount } from '../utils/amount-formatter'
import TransactionValidator from '../tx/validator'
import NodePool from '../node-pool'
import { assertedType } from '../utils/crypto'
import { pause } from '../utils/other'
import { isNameValid, produceNameId } from '../tx/builder/helpers'
import { DRY_RUN_ACCOUNT, NAME_ID_KEY } from '../tx/builder/schema'

/**
 * ChainNode module
 *
 * This is the complement to {@link module:@aeternity/aepp-sdk/es/chain}.
 * @module @aeternity/aepp-sdk/es/chain/node
 * @export ChainNode
 * @example import { ChainNode } from '@aeternity/aepp-sdk'
 */

async function sendTransaction (tx, options = {}) {
  const { waitMined, verify } = R.merge(this.Ae.defaults, options)
  // Verify transaction before broadcast
  if (verify || (typeof verify !== 'boolean' && this.verifyTxBeforeSend)) {
    const { validation, tx: txObject, txType } = await this.unpackAndVerify(tx)
    if (validation.length) {
      throw Object.assign(new Error('Transaction verification error: ' + JSON.stringify(validation)), {
        code: 'TX_VERIFICATION_ERROR',
        errorData: { validation, tx: txObject, txType },
        txHash: tx
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
    throw Object.assign(error, { rawTx: tx, verifyTx: () => this.unpackAndVerify(tx) })
  }
}

async function waitForTxConfirm (txHash, options = { confirm: 3 }) {
  options.confirm = options.confirm === true ? 3 : options.confirm
  const { blockHeight } = await this.tx(txHash)
  const height = await this.awaitHeight(blockHeight + options.confirm, options)
  const { blockHeight: newBlockHeight } = await this.tx(txHash)
  switch (newBlockHeight) {
    case -1:
      throw new Error(`Transaction ${txHash} is removed from chain`)
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
  throw new Error(`Giving up after ${(attempts - 1) * interval}ms, current height: ${currentHeight}, desired height: ${height}`)
}

/**
 * @deprecated
 */
async function topBlock () {
  return this._isIrisNode
    ? await this.api.getTopHeader()
    : Object.values(await this.api.getTopBlock())[0]
}

async function poll (th, { blocks = 10, interval = 5000, allowUnsynced = false } = {}) {
  const max = await this.height() + blocks
  do {
    const tx = await this.tx(th).catch(_ => null)
    if (tx && (tx.blockHeight !== -1 || (allowUnsynced && tx.height))) {
      return tx
    }
    await pause(interval)
  } while (await this.height() < max)
  throw new Error(`Giving up after ${blocks} blocks mined, transaction hash: ${th}`)
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
  throw new Error('Invalid param, param must be hash or height')
}

async function getMicroBlockTransactions (hash) {
  return (await this.api.getMicroBlockTransactionsByHash(hash)).transactions
}

async function getKeyBlock (hashOrHeight) {
  if (typeof hashOrHeight === 'string') return this.api.getKeyBlockByHash(hashOrHeight)
  if (typeof hashOrHeight === 'number') return this.api.getKeyBlockByHeight(hashOrHeight)
  throw new Error('Invalid param, param must be hash or height')
}

async function getMicroBlockHeader (hash) {
  return this.api.getMicroBlockHeaderByHash(hash)
}

async function txDryRun (tx, accountAddress, options) {
  const { results: [{ result, reason, ...resultPayload }], ...other } =
    await this.api[this._isIrisNode ? 'protectedDryRunTxs' : 'dryRunTxs']({
      ...options,
      txs: [{ tx }],
      accounts: [{
        pubKey: accountAddress,
        amount: DRY_RUN_ACCOUNT.amount
      }]
    })

  if (result === 'ok') return { ...resultPayload, ...other }

  throw Object.assign(
    new Error('Dry run error, ' + reason),
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
 * @param {String} prefix
 * @param {Object} [options]
 * @param {Boolean} [options.verify] Enables resolving by node, needed for compatibility with `verify` option of other methods
 * @param {Boolean} [options.resolveByNode] Enables pointer resolving using node (isn't more durable to resolve it on the node side?)
 * @return {String} Address or AENS name hash
 */
async function resolveName (nameOrId, prefix, { verify, resolveByNode } = {}) {
  if (!nameOrId || typeof nameOrId !== 'string') {
    throw new Error('Invalid name or address. Should be a string')
  }
  const prefixes = Object.keys(NAME_ID_KEY)
  if (!prefixes.includes(prefix)) {
    throw new Error(`Invalid prefix ${prefix}. Should be one of [${prefixes}]`)
  }
  if (assertedType(nameOrId, prefix, true)) return nameOrId

  if (isNameValid(nameOrId)) {
    if (resolveByNode || verify) {
      const name = await this.getName(nameOrId).catch(_ => null)
      if (!name) throw new Error('Name not found')
      const pointer = name.pointers.find(({ id }) => id.split('_')[0] === prefix)
      if (!pointer) throw new Error(`Name ${nameOrId} do not have pointers for ${prefix}`)
      return pointer.id
    }
    return produceNameId(nameOrId)
  }
  throw new Error('Invalid name or address')
}

/**
 * ChainNode Stamp
 *
 * This is implementation of {@link module:@aeternity/aepp-sdk/es/chain--Chain}
 * composed with {@link module:@aeternity/aepp-sdk/es/contract/node--ContractNodeAPI} and {@link module:@aeternity/aepp-sdk/es/oracle/node--OracleNodeAPI}
 * @function
 * @alias module:@aeternity/aepp-sdk/es/chain/node
 * @rtype Stamp
 * @param {Object} [options={}] - Initializer object
 * @return {Object} ChainNode instance
 * @example ChainNode({url: 'https://testnet.aeternity.io/'})
 */
const ChainNode = Chain.compose(TransactionValidator, NodePool, {
  init ({ verifyTx = true }) {
    this.verifyTxBeforeSend = verifyTx
  },
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
