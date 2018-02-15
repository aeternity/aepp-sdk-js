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


const EventEmitter = require('events').EventEmitter
const {actions} = require('../types')
const {AeSubscription, OracleRegistrationSubscription} = require('../subscriptions')

class Oracles extends EventEmitter {

  /**
   *
   */
  constructor(wsProvider) {
    super()

    let _this = this
    this._ws = wsProvider

    this._ws.addSubscription(new OracleRegistrationSubscription(this._ws))

    this._ws.addSubscription(
      new AeSubscription({
        action: actions.QUERY,
        origin: 'oracle',
        update: (data) => {
          _this._ws.emit ('query', data.payload['query_id'])
        }
      })
    )

    this._ws.addSubscription(
      new AeSubscription({
        action: actions.SUBSCRIBE,
        origin: 'oracle',
        update: (data) => {
          _this._ws.emit ('subscribed', data.payload['subscribed_to'])
        }
      })
    )

    this._ws.addSubscription(
      new AeSubscription({
        action: actions.NEW_ORACLE_QUERY,
        origin: 'chain',
        update: (data) => _this._ws.emit ('newQuery', data.payload)
      })
    )

    this._ws.addSubscription(
      new AeSubscription({
        action: actions.NEW_ORACLE_RESPONSE,
        origin: 'chain',
        update: (data) => _this._ws.emit ('response', data.payload)
      })
    )

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
  register(queryFormat, responseFormat, queryFee, ttl, fee) {
    let data = {
      'target': 'oracle',
      'action': 'register',
      'payload': {
        'type': 'OracleRegisterTxObject',
        'vsn': 1,
        'account': this.account,
        'query_format': queryFormat,
        'response_format': responseFormat,
        'query_fee': queryFee,
        'ttl': {'type': 'delta', 'value': ttl},
        'fee': fee
      }
    }

    this._ws.send (JSON.stringify (data), (error) => {
      if (error) {
        console.error (error)
      }
    })
    return data
  }


  /**
   * Subscribes to an oracle
   *
   * @param oracleId Identifies the oracle on the blockchain
   */
  subscribe(oracleId) {
    let data = {
      'target': 'chain', // 'oracle',
      'action': 'subscribe',
      'payload': {
        'type': 'oracle_query',
        'oracle_id': oracleId
      }
    }
    this._ws.send (JSON.stringify (data))
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
  query(oracleId, queryFee, queryTtl, responseTtl, fee, query) {
    let data = {
      'target': 'oracle',
      'action': 'query',
      'payload': {
        'type': 'OracleQueryTxObject',
        'vsn': 1,
        'oracle_pubkey': oracleId,
        'query_fee': queryFee,
        'query_ttl': {'type': 'delta', 'value': queryTtl},
        'response_ttl': {'type': 'delta', 'value': responseTtl},
        'fee': fee,
        'query': typeof query.toString !== 'undefined' ? query.toString(): query
      }
    }
    this._ws.send (JSON.stringify (data))
    return data
  }

  /**
   * Subscribe to the event when the query gets answered
   *
   * @param queryId
   */
  subscribeQuery(queryId) {
    let data = {
      'target': 'chain',
      'action': 'subscribe',
      'payload': {
        'type': 'oracle_response',
        'query_id': queryId
      }
    }
    this._ws.send (JSON.stringify (data))
    return data
  }

  /**
   * Responds to a query
   *
   * @param queryId
   * @param fee a transction fee
   * @param response the response
   */
  respond(queryId, fee, response) {
    let data = {
      'target': 'oracle',
      'action': 'response',
      'payload': {
        'type': 'OracleResponseTxObject',
        'vsn': 1,
        'query_id': queryId,
        'fee': fee,
        'response': response
      }
    }
    this._ws.send (JSON.stringify (data))
    return data
  }

  registerObserver(observer) {
    this.messageObservers.push(observer)
  }

}

module.exports = Oracles
