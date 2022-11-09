/*
 * ISC License (ISC)
 * Copyright (c) 2022 aeternity developers
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

import { describe, it, before } from 'mocha';
import { expect } from 'chai';
import { RestError } from '@azure/core-rest-pipeline';
import { getSdk } from '.';
import {
  AeSdk, UnexpectedTsError,
  decode, encode, registerOracle,
  ORACLE_TTL_TYPES, QUERY_FEE, Encoding, RequestTimedOutError,
} from '../../src';
import { Encoded } from '../../src/utils/encoder';

describe('Oracle', () => {
  let aeSdk: AeSdk;
  let oracle: Awaited<ReturnType<typeof registerOracle>>;
  const queryResponse = "{'tmp': 30}";

  before(async () => {
    aeSdk = await getSdk(2);
  });

  it('Register Oracle with 5000 TTL', async () => {
    const expectedOracleId = encode(decode(aeSdk.address), Encoding.OracleAddress);
    const height = await aeSdk.getHeight();
    oracle = await aeSdk.registerOracle(
      "{'city': str}",
      "{'tmp': num}",
      { oracleTtlType: ORACLE_TTL_TYPES.delta, oracleTtlValue: 5000 },
    );
    const ttl = height + 5000;
    expect(oracle.ttl).to.be.within(ttl, ttl + 4);
    oracle.id.should.be.equal(expectedOracleId);
  });

  it('Extend Oracle', async () => {
    const extendedOracle = await oracle.extendOracle(
      { oracleTtlType: ORACLE_TTL_TYPES.delta, oracleTtlValue: 7450 },
    );
    expect(extendedOracle.ttl).to.be.equal(oracle.ttl + 7450);
  });

  it('Post Oracle Query(Ask for weather in Berlin)', async () => {
    const query = await oracle.postQuery("{'city': 'Berlin'}");
    query.decodedQuery.should.be.equal("{'city': 'Berlin'}");
  });

  it('Pool for queries', (done) => {
    let count = 0;
    const stopPolling = oracle.pollQueries((queries) => {
      count += queries.length;
      expect(count).to.be.lessThanOrEqual(4);
      if (count !== 4) return;
      stopPolling();
      done();
    });
    oracle.postQuery("{'city': 'Berlin2'}")
      .then(() => oracle.postQuery("{'city': 'Berlin3'}"))
      .then(() => oracle.postQuery("{'city': 'Berlin4'}"));
  });

  it('Poll for response for query without response', async () => {
    const query = await oracle.postQuery("{'city': 'Berlin'}", { queryTtlValue: 2 });
    await query.pollForResponse().should.be.rejectedWith(RequestTimedOutError);
  });

  it('Poll for response for query that is already expired without response', async () => {
    const query = await oracle.postQuery("{'city': 'Berlin'}", { queryTtlValue: 2 });
    await aeSdk.awaitHeight(await aeSdk.getHeight() + 3);
    await query.pollForResponse().should.be.rejectedWith(RestError, 'Query not found');
  });

  it('Respond to query', async () => {
    let query = await oracle.postQuery("{'city': 'Berlin'}");
    oracle = await query.respond(queryResponse);
    query = await oracle.getQuery(query.id);

    expect(query.decodedResponse).to.be.equal(queryResponse);
    expect(decode(query.response as Encoded.OracleResponse).toString()).to.be.equal(queryResponse);

    const response = await query.pollForResponse();
    response.should.be.equal(queryResponse);
  });

  describe('Oracle query fee settings', () => {
    let oracleWithFee: Awaited<ReturnType<typeof registerOracle>>;
    const queryFee = 24000n;

    before(async () => {
      await aeSdk.selectAccount(aeSdk.addresses()[1]);
      oracleWithFee = await aeSdk.registerOracle("{'city': str}", "{'tmp': num}", { queryFee: queryFee.toString() });
    });

    it('Post Oracle Query with default query fee', async () => {
      const query = await oracle.postQuery("{'city': 'Berlin'}");
      if (query.tx?.queryFee == null) throw new UnexpectedTsError();
      query.tx.queryFee.should.be.equal(BigInt(QUERY_FEE));
    });

    it('Post Oracle Query with registered query fee', async () => {
      const query = await oracleWithFee.postQuery("{'city': 'Berlin'}");
      if (query.tx?.queryFee == null) throw new UnexpectedTsError();
      query.tx.queryFee.should.be.equal(queryFee);
    });

    it('Post Oracle Query with custom query fee', async () => {
      const query = await oracleWithFee.postQuery("{'city': 'Berlin'}", { queryFee: queryFee + 2000n });
      if (query.tx?.queryFee == null) throw new UnexpectedTsError();
      query.tx.queryFee.should.be.equal(queryFee + 2000n);
    });
  });
});
