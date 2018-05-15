/*
 * ISC License (ISC)
 * Copyright 2018 aeternity developers
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

import { Crypto } from '../../../../'
const {createTxParams, createTxRangeParams} = require('./utils')
const HttpService = require('./index')

class Transactions extends HttpService {
  /**
   * Get transactions in the mempool
   *
   * @returns {Promise<*>}
   */
  async getPendingList () {
    return this.client.ae.getTxs()
  }

  /**
   * Get a block transactions count by hash
   *
   * @param hash
   * @param txTypes
   * @param excludeTxTypes
   * @returns {Promise<number>}
   */
  async getCountByHash (hash, {txTypes, excludeTxTypes}) {
    const { count } = await this.client.ae.getBlockTxsCountByHash(hash, createTxParams({txTypes, excludeTxTypes}))
    return count
  }

  /**
   * Get a block transactions count by height
   *
   * @param height
   * @param txTypes
   * @param excludeTxTypes
   * @returns {Promise<number>}
   */
  async getCountByHeight (height, {txTypes, excludeTxTypes}) {
    const { count } = await this.client.ae.getBlockTxsCountByHeight(height, createTxParams({txTypes, excludeTxTypes}))
    return count
  }

  /**
   * Get a transaction by index in the block by hash
   *
   * @param blockHash
   * @param txIdx
   * @returns {Promise<*>}
   */
  async getFromBlockHash (blockHash, txIdx) {
    return this.client.ae.getTransactionFromBlockHash(blockHash, txIdx)
  }

  /**
   * Get a transaction by index in the block by height
   *
   * @param height
   * @param txIdx
   * @returns {Promise<*>}
   */
  async getFromBlockHeight (height, txIdx) {
    return this.client.ae.getTransactionFromBlockHeight(height, txIdx)
  }

  /**
   * Get a transaction by index in the latest block
   *
   * @param txIdx
   * @returns {Promise<*>}
   */
  async getFromLatest (txIdx) {
    return this.client.ae.getTransactionFromBlockLatest(txIdx)
  }

  /**
   * Get transactions list from a block range by hash
   *
   * @param from
   * @param to
   * @param txTypes
   * @param excludeTxTypes
   * @returns {Promise<*>}
   */
  async filterByHashRange (from, to, {txTypes, excludeTxTypes}) {
    return this.client.ae.getTxsListFromBlockRangeByHash(createTxRangeParams(from, to, {txTypes, excludeTxTypes}))
  }

  /**
   * Get transactions list from a block range by height
   *
   * @param from
   * @param to
   * @param txTypes
   * @param excludeTxTypes
   * @returns {Promise<*>}
   */
  async filterByHeightRange (from, to, {txTypes, excludeTxTypes}) {
    return this.client.ae.getTxsListFromBlockRangeByHeight(createTxRangeParams(from, to, {txTypes, excludeTxTypes}))
  }

  async send (tx) {
    return this.client.ae.postTx({ tx })
  }

  async sendSigned (txHash, privateKey, options = {}) {
    // Get binary from hex variant of the private key
    const binaryKey = Buffer.from(privateKey, 'hex')

    // Split the base58Check part of the transaction
    const base58CheckTx = txHash.split('$')[1]
    // ... and sign the binary create_contract transaction
    const binaryTx = Crypto.decodeBase58Check(base58CheckTx)
    const signature = Crypto.sign(binaryTx, binaryKey)

    // the signed tx deserializer expects a 4-tuple:
    // <tag, version, signatures_array, binary_tx>

    const unpackedSignedTx = [
      Buffer.from([11]),
      Buffer.from([options.version || 1]),
      [Buffer.from(signature)],
      binaryTx
    ]
    return this.client.tx.send(Crypto.encodeTx(unpackedSignedTx))
  }

  async getTransaction (txHash) {
    const { transaction } = await this.client.ae.getTx(txHash, { 'tx_encoding': 'json' })
    return transaction
  }

  async waitForTransaction (txHash, timeout = 60 * 60 * 1000) {
    const intervalTimeout = 2000
    const maxAttempts = Math.floor(timeout / intervalTimeout)
    return new Promise((resolve, reject) => {
      let attempts = 0
      const interval = setInterval(
        async () => {
          if (++attempts < maxAttempts) {
            // TODO integrate into proper logging
            console.log(`\rWaiting for ${txHash} on ${await this.client.base.getHeight()}`)
            let transaction
            try {
              transaction = await this.getTransaction(txHash)
            } catch (e) {
              return reject(e)
            }
            let blockHeight = transaction['block_height']
            if (blockHeight !== -1) {
              // TODO integrate into proper logging
              console.log(`\rTx has been mined in ${blockHeight}`)
              clearInterval(interval)
              resolve(blockHeight)
            }
          } else {
            clearInterval(interval)
            reject(new Error(`Timeout reached after ${attempts} attempts`))
          }
        },
        intervalTimeout
      )
    })
  }
}

module.exports = Transactions
