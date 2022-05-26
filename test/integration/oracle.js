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
import { expect } from 'chai'
import { getSdk } from './'
import { generateKeyPair } from '../../src/utils/crypto'
import MemoryAccount from '../../src/account/memory'
import { QUERY_FEE } from '../../src/tx/builder/schema'
import { decode } from '../../src/tx/builder/helpers'

describe('Oracle', function () {
  let aeSdk
  let oracle
  let query
  const queryResponse = "{'tmp': 30}"
  const account = generateKeyPair()

  before(async function () {
    aeSdk = await getSdk()
    await aeSdk.spend(1e20, account.publicKey)
    aeSdk.addAccount(MemoryAccount({ keypair: account }), { select: true })
  })

  it('Register Oracle with 5000 TTL', async () => {
    const expectedOracleId = `ok_${(await aeSdk.address()).slice(3)}`
    oracle = await aeSdk.registerOracle(
      "{'city': str}", "{'tmp': num}", { oracleTtl: { type: 'delta', value: 5000 } }
    )
    oracle.id.should.be.equal(expectedOracleId)
  })

  it('Extend Oracle', async () => {
    const extendedOracle = await oracle.extendOracle({ type: 'delta', value: 7450 })
    expect(extendedOracle.ttl).to.be.greaterThan(oracle.ttl)
  })

  it('Post Oracle Query(Ask for weather in Berlin)', async () => {
    query = await oracle.postQuery("{'city': 'Berlin'}")
    query.decodedQuery.should.be.equal("{'city': 'Berlin'}")
  })

  it('Pool for queries', (done) => {
    let count = 0
    const stopPolling = oracle.pollQueries((queries) => {
      count += queries.length
      expect(count).to.be.lessThanOrEqual(4)
      if (count !== 4) return
      stopPolling()
      done()
    })
    oracle.postQuery("{'city': 'Berlin2'}")
      .then(() => oracle.postQuery("{'city': 'Berlin3'}"))
      .then(() => oracle.postQuery("{'city': 'Berlin4'}"))
  })

  it('Poll for response for query without response', async () => {
    await query.pollForResponse().should.be.rejectedWith(Error)
  })

  it('Respond to query', async () => {
    oracle = await query.respond(queryResponse)
    query = await oracle.getQuery(query.id)

    expect(query.decodedResponse).to.be.equal(queryResponse)
    expect(decode(query.response, 'or').toString()).to.be.equal(queryResponse)
  })

  it('Poll for response', async () => {
    const response = await query.pollForResponse()
    response.should.be.equal(queryResponse)
  })

  describe('Oracle query fee settings', async () => {
    let oracleWithFee
    const queryFee = 24000
    const account = generateKeyPair()

    before(async function () {
      await aeSdk.spend(1e15, account.publicKey)
      aeSdk.addAccount(MemoryAccount({ keypair: account }), { select: true })
      oracleWithFee = await aeSdk.registerOracle("{'city': str}", "{'tmp': num}", { queryFee, onAccount: account })
    })

    it('Post Oracle Query with default query fee', async () => {
      query = await oracle.postQuery("{'city': 'Berlin'}")
      query.tx.queryFee.should.be.equal(QUERY_FEE)
    })

    it('Post Oracle Query with registered query fee', async () => {
      query = await oracleWithFee.postQuery("{'city': 'Berlin'}")
      query.tx.queryFee.should.be.equal(queryFee)
    })

    it('Post Oracle Query with custom query fee', async () => {
      query = await oracleWithFee.postQuery("{'city': 'Berlin'}", { queryFee: queryFee + 2000 })
      query.tx.queryFee.should.be.equal(queryFee + 2000)
    })
  })
})
