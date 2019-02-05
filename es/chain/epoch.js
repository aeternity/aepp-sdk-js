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
import Epoch from '../epoch'
import formatBalance from '../utils/amount-formatter'

async function sendTransaction (tx, options = {}) {
  const { waitMined } = R.merge(this.Chain.defaults, options)
  const { txHash } = await this.api.postTransaction({ tx })
  return waitMined ? this.poll(txHash, options) : txHash
}

async function balance (address, { height, hash, format = true } = {}) {
  const { balance } = await this.api.getAccountByPubkey(address, { height, hash })
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
    throw Error(`Giving up after ${blocks} blocks mined`)
  }

  return probe()
}

async function getTxInfo (hash) {
  return this.api.getTransactionInfoByHash(hash)
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

const EpochChain = Chain.compose(Epoch, {
  methods: {
    sendTransaction,
    balance,
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
    txDryRun
  }
})

export default EpochChain
