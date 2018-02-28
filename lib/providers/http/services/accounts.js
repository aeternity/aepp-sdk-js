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

const {createTxParams} = require('./utils')
const HttpService = require('./index')

/**
 * Wraps all account related services of the Epoch HTTP API
 */
class Accounts extends HttpService {

  constructor(httpClient) {
    super(httpClient)
    this.BASE_ENDPOINT = 'account'
  }

  /**
   * Retrieve the public key of the account
   *
   * @returns {Promise<string>}
   */
  async getPublicKey() {
    let url = `${this.BASE_ENDPOINT}/pub-key`
    let {data} = await this.client.get(url, {}, true)
    return data['pub_key']
  }

  /**
   * Retrieves the account balance
   *
   *
   * @returns {Promise<Accounts.getBalance>}
   */
  async getBalance({height, hash} = {}) {
    let pubKey = await this.getPublicKey()
    let url = `${this.BASE_ENDPOINT}/balance/${pubKey}`
    try {
      let {data} = await this.client.get (url, {height, hash}, true)
      return data.balance
    } catch ({response}) {
      throw `${pubKey}: ${response.data.reason}`
    }
  }

  /**
   * Get accounts’s transactions included in blocks in the longest chain
   *
   * @param limit
   * @param offset
   * @param txTypes
   * @param excludeTxTypes
   * @returns {Promise<*>}
   */
  async getTransactions({limit, offset, txTypes, excludeTxTypes} = {}) {
    // TODO tests?
    const params = {
      ...createTxParams({txTypes, excludeTxTypes}),
      limit,
      offset,
      'tx_encoding': 'json',
    }
    let pubKey = await this.getPublicKey()
    try {
      let url = `${this.BASE_ENDPOINT}/txs/${pubKey}`
      let {data} = await this.client.get(url, params, true)
      return data.transactions
    } catch (e) {
      if (e.response.status === 404) {
        throw 'Account has no transactions'
      } else {
        throw new Error(`Status: ${e.response.status} Data: '${e.response.data}'`)
      }
    }
  }

  async getTransactionCount({txTypes, excludeTxTypes} = {}) {
    // This method is a work around to receive a nonce until a
    // proper endpoint is implemented
    // TODO change this when endpoint is provided
    let options = {txTypes, excludeTxTypes, limit: 100}
    let transactions = await this.getTransactions(options)
    return transactions && transactions.length || 0
  }

}

module.exports = Accounts
