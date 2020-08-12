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

/**
 * Oracle module - routines to interact with the æternity oracle system
 *
 * The high-level description of the oracle system is
 * https://github.com/aeternity/protocol/blob/master/ORACLE.md in the protocol
 * repository.
 * @module @aeternity/aepp-sdk/es/ae/oracle
 * @export Oracle
 * @example import Oracle from '@aeternity/aepp-sdk/es/ae/oracle'
 */

import Ae from './'
import * as R from 'ramda'
import { decodeBase64Check, assertedType } from '../utils/crypto'
import { pause } from '../utils/other'
import { oracleQueryId } from '../tx/builder/helpers'
import { unpackTx } from '../tx/builder'
import { ORACLE_TTL, QUERY_FEE, QUERY_TTL, RESPONSE_TTL } from '../tx/builder/schema'

/**
 * Constructor for Oracle Object (helper object for using Oracle)
 * @alias module:@aeternity/aepp-sdk/es/ae/oracle
 * @instance
 * @function
 * @category async
 * @param {String} oracleId Oracle public key
 * @return {Promise<Object>} Oracle object
 */
async function getOracleObject (oracleId) {
  const oracle = await this.getOracle(oracleId)
  const { oracleQueries: queries } = await this.getOracleQueries(oracleId)
  return {
    ...oracle,
    queries,
    pollQueries: this.pollForQueries.bind(this, oracleId),
    postQuery: this.postQueryToOracle.bind(this, oracleId),
    respondToQuery: this.respondToQuery.bind(this, oracleId),
    extendOracle: this.extendOracleTtl.bind(this, oracleId),
    getQuery: this.getQueryObject.bind(this, oracleId)
  }
}

/**
 * Poll for oracle queries
 * @alias module:@aeternity/aepp-sdk/es/ae/oracle
 * @instance
 * @function
 * @category async
 * @param {String} oracleId Oracle public key
 * @param {Function} onQuery OnQuery callback
 * @param {Object} [options] Options object
 * @param {Number} [options.interval] Poll interval(default: 5000)
 * @return {Function} stopPolling - Stop polling function
 */
function pollForQueries (oracleId, onQuery, { interval = 5000 } = {}) {
  const knownQueryIds = new Set()
  const checkNewQueries = async () => {
    const queries = ((await this.getOracleQueries(oracleId)).oracleQueries || [])
      .filter(({ id }) => !knownQueryIds.has(id))
    queries.forEach(({ id }) => knownQueryIds.add(id))
    if (queries.length) onQuery(queries)
  }

  checkNewQueries()
  const intervalId = setInterval(checkNewQueries, interval)
  // TODO: Return just a callback in the next major release
  return Promise.resolve(() => clearInterval(intervalId))
}

/**
 * Constructor for OracleQuery Object (helper object for using OracleQuery)
 * @alias module:@aeternity/aepp-sdk/es/ae/oracle
 * @instance
 * @function
 * @category async
 * @param {String} oracleId Oracle public key
 * @param {String} queryId Oracle Query id
 * @return {Promise<Object>} OracleQuery object
 */
async function getQueryObject (oracleId, queryId) {
  const q = await this.getOracleQuery(oracleId, queryId)
  return {
    ...q,
    decodedQuery: decodeBase64Check(q.query.slice(3)).toString(),
    decodedResponse: decodeBase64Check(q.response.slice(3)).toString(),
    respond: this.respondToQuery.bind(this, oracleId, queryId),
    pollForResponse: this.pollForQueryResponse.bind(this, oracleId, queryId),
    decode: (data) => decodeBase64Check(data.slice(3))
  }
}

/**
 * Poll for oracle query response
 * @alias module:@aeternity/aepp-sdk/es/ae/oracle
 * @instance
 * @function
 * @category async
 * @param {String} oracleId Oracle public key
 * @param {String} queryId Oracle Query id
 * @param {Object} [options] Options object
 * @param {Object} [options.attempts] Poll attempt's(default: 20)
 * @param {Object} [options.interval] Poll interval(default: 5000)
 * @return {Promise<Object>} OracleQuery object
 */
export async function pollForQueryResponse (oracleId, queryId, { attempts = 20, interval = 5000 } = {}) {
  for (let i = 0; i < attempts; i++) {
    if (i) await pause(interval)
    const { response } = await this.getOracleQuery(oracleId, queryId)
    const responseBuffer = decodeBase64Check(assertedType(response, 'or'))
    if (responseBuffer.length) {
      return { response, decode: () => responseBuffer } // TODO: Return just responseBuffer
    }
  }
  throw Error(`Giving up after ${(attempts - 1) * interval}ms`)
}

/**
 * Register oracle
 * @alias module:@aeternity/aepp-sdk/es/ae/oracle
 * @instance
 * @function
 * @category async
 * @param {String} queryFormat Format of query
 * @param {String} responseFormat Format of query response
 * @param {Object} [options={}] Options
 * @param {String|Number} [options.queryFee] queryFee Oracle query Fee
 * @param {Object} [options.oracleTtl] oracleTtl OracleTtl object {type: 'delta|block', value: 'number'}
 * @param {Number} [options.abiVersion] abiVersion Always 0 (do not use virtual machine)
 * @param {Number|String} [options.fee] fee Transaction fee
 * @param {Number|String} [options.ttl] Transaction time to leave
 * @return {Promise<Object>} Oracle object
 */
async function registerOracle (queryFormat, responseFormat, options = {}) {
  const opt = R.merge(this.Ae.defaults, options) // Preset VmVersion for oracle
  const accountId = await this.address(opt)

  const oracleRegisterTx = await this.oracleRegisterTx(R.merge(opt, {
    accountId,
    queryFormat,
    responseFormat
  }))
  return {
    ...await this.send(oracleRegisterTx, opt),
    ...await this.getOracleObject(`ok_${accountId.slice(3)}`)
  }
}

/**
 * Post query to oracle
 * @alias module:@aeternity/aepp-sdk/es/ae/oracle
 * @instance
 * @function
 * @category async
 * @param {String} oracleId Oracle public key
 * @param {String} query Oracle query object
 * @param {Object} [options={}]
 * @param {String|Number} [options.queryTtl] queryTtl Oracle query time to leave
 * @param {String|Number} [options.responseTtl] queryFee Oracle query response time to leave
 * @param {String|Number} [options.queryFee] queryFee Oracle query fee
 * @param {Number} [options.fee] fee Transaction fee
 * @param {Number} [options.ttl] Transaction time to leave
 * @return {Promise<Object>} Query object
 */
async function postQueryToOracle (oracleId, query, options = {}) {
  const opt = R.merge(this.Ae.defaults, options)
  const senderId = await this.address(opt)

  const oracleRegisterTx = await this.oraclePostQueryTx(R.merge(opt, {
    oracleId,
    senderId,
    query
  }))
  const queryId = oracleQueryId(senderId, unpackTx(oracleRegisterTx).tx.nonce, oracleId)
  return {
    ...await this.send(oracleRegisterTx, opt),
    ...await this.getQueryObject(oracleId, queryId)
  }
}

/**
 * Extend oracle ttl
 * @alias module:@aeternity/aepp-sdk/es/ae/oracle
 * @instance
 * @function
 * @category async
 * @param {String} oracleId Oracle public key
 * @param {String} oracleTtl Oracle time to leave for extend
 * @param {Object} [options={}]
 * @param {Number} [options.fee] fee Transaction fee
 * @param {Number} [options.ttl] Transaction time to leave
 * @return {Promise<Object>} Oracle object
 */
async function extendOracleTtl (oracleId, oracleTtl, options = {}) {
  const opt = R.merge(this.Ae.defaults, options)
  const callerId = await this.address(opt)

  const oracleExtendTx = await this.oracleExtendTx(R.merge(opt, {
    oracleId,
    callerId,
    oracleTtl
  }))
  return {
    ...await this.send(oracleExtendTx, opt),
    ...await this.getOracleObject(oracleId)
  }
}

/**
 * Extend oracle ttl
 * @alias module:@aeternity/aepp-sdk/es/ae/oracle
 * @instance
 * @function
 * @category async
 * @param {String} oracleId Oracle public key
 * @param {String} queryId Oracle query id
 * @param {String} response Oracle query response
 * @param {Object} [options={}]
 * @param {Number} [options.responseTtl] responseTtl Query response time to leave
 * @param {Number} [options.fee] Transaction fee
 * @param {Number} [options.ttl] Transaction time to leave
 * @return {Promise<Object>} Oracle object
 */
async function respondToQuery (oracleId, queryId, response, options = {}) {
  const opt = R.merge(this.Ae.defaults, options)
  const callerId = await this.address(opt)

  const oracleRespondTx = await this.oracleRespondTx(R.merge(opt, {
    oracleId,
    queryId,
    callerId,
    response
  }))
  return {
    ...await this.send(oracleRespondTx, opt),
    ...await this.getOracleObject(oracleId)
  }
}

/**
 * Oracle Stamp
 *
 * Oracle provides oracle-system related methods atop
 * {@link module:@aeternity/aepp-sdk/es/ae--Ae} clients.
 * @function
 * @alias module:@aeternity/aepp-sdk/es/ae/oracle
 * @rtype Stamp
 * @param {Object} [options={}] - Initializer object
 * @return {Object} Oracle instance
 */
const Oracle = Ae.compose({
  methods: {
    registerOracle,
    respondToQuery,
    extendOracleTtl,
    postQueryToOracle,
    pollForQueryResponse,
    pollForQueries,
    getOracleObject,
    getQueryObject
  },
  deepProps: {
    Ae: {
      defaults: {
        queryFee: QUERY_FEE,
        oracleTtl: ORACLE_TTL,
        queryTtl: QUERY_TTL,
        responseTtl: RESPONSE_TTL
      }
    }
  }
})

export default Oracle
