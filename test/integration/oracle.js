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
import { getSdk } from './'
import { encodeBase64Check, generateKeyPair } from '../../src/utils/crypto'
import MemoryAccount from '../../src/account/memory'
import { QUERY_FEE } from '../../src/tx/builder/schema'

describe('Oracle', function () {
  let sdk
  let oracle
  let query
  const queryResponse = "{'tmp': 30}"
  const account = generateKeyPair()

  before(async function () {
    sdk = await getSdk()
    await sdk.spend('1' + '0'.repeat(20), account.publicKey)
    sdk.addAccount(MemoryAccount({ keypair: account }), { select: true })
  })

  it('Register Oracle with 5000 TTL', async () => {
    const expectedOracleId = `ok_${(await sdk.address()).slice(3)}`
    oracle = await sdk.registerOracle("{'city': str}", "{'tmp': num}", { oracleTtl: { type: 'delta', value: 5000 } })
    oracle.id.should.be.equal(expectedOracleId)
  })

  it('Extend Oracle', async () => {
    const ttlToExtend = { type: 'delta', value: 7450 }
    const extendedOracle = await oracle.extendOracle(ttlToExtend)
    const isExtended = extendedOracle.ttl > oracle.ttl
    isExtended.should.be.equal(true)
  })

  it('Post Oracle Query(Ask for weather in Berlin)', async () => {
    query = await oracle.postQuery("{'city': 'Berlin'}")
    query.decode(query.query).toString().should.be.equal("{'city': 'Berlin'}")
  })

  it('Pool for queries', (done) => {
    let count = 0
    const stopPolling = oracle.pollQueries((queries) => {
      count += queries.length
      if (count !== 4) return
      stopPolling()
      done()
    }, { interval: 100 })
    oracle.postQuery("{'city': 'Berlin2'}")
      .then(() => oracle.postQuery("{'city': 'Berlin3'}"))
      .then(() => oracle.postQuery("{'city': 'Berlin4'}"))
  }).timeout(10000)

  it('Poll for response for query without response', async () => {
    return query.pollForResponse({ attempts: 2, interval: 1000 }).should.be.rejectedWith(Error)
  })

  it('Respond to query', async () => {
    oracle = await query.respond(queryResponse)
    query = await oracle.getQuery(query.id)
    const decodeResponse = await query.decode(query.response).toString()

    decodeResponse.should.be.equal(queryResponse)
    query.response.slice(3).should.be.equal(encodeBase64Check(queryResponse))
  })

  it('Poll for response', async () => {
    const response = await query.pollForResponse({ attempts: 2, interval: 1000 })
    response.should.be.equal(queryResponse)
  })

  describe('Oracle query fee settings', async () => {
    let oracleWithFee
    const queryFee = 24000
    const account = generateKeyPair()

    before(async function () {
      await sdk.spend(1e15, account.publicKey)
      sdk.addAccount(MemoryAccount({ keypair: account }), { select: true })
      oracleWithFee = await sdk.registerOracle("{'city': str}", "{'tmp': num}", { queryFee, onAccount: account })
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
