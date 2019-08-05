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
 * OracleNodeAPI module
 *
 * This is the complement to {@link module:@aeternity/aepp-sdk/es/oracle}.
 * @module @aeternity/aepp-sdk/es/oracle/node
 * @export OracleNodeAPI
 * @example import OracleNodeAPI from '@aeternity/aepp-sdk/es/oracle/node'
 */

import OracleBase from './'

async function getOracle (oracleId) {
  return this.api.getOracleByPubkey(oracleId)
}

async function getOracleQueries (oracleId) {
  return this.api.getOracleQueriesByPubkey(oracleId)
}

async function getOracleQuery (oracleId, queryId) {
  return this.api.getOracleQueryByPubkeyAndQueryId(oracleId, queryId)
}

const OracleNodeAPI = OracleBase.compose({
  methods: {
    getOracle,
    getOracleQueries,
    getOracleQuery
  }
})

export default OracleNodeAPI
