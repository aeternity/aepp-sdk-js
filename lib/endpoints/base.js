/*
 * Copyright 2018 Æternity Anstalt
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

/**
 * Wraps the core functionalities of the Epoch HTTP API
 */
class Base {
  constructor(epochClient) {
    this.client = epochClient
  }

  /**
   * Retrieve the current block height
   *
   * @returns {Promise<void>}
   */
  async getBlockHeight() {
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
          let currentHeight = await this.getBlockHeight ()
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
    let currentHeight = await this.getBlockHeight ()
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
  async spend(recipient, amount, fee) {
    let success
    try {
      const result = await this.client.post ('spend-tx', {
        'recipient_pubkey': recipient,
        amount,
        fee
      }, {internal: true})
      success = true
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

}


module.exports = Base
