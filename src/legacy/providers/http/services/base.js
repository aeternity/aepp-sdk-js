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

import HttpService from './index'

/**
 * Wraps the core functionalities of the Epoch HTTP API
 */
class Base extends HttpService {
  /**
   * Retrieve the current block height
   *
   * @returns {Promise<void>}
   */
  async getHeight () {
    const { height } = await this.client.ae.getTop()
    return height
  }

  /**
   * Wait until the block with the given height has been mined
   *
   * @param height
   * @param intervalTimeout specifies the interval time in miliseconds
   * @returns {Promise<any>}
   */
  async waitForBlock (height, intervalTimeout = 5000) {
    return new Promise(
      (resolve, reject) => {
        let interval = setInterval(async () => {
          let currentHeight = await this.getHeight()
          if (currentHeight >= height) {
            clearInterval(interval)
            resolve(currentHeight)
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
  async waitNBlocks (delta) {
    let currentHeight = await this.getHeight()
    let resultBlock = await this.waitForBlock(currentHeight + delta)
    return resultBlock
  }

  /**
   * Send a given amount of tokens to a recipient
   *
   * @param recipient
   * @param amount
   * @param account
   * @param options
   * @returns {Promise<*>}
   */
  async spend (recipient, amount, account, { fee = 1, nonce, payload = '' } = {}) {
    const { pub, priv } = account
    if (priv) {
      let data = await this.client.base.getSpendTx(recipient, amount, pub, { fee, nonce, payload })
      await this.client.tx.sendSigned(data.tx, priv)
      return data
    } else {
      throw new Error('Private key is not set')
    }
  }

  /**
   * Get a block by height
   *
   * @param height
   * @returns {Promise<*>}
   */
  async getBlockByHeight (height) {
    let {data} = await this.client.get('block-by-height', {height}, false)
    return data
  }

  /**
   * Get a block by hash
   *
   * @param hash
   * @returns {Promise<*>}
   */
  async getBlockByHash (hash) {
    let {data} = await this.client.get('block-by-hash', {hash}, false)
    return data
  }

  /**
   * Get the genesis block
   *
   * @param encoding
   * @returns {Promise<*>}
   */
  async getGenesisBlock (encoding) {
    let params = {'tx_encoding': encoding}
    let {data} = await this.client.get('block/genesis', params, true)
    return data
  }

  /**
   * Get the block being mined
   *
   * @param encoding
   * @returns {Promise<*>}
   */
  async getPendingBlock (encoding) {
    let params = {'tx_encoding': encoding}
    let {data} = await this.client.get('block/pending', params, true)
    return data
  }

  /**
   * Get node’s version
   *
   * @param name
   * @returns {Promise<*>}
   */
  async getVersion () {
    let {data} = await this.client.get('version')
    return data
  }

  /**
   * Get node info
   *
   * @param name
   * @returns {Promise<*>}
   */
  async getInfo () {
    return this.client.ae.getInfo()
  }

  /**
   * Get all users’ balances
   * @returns {Promise<*>}
   */
  async getBalances () {
    return this.client.ae.getAccountsBalances()
  }

  async getSpendTx (recipient, amount, sender, { fee = 1, nonce, payload = '' } = {}) {
    const dataToSend = {
      amount,
      sender,
      fee,
      payload,
      'recipient_pubkey': recipient,
      nonce
    }

    try {
      const data = await this.client.ae.postSpend(dataToSend)
      return data
    } catch (e) {
      console.log(e)
      return undefined
    }
  }
}

export default Base
