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

const {actions, origins, targets} = require('../types')
const {AeSubscription} = require('../subscriptions')

class Oracles {
  /**
   *
   */
  constructor (wsProvider) {
    this.wsProvider = wsProvider
  }

  /**
   * Registers an oracle on the blockchain
   *
   * @param queryFormat format of the input
   * @param responseFormat format of the response
   * @param queryFee regular costs to post a query
   * @param ttl relative number of blocks before a query is dropped
   * @param fee the fee to register the oracle
   */
  register (queryFormat, responseFormat, queryFee, ttl, fee) {
    let data = {
      'target': targets.ORACLE,
      'action': actions.REGISTER,
      'payload': {
        'type': 'OracleRegisterTxObject',
        'vsn': 1,
        'query_format': queryFormat,
        'response_format': responseFormat,
        'query_fee': queryFee,
        'ttl': {'type': 'delta', 'value': ttl},
        'fee': fee
      }
    }

    let promise = new Promise((resolve, reject) => {
      let subscription = new AeSubscription({
        pendingOracleId: undefined,
        matches: (data) => {
          return (data.action === actions.MINED_BLOCK) ||
            (data.action === actions.NEW_BLOCK) ||
            (data.action === actions.REGISTER && data.origin === origins.ORACLE)
        },
        update: (data) => {
          if ([actions.MINED_BLOCK, actions.NEW_BLOCK].includes(data.action)) {
            if (this.pendingOracleId) {
              this.wsProvider.removeSubscription(subscription)
              this.subscribe(this.pendingOracleId)
              resolve(this.pendingOracleId)
            }
          } else {
            this.pendingOracleId = data.payload['oracle_id']
          }
        }
      })
      this.wsProvider.addSubscription(subscription)
    })
    this.wsProvider.sendJson(data)
    return promise
  }

  /**
   * Subscribes to an oracle
   *
   * @param oracleId Identifies the oracle on the blockchain
   */
  subscribe (oracleId) {
    let data = {
      'target': targets.CHAIN,
      'action': actions.SUBSCRIBE,
      'payload': {
        'type': 'oracle_query',
        'oracle_id': oracleId
      }
    }
    this.wsProvider.sendJson(data)
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
   */
  async query (oracleId, queryFee, queryTtl, responseTtl, fee, query) {
    let data = {
      'target': targets.ORACLE,
      'action': actions.QUERY,
      'payload': {
        'type': 'OracleQueryTxObject',
        'vsn': 1,
        'oracle_pubkey': oracleId,
        'query_fee': queryFee,
        'query_ttl': {'type': 'delta', 'value': queryTtl},
        'response_ttl': {'type': 'delta', 'value': responseTtl},
        'fee': fee,
        'query': typeof query.toString !== 'undefined' ? query.toString() : query
      }
    }

    // First specify to resovle the `query_id` once the subscription
    // has been notified
    let queryAcknowledged = new Promise((resolve, reject) => {
      const subscription = new AeSubscription({
        action: actions.QUERY,
        origin: origins.ORACLE,
        update: (data) => {
          let queryId = data.payload['query_id']
          this.wsProvider.removeSubscription(subscription)
          resolve(queryId)
        }
      })
      this.wsProvider.addSubscription(subscription)
    })
    // then send the query data
    this.wsProvider.sendJson(data)
    // wait for the query being ackowledged
    let queryId = await queryAcknowledged

    // then specify to resolve the query payload once the
    // subscription has been notified
    let receivedResponse = new Promise((resolve, reject) => {
      const subscription = new AeSubscription({
        action: actions.NEW_ORACLE_RESPONSE,
        origin: origins.CHAIN,
        update: (data) => {
          this.wsProvider.removeSubscription(subscription)
          resolve(data.payload)
        }
      })
      this.wsProvider.addSubscription(subscription)
    })

    // subscribe to the query response
    this.subscribeToResponse(queryId)

    return receivedResponse
  }

  /**
   * Subscribe to the event when the query gets answered
   *
   * @param queryId
   */
  subscribeToResponse (queryId) {
    let data = {
      'target': targets.CHAIN,
      'action': actions.SUBSCRIBE,
      'payload': {
        'type': 'oracle_response',
        'query_id': queryId
      }
    }
    this.wsProvider.sendJson(data)
    return data
  }

  /**
   * Responds to a query
   *
   * @param queryId
   * @param fee a transction fee
   * @param response the response
   */
  respond (queryId, fee, response) {
    let data = {
      'target': targets.ORACLE,
      'action': actions.RESPONSE,
      'payload': {
        'type': 'OracleResponseTxObject',
        'vsn': 1,
        'query_id': queryId,
        'fee': fee,
        'response': response
      }
    }
    this.wsProvider.sendJson(data)
    return data
  }

  setResolver (callback) {
    if (this.currentResolver) {
      this.wsProvider.removeSubscription(this.currentResolver)
    }
    let resolver = new AeSubscription(
      new AeSubscription({
        action: actions.NEW_ORACLE_QUERY,
        origin: origins.CHAIN,
        update: (data) => {
          callback(data.payload)
        }
      })
    )
    this.wsProvider.addSubscription(resolver)
    this.currentResolver = resolver
  }
}

module.exports = Oracles
