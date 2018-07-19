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

async function sendTransaction (tx, options = {}) {
  const {waitMined} = R.merge(this.Chain.defaults, options)
  const {txHash} = await this.api.postTx({tx})
  return waitMined ? this.poll(txHash, options) : txHash
}

async function balance (address, {height, hash} = {}) {
  return (await this.api.getAccountBalance(address, {height, hash})).balance
}

async function tx (hash) {
  return (await this.api.getTx(hash)).transaction
}

async function height () {
  return (await this.api.getTop()).height
}

async function awaitHeight (h, {interval = 5000, attempts = 12} = {}) {
  const instance = this

  async function probe (resolve, reject, left) {
    try {
      const current = await instance.height()
      if (current >= h) {
        resolve(current)
      } else if (left > 0) {
        setTimeout(() => probe(resolve, reject, left - 1), interval)
      } else {
        reject(Error(`Giving up after ${attempts * interval}ms`))
      }
    } catch (e) {
      reject(e)
    }
  }

  return new Promise((resolve, reject) => probe(resolve, reject, attempts))
}

async function poll (th, {blocks = 10, interval = 5000} = {}) {
  const instance = this
  const max = await this.height() + blocks

  async function probe (resolve, reject) {
    try {
      const tx = await instance.tx(th)
      if (tx.blockHeight !== -1) {
        resolve(tx)
      } else {
        if (await instance.height() < max) {
          setTimeout(() => probe(resolve, reject), interval)
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

async function mempool () {
  return this.getTxs()
}

const EpochChain = Chain.compose(Epoch, {
  methods: {
    sendTransaction,
    balance,
    tx,
    height,
    awaitHeight,
    poll,
    mempool
  }
})

export default EpochChain
