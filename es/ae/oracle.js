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
import { decodeBase64Check } from '../utils/crypto'

/**
 * Constructor for Oracle Object (helper object for using Oracle)
 * @category async
 * @param {String} oracleId Oracle public key
 * @return {Promise<Object>} Oracle object
 */
async function OracleObject (oracleId) {
  const oracle = await this.getOracle(oracleId)
  const { oracleQueries: queries } = await this.getOracleQueries(oracleId)
  return {
    ...oracle,
    queries,
    postQuery: (query, options) => this.postQueryToOracle(oracleId, query, options),
    extendOracle: (oracleTtl, options) => this.extendOracleTtl(oracleId, oracleTtl, options),
    respond: (queryId, response, options) => this.respondToQuery(oracleId, queryId, response, options),
    getQuery: (queryId) => {
      const query = queries.find(q => q.id === queryId)
      return {
        ...query,
        pullForResponse: () => {},
        decode: () => decodeBase64Check(query.response.slice(3))
      }
    }
  }
}

/**
 * Register oracle
 * @instance
 * @category async
 * @param {String} queryFormat Format of query
 * @param {String} responseFormat Format of query response
 * @param {Object} [options={}] Options
 * @param {String|Number} [options.queryFee] queryFee Oracle query Fee
 * @param {String|Number} [options.oracleTtl] oracleTtl OracleTtl object {type: 'delta|block', value: 'number'}
 * @param {Number} [options.vmVersion] vmVersion Always 0 (do not use virtual machine)
 * @param {Number} [options.fee] fee Transaction fee
 * @param {Number} [options.ttl] Transaction time to leave
 * @return {Promise<Object>} Oracle object
 */
async function registerOracle (queryFormat, responseFormat, options = {}) {
  const opt = R.merge(R.merge(this.Ae.defaults, { vmVersion: this.Ae.defaults.oracleVmVersion }), options) // Preset VmVersion for oracle
  const accountId = await this.address()

  const oracleRegisterTx = await this.oracleRegisterTx(R.merge(opt, {
    accountId,
    queryFormat,
    responseFormat
  }))
  await this.send(oracleRegisterTx, opt)
  return OracleObject.bind(this)(`ok_${accountId.slice(3)}`)
}

/**
 * Post query to oracle
 * @instance
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
  const senderId = await this.address()

  const oracleRegisterTx = await this.oraclePostQueryTx(R.merge(opt, {
    oracleId,
    senderId,
    query
  }))
  await this.send(oracleRegisterTx, opt)
  return OracleObject.bind(this)(oracleId)
}

/**
 * Extend oracle ttl
 * @instance
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
  const callerId = await this.address()

  const oracleExtendTx = await this.oracleExtendTx(R.merge(opt, {
    oracleId,
    callerId,
    oracleTtl
  }))
  await this.send(oracleExtendTx, opt)
  return OracleObject.bind(this)(oracleId)
}

/**
 * Extend oracle ttl
 * @instance
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
  const callerId = await this.address()

  const oracleRespondTx = await this.oracleRespondTx(R.merge(opt, {
    oracleId,
    queryId,
    callerId,
    response
  }))
  await this.send(oracleRespondTx, opt)
  return OracleObject.bind(this)(oracleId)
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
    postQueryToOracle
  },
  deepProps: { Ae: { defaults: {
    oracleVmVersion: 0,
    queryFee: 30000,
    oracleTtl: {type: 'delta', value: 500},
    queryTtl: {type: 'delta', value: 10},
    responseTtl: {type: 'delta', value: 10}
  } } }
})

export default Oracle
