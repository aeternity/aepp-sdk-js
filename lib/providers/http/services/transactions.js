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


const {createTxParams, createTxRangeParams} = require('./utils')

const HttpService = require('./index')
const Crypto = require('../../../utils/crypto')


class Transactions extends HttpService {


  /**
   * Get transactions in the mempool
   *
   * @returns {Promise<*>}
   */
  async getPendingList() {
    let {data} = await this.client.get('transactions')
    return data
  }

  /**
   * Get a block transactions count by hash
   *
   * @param hash
   * @param txTypes
   * @param excludeTxTypes
   * @returns {Promise<number>}
   */
  async getCountByHash(hash, {txTypes, excludeTxTypes}) {
    let params = createTxParams({txTypes, excludeTxTypes})
    let endpoint = `/block/txs/count/hash/${hash}`
    let {data} = await this.client.get(endpoint, params, true)
    return data.count
  }

  /**
   * Get a block transactions count by height
   *
   * @param height
   * @param txTypes
   * @param excludeTxTypes
   * @returns {Promise<number>}
   */
  async getCountByHeight(height, {txTypes, excludeTxTypes}) {
    let params = createTxParams ({txTypes, excludeTxTypes})
    let endpoint = `/block/txs/count/height/${height}`
    let {data} = await this.client.get (endpoint, params, true)
    return data.count
  }

  /**
   * Get a transaction by index in the block by hash
   *
   * @param blockHash
   * @param txIdx
   * @returns {Promise<*>}
   */
  async getFromBlockHash(blockHash, txIdx) {
    let endpoint = `block/tx/hash/${blockHash}/${txIdx}`
    let {data} = await this.client.get (endpoint, {'tx_encoding': 'json'}, true)
    return data
  }

  /**
   * Get a transaction by index in the block by height
   *
   * @param height
   * @param txIdx
   * @returns {Promise<*>}
   */
  async getFromBlockHeight(height, txIdx) {
    let endpoint = `block/tx/height/${height}/${txIdx}`
    let {data} = await this.client.get(endpoint, {'tx_encoding': 'json'}, true)
    return data
  }

  /**
   * Get a transaction by index in the latest block
   *
   * @param txIdx
   * @returns {Promise<*>}
   */
  async getFromLatest(txIdx) {
    let url = `block/tx/latest/${txIdx}`
    let {data} = await this.client.get (url, {'tx_encoding': 'json'}, true)
    return data
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
  async filterByHashRange(from, to, {txTypes, excludeTxTypes}) {
    let url = `block/txs/list/hash`
    let params = createTxRangeParams(from, to, {txTypes, excludeTxTypes})
    let {data} = await this.client.get(url, params, true)
    return data
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
  async filterByHeightRange(from, to, {txTypes, excludeTxTypes}) {
    let endpoint = 'block/txs/list/height'
    let params = createTxRangeParams (from, to, {txTypes, excludeTxTypes})
    let {data} = await this.client.get (endpoint, params, true)
    return data
  }

  async send(tx) {
    let body = {tx}
    let {data} = await this.client.post ('tx', body)
    return data
  }

  async sendSigned(txHash, privateKey, options = {}) {

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

  async getTransaction(txHash) {
    const {data} = await this.client.get(`tx/${txHash}`, {'tx_encoding': 'json'})
    return data.transaction
  }

  async waitForTransaction(txHash, timeout = 60 * 60 * 1000) {
    const intervalTimeout = 2000
    const maxAttempts = Math.floor(timeout / intervalTimeout)
    return await new Promise((resolve, reject) => {
      let attempts = 0
      const interval = setInterval(
        async () => {
          if (++attempts < maxAttempts) {
            // TODO integrate into proper logging
            process.stdout.write(`\rWaiting for ${txHash} on ${await this.client.base.getHeight()}`)
            let transaction
            try {
              transaction = await this.getTransaction(txHash)
            } catch (e) {
              return reject(e)
            }
            let blockHeight = transaction['block_height']
            if (blockHeight !== -1) {
              // TODO integrate into proper logging
              process.stdout.write(`\rTx has been mined in ${blockHeight}`)
              console.log('')
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
      interval.unref()
    })
  }

}

module.exports = Transactions
