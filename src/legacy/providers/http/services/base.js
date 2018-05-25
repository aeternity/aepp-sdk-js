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
    const { height } = await this.client.ae.api.getTop()
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
      return this.client.tx.sendSigned(data.tx, priv)
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
    return this.client.ae.api.getBlockByHeight(height)
  }

  /**
   * Get a block by hash
   *
   * @param hash
   * @returns {Promise<*>}
   */
  async getBlockByHash (hash) {
    return this.client.ae.api.getBlockByHash(hash)
  }

  /**
   * Get the genesis block
   *
   * @param encoding
   * @returns {Promise<*>}
   */
  async getGenesisBlock (encoding) {
    return this.client.ae.api.getBlockGenesis({ txEncoding: encoding })
  }

  /**
   * Get the block being mined
   *
   * @param encoding
   * @returns {Promise<*>}
   */
  async getPendingBlock (encoding) {
    return this.client.ae.api.getBlockPending({ txEncoding: encoding })
  }

  /**
   * Get node’s version
   *
   * @param name
   * @returns {Promise<*>}
   */
  async getVersion () {
    return this.client.ae.api.getVersion()
  }

  /**
   * Get node info
   *
   * @param name
   * @returns {Promise<*>}
   */
  async getInfo () {
    return this.client.ae.api.getInfo()
  }

  /**
   * Get all users’ balances
   * @returns {Promise<*>}
   */
  async getBalances () {
    return this.client.ae.api.getAccountsBalances()
  }

  async getSpendTx (recipient, amount, sender, { fee = 1, nonce, payload = '' } = {}) {
    const dataToSend = {
      amount,
      sender,
      fee,
      payload,
      recipientPubkey: recipient,
      nonce
    }

    return this.client.ae.api.postSpend(dataToSend)
  }
}

export default Base
