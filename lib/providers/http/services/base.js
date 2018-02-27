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

const HttpService = require ('./index')


/**
 * Wraps the core functionalities of the Epoch HTTP API
 */
class Base extends HttpService {


  /**
   * Retrieve the current block height
   *
   * @returns {Promise<void>}
   */
  async getHeight() {
    const result = await this.client.get ('top')
    return result.data.height
  }

  /**
   * Wait until the block with the given height has been mined
   *
   * @param height
   * @param intervalTimeout specifies the interval time in miliseconds
   * @returns {Promise<any>}
   */
  async waitForBlock(height, intervalTimeout = 5000) {
    return await new Promise (
      (resolve, reject) => {
        let interval = setInterval (async () => {
          let currentHeight = await this.getHeight ()
          if (currentHeight >= height) {
            clearInterval (interval)
            resolve (currentHeight)
          }
        }, intervalTimeout)
      }
    )
  }

  /**
   * Wait until a given amount of blocks has been mined
   *
   * @param delta
   * @returns {Promise<any>}
   */
  async waitNBlocks(delta) {
    let currentHeight = await this.getHeight ()
    let resultBlock = await this.waitForBlock (currentHeight + delta)
    return resultBlock
  }

  /**
   * Send a given amount of tokens to a recipient
   *
   * @param recipient
   * @param amount
   * @param fee
   * @returns {Promise<*>}
   */
  async spend(recipient, amount, fee, options) {
    let success
    try {
      let result
      if (options && options.privateKey) {
        let {tx} = this.client.base.getSpendTx(recipient, amount, options)
        result = await this.client.tx.sendSigned(tx, options.privateKey, options)
      } else {
        result = await this.client.post ('spend-tx', {
          'recipient_pubkey': recipient,
          amount,
          fee
        }, {internal: true})
      }
      if (result.data === {}) success = true
    } catch (e) {
      console.error (e)
      success = false
    }
    if (success) {
      return amount
    } else {
      throw `Could not transfer ${amount}`
    }
  }

  /**
   * Get a block by height
   *
   * @param height
   * @returns {Promise<*>}
   */
  async getBlockByHeight(height) {
    let {data} = await this.client.get ('block-by-height', {height}, false)
    return data
  }

  /**
   * Get a block by hash
   *
   * @param hash
   * @returns {Promise<*>}
   */
  async getBlockByHash(hash) {
    let {data} = await this.client.get ('block-by-hash', {hash}, false)
    return data
  }

  /**
   * Get the genesis block
   *
   * @param encoding
   * @returns {Promise<*>}
   */
  async getGenesisBlock(encoding) {
    let params = {'tx_encoding': encoding}
    let {data} = await this.client.get ('block/genesis', params, true)
    return data
  }

  /**
   * Get the block being mined
   *
   * @param encoding
   * @returns {Promise<*>}
   */
  async getPendingBlock(encoding) {
    let params = {'tx_encoding': encoding}
    let {data} = await this.client.get ('block/pending', params, true)
    return data
  }

  /**
   * Get node’s version
   *
   * @param name
   * @returns {Promise<*>}
   */
  async getVersion() {
    let {data} = await this.client.get ('version')
    return data
  }

  /**
   * Get node info
   *
   * @param name
   * @returns {Promise<*>}
   */
  async getInfo() {
    let {data} = await this.client.get ('info')
    return data
  }

  /**
   * Get all users’ balances
   * @returns {Promise<*>}
   */
  async getBalances() {
    let {data} = await this.client.get ('balances')
    return data
  }

  async getSpendTx(recipient, amount, options = {}) {
    let payload = {
      'amount': amount,
      'sender': await this.client.accounts.getPublicKey (),
      'fee': options && options.fee || 1,
      'recipient_pubkey': recipient
    }

    try {
      let {data} = await this.client.post ('tx/spend', payload)
      return data
    } catch (e) {
      console.log (e)
    }
  }
}


module.exports = Base
