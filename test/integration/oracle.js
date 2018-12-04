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

import { describe, it, before } from 'mocha'
import { configure, plan, ready } from './'
import { encodeBase64Check } from '../../es/utils/crypto'


plan(100000000000)

describe('Oracle', function () {
  configure(this)
  let client;
  let oracle;
  let queryResponse = "{'tmp': 30}";

  before(async function () {
    client = await ready(this)
  })

  it('Register Oracle', async () => {
    const expectedOracleId = `ok_${(await client.address()).slice(3)}`
    oracle = await client.registerOracle("{'city': str}", "{'tmp': num}")
    oracle.id.should.be.equal(expectedOracleId)
  })

  it('Extend Oracle', async () => {
    const ttlToExtend = { type: 'delta', value: 123 }
    const extendedOracle = await oracle.extendOracle({ type: 'delta', value: 123 }, "{'city': 'Berlin'}")
    extendedOracle.ttl.should.be.equal(oracle.ttl + ttlToExtend.value)
  })

  it('Post Oracle Query(Ask for weather in Berlin)', async () => {
    oracle = await client.postQueryToOracle(oracle.id, "{'city': 'Berlin'}")
    const queriesLength = oracle.queries.length
    queriesLength.should.be.equal(1)
  })

  it('Respond to query', async () => {
    const queryId = oracle.queries[0].id
    oracle = await client.respondToQuery(oracle.id, queryId, queryResponse)
    const query = oracle.getQuery(queryId)
    const decodeResponse = await query.decode().toString()

    decodeResponse.should.be.equal(queryResponse)
    query.response.slice(3).should.be.equal(encodeBase64Check(queryResponse))
  })
})
