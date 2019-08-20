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
import Oracle from '../oracle/node'
import formatBalance from '../utils/amount-formatter'
import TransactionValidator from '../tx/validator'
import NodePool from '../node-pool'

/**
 * ChainNode module
 *
 * This is the complement to {@link module:@aeternity/aepp-sdk/es/chain}.
 * @module @aeternity/aepp-sdk/es/chain/node
 * @export ChainNode
 * @example import ChainNode from '@aeternity/aepp-sdk/es/chain/node'
 */

async function sendTransaction (tx, options = {}) {
  const { waitMined, verify } = R.merge(this.Chain.defaults, options)
  // Verify transaction before broadcast
  if (this.verifyTxBeforeSend || verify) {
    const { validation, tx: txObject, txType } = await this.unpackAndVerify(tx)
    if (validation.length) {
      throw Object.assign(Error('Transaction verification error'), {
        code: 'TX_VERIFICATION_ERROR',
        errorData: { validation, tx: txObject, txType },
        txHash: tx
      })
    }
  }

  try {
    const { txHash } = await this.api.postTransaction({ tx })
    return waitMined ? { ...(await this.poll(txHash, options)), rawTx: tx } : { hash: txHash, rawTx: tx }
  } catch (e) {
    throw Object.assign(
      (new Error(e.message)),
      {
        rawTx: tx,
        verifyTx: () => this.unpackAndVerify(tx)
      }
    )
  }
}

async function getAccount (address, { height, hash } = {}) {
  if (height) return this.api.getAccountByPubkeyAndHeight(address, height)
  if (hash) return this.api.getAccountByPubkeyAndHash(address, hash)
  return this.api.getAccountByPubkey(address)
}

async function balance (address, { height, hash, format = false } = {}) {
  const { balance } = await this.getAccount(address, { hash, height })

  return format ? formatBalance(balance) : balance.toString()
}

async function tx (hash, info = false) {
  const tx = await this.api.getTransactionByHash(hash)
  if (['ContractCreateTx', 'ContractCallTx'].includes(tx.tx.type) && info) {
    try {
      return { ...tx, ...await this.getTxInfo(hash) }
    } catch (e) {
      return tx
    }
  }
  return tx
}

async function height () {
  return (await this.api.getCurrentKeyBlockHeight()).height
}

async function pause (duration) {
  await new Promise(resolve => setTimeout(resolve, duration))
}

async function awaitHeight (h, { interval = 5000, attempts = 20 } = {}) {
  const instance = this

  async function probe (left) {
    const current = await instance.height()
    if (current >= h) {
      return current
    }
    if (left > 0) {
      await pause(interval)
      return probe(left - 1)
    }
    throw Error(`Giving up after ${attempts * interval}ms, current=${current}, h=${h}`)
  }

  return probe(attempts)
}

async function topBlock () {
  const top = await this.api.getTopBlock()
  return top[R.head(R.keys(top))]
}

async function poll (th, { blocks = 10, interval = 5000 } = {}) {
  const instance = this
  const max = await this.height() + blocks

  async function probe () {
    const tx = await instance.tx(th)
    if (tx.blockHeight !== -1) {
      return tx
    }
    if (await instance.height() < max) {
      await pause(interval)
      return probe()
    }
    throw new Error(`Giving up after ${blocks} blocks mined. TxHash ${th}`)
  }

  return probe()
}

async function getTxInfo (hash) {
  return this.api.getTransactionInfoByHash(hash).then(res => res.callInfo ? res.callInfo : res)
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

async function txDryRun (txs, accounts, top) {
  return this.api.dryRunTxs({ txs, accounts, top })
}

async function getContractByteCode (contractId) {
  return this.api.getContractCode(contractId)
}

async function getName (name) {
  return this.api.getNameEntryByName(name)
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
 * @example ChainNode({url: 'https://sdk-testnet.aepps.com/'})
 */
const ChainNode = Chain.compose(Oracle, TransactionValidator, NodePool, {
  init ({ verifyTx = false }) {
    this.verifyTxBeforeSend = verifyTx
  },
  methods: {
    sendTransaction,
    balance,
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
    getName
  }
})

export default ChainNode
