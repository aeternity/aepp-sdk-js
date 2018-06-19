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
import Epoch from '../epoch'

const sendTransaction = client => async (tx, options = {}) => {
  const opt = R.merge(client.defaults, options)
  const { txHash } = await client.api.postTx({ tx })
  return opt.waitMined ? client.poll(txHash, opt) : txHash
}

const balance = client => async (address, { height, hash } = {}) => {
  return (await client.api.getAccountBalance(address, { height, hash })).balance
}

const tx = client => async hash => {
  return (await client.api.getTx(hash, { txEncoding: 'json' })).transaction
}

const height = client => async () => (await client.api.getTop()).height

const awaitHeight = client => async (h, { interval = 5000, attempts = 12 } = {}) => {
  async function probe (resolve, reject, left) {
    const _probe = probe // Workaround for Webpack bug
    try {
      const current = await client.height()
      if (current >= h) {
        resolve(current)
      } else if (left > 0) {
        setTimeout(() => _probe(resolve, reject, left - 1), interval)
      } else {
        reject(Error(`Giving up after ${attempts * interval}ms`))
      }
    } catch (e) {
      reject(e)
    }
  }

  return new Promise((resolve, reject) => probe(resolve, reject, attempts))
}

const poll = client => async (th, { blocks = 10, interval = 5000 } = {}) => {
  const max = await client.height() + blocks

  async function probe (resolve, reject) {
    const _probe = probe // Workaround for Webpack bug
    try {
      const tx = await client.tx(th)
      if (tx.blockHeight !== -1) {
        resolve(tx)
      } else {
        if (await client.height() < max) {
          setTimeout(() => _probe(resolve, reject), interval)
        } else {
          reject(Error(`Giving up after ${blocks} blocks mined`))
        }
      }
    } catch (e) {
      reject(e)
    }
  }

  return new Promise((resolve, reject) => probe(resolve, reject))
}

const mempool = client => async () => {
  return client.getTxs()
}

/**
 * Epoch node based `Chain` factory
 *
 * @param {string} url - URL to connect to
 * @param {{ internalUrl: string, websocketUrl: string, debug: boolean, defaults: Object }} [options={}]
 * @return {Promise<Chain>}
 */
export default async function EpochChain (url, options = {}) {
  const epoch = Epoch(url, options)

  return Object.freeze(Object.assign(epoch, {
    sendTransaction: sendTransaction(epoch),
    balance: balance(epoch),
    tx: tx(epoch),
    height: height(epoch),
    awaitHeight: awaitHeight(epoch),
    poll: poll(epoch),
    mempool: mempool(epoch)
  }))
}
