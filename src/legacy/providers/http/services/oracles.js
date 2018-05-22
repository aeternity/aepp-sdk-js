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

import HttpService from './index'

class Oracles extends HttpService {
  async getOracles () {
    return this.client.ae.api.getActiveRegisteredOracles()
  }

  async getOracleQuestions (oracleId, from, max) {
    return this.client.ae.api.getOracleQuestions(oracleId, { from, max })
  }

  /**
   * Registers an oracle on the blockchain
   *
   * @param queryFormat format of the input
   * @param responseFormat format of the response
   * @param queryFee regular costs to post a query
   * @param ttl relative number of blocks before a query is dropped
   * @param fee the fee to register the oracle
   * @param account
   * @param options
   */
  async register (queryFormat, responseFormat, queryFee, ttl, fee, account, options) {
    const { priv, pub } = account
    let payload = {
      'response_format': responseFormat,
      'fee': fee,
      'query_fee': queryFee,
      'ttl': {
        'type': 'delta',
        'value': ttl
      },
      'nonce': options && options.nonce,
      'query_format': queryFormat,
      'account': pub
    }
    const data = await this.client.ae.api.postOracleRegister(payload)
    await this.client.tx.sendSigned(data.tx, priv, options)
    return data
  }

  /**
   * Posts a query to an oracle
   *
   * @param oracleId
   * @param queryFee reward for the oracle to respond to the query
   * @param queryTtl relative number of blocks before the query dies
   * @param responseTtl relative number of blocks before the response dies
   * @param fee transaction fee
   * @param query the query
   * @param privateKey
   * @param options
   */
  async query (oracleId, queryFee, queryTtl, responseTtl, fee, query, account, options = {}) {
    let payload = {
      'response_ttl': {
        'type': 'delta',
        'value': responseTtl
      },
      sender: account.pub,
      query,
      'query_ttl': {
        'type': 'delta',
        'value': queryTtl
      },
      'fee': fee,
      'query_fee': queryFee,
      'nonce': options && options.nonce,
      'oracle_pubkey': oracleId
    }

    const data = await this.client.ae.api.postOracleQuery(payload)
    return this.client.tx.sendSigned(data.tx, account.priv, options)
  }

  /**
   * Responds to a query
   *
   * @param queryId
   * @param fee a transction fee
   * @param response the response
   * @param privateKey
   */
  async respond (queryId, fee, response, privateKey, options) {
    let payload = {
      'oracle': null,
      'query_id': {},
      'response': 'response',
      'fee': 0,
      'nonce': options && options.nonce
    }
    const data = await this.client.ae.api.postOracleResponse(payload)
    return this.client.tx.sendSigned(data.tx, privateKey)
  }
}

export default Oracles
