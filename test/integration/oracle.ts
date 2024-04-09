import { describe, it, before } from 'mocha';
import { expect } from 'chai';
import { RestError } from '@azure/core-rest-pipeline';
import { getSdk, networkId } from '.';
import {
  AeSdk, UnexpectedTsError, decode, encode, Encoding, Encoded, registerOracle, ORACLE_TTL_TYPES,
} from '../../src';

describe('Oracle', () => {
  let aeSdk: AeSdk;
  let oracle: Awaited<ReturnType<typeof registerOracle>>;
  const queryResponse = '{"tmp": 30}';

  before(async () => {
    aeSdk = await getSdk(2);
  });

  it('Register Oracle with 5000 TTL', async () => {
    const expectedOracleId = encode(decode(aeSdk.address), Encoding.OracleAddress);
    const height = await aeSdk.getHeight();
    oracle = await aeSdk.registerOracle(
      '{"city": "str"}',
      '{"tmp": "num"}',
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

  it('Post Oracle Query', async () => {
    const query = await oracle.postQuery('{"city": "Berlin"}');
    query.decodedQuery.should.be.equal('{"city": "Berlin"}');
  });

  it('Pool for queries', (done) => {
    let count = 0;
    const stopPolling = oracle.pollQueries(() => {
      count += 1;
      expect(count).to.be.lessThanOrEqual(4);
      if (count !== 4) return;
      stopPolling();
      done();
    });
    oracle.postQuery('{"city": "Berlin2"}')
      .then(() => oracle.postQuery('{"city": "Berlin3"}'))
      .then(() => oracle.postQuery('{"city": "Berlin4"}'));
  });

  const timeout = networkId === 'ae_dev' ? 8000 : 700000;
  it('Poll for response for query without response', async () => {
    const query = await oracle.postQuery('{"city": "Berlin"}', { queryTtlValue: 1 });
    await query.pollForResponse()
      .should.be.rejectedWith(/Giving up at height|error: Query not found/);
  }).timeout(timeout);

  it('Poll for response for query that is already expired without response', async () => {
    const query = await oracle.postQuery('{"city": "Berlin"}', { queryTtlValue: 1 });
    await aeSdk.awaitHeight(await aeSdk.getHeight() + 2);
    await query.pollForResponse().should.be.rejectedWith(RestError, 'Query not found');
  }).timeout(timeout);

  it('Respond to query', async () => {
    let query = await oracle.postQuery('{"city": "Berlin"}');
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
      oracleWithFee = await aeSdk.registerOracle('{"city": "str"}', '{"tmp": "num"}', { queryFee: queryFee.toString() });
    });

    it('Post Oracle Query without query fee', async () => {
      const query = await oracle.postQuery('{"city": "Berlin"}');
      if (query.tx?.queryFee == null) throw new UnexpectedTsError();
      query.tx.queryFee.should.be.equal(0n);
    });

    it('Post Oracle Query with registered query fee', async () => {
      const query = await oracleWithFee.postQuery('{"city": "Berlin"}');
      if (query.tx?.queryFee == null) throw new UnexpectedTsError();
      query.tx.queryFee.should.be.equal(queryFee);
    });

    it('Post Oracle Query with custom query fee', async () => {
      const query = await oracleWithFee.postQuery('{"city": "Berlin"}', { queryFee: queryFee + 2000n });
      if (query.tx?.queryFee == null) throw new UnexpectedTsError();
      query.tx.queryFee.should.be.equal(queryFee + 2000n);
    });
  });
});
