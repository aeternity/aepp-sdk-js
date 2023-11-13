import { describe, it, before } from 'mocha';
import { expect } from 'chai';
import { RestError } from '@azure/core-rest-pipeline';
import { getSdk, networkId } from '.';
import {
  AeSdk, decode, encode, Encoding, Encoded, registerOracle, ORACLE_TTL_TYPES, OracleClient,
} from '../../src';
import { assertNotNull } from '../utils';

describe('Oracle', () => {
  let aeSdk: AeSdk;
  let oracle: Awaited<ReturnType<typeof registerOracle>>;
  let oracleClient: OracleClient;
  const queryResponse = '{"tmp": 30}';

  before(async () => {
    aeSdk = await getSdk(3);
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
    oracleClient = new OracleClient(oracle.id, {
      ...aeSdk.getContext(),
      onAccount: aeSdk.accounts[aeSdk.addresses()[1]],
    });
  });

  it('Extend Oracle', async () => {
    const extendedOracle = await oracle.extendOracle(
      { oracleTtlType: ORACLE_TTL_TYPES.delta, oracleTtlValue: 7450 },
    );
    expect(extendedOracle.ttl).to.be.equal(oracle.ttl + 7450);
  });

  it('Pool for queries', (done) => {
    let count = 0;
    const stopPolling = oracle.pollQueries(() => {
      count += 1;
      expect(count).to.be.lessThanOrEqual(3);
      if (count !== 3) return;
      stopPolling();
      done();
    });
    oracleClient.postQuery('{"city": "Berlin2"}')
      .then(async () => oracleClient.postQuery('{"city": "Berlin3"}'))
      .then(async () => oracleClient.postQuery('{"city": "Berlin4"}'));
  });

  it('Respond to query', async () => {
    const { queryId } = await oracleClient.postQuery('{"city": "Berlin"}');
    oracle = await aeSdk.respondToQuery(queryId, queryResponse);
    const query = await oracleClient.getQuery(queryId);

    expect(query.decodedResponse).to.be.equal(queryResponse);
    expect(decode(query.response as Encoded.OracleResponse).toString()).to.be.equal(queryResponse);

    const response = await oracleClient.pollForResponse(queryId);
    response.should.be.equal(queryResponse);
  });

  describe('OracleClient', () => {
    it('posts query', async () => {
      const query = await oracleClient.postQuery('{"city": "Berlin"}');
      assertNotNull(query.tx?.query);
      expect(query.tx.query).to.be.equal('{"city": "Berlin"}');
    });

    const timeout = networkId === 'ae_dev' ? 8000 : 700000;
    it('polls for response for query without response', async () => {
      const { queryId } = await oracleClient.postQuery('{"city": "Berlin"}', { queryTtlValue: 1 });
      await oracleClient.pollForResponse(queryId)
        .should.be.rejectedWith(/Giving up at height|error: Query not found/);
    }).timeout(timeout);

    it('polls for response for query that is already expired without response', async () => {
      const { queryId } = await oracleClient.postQuery('{"city": "Berlin"}', { queryTtlValue: 1 });
      await aeSdk.awaitHeight(await aeSdk.getHeight() + 2);
      await oracleClient.pollForResponse(queryId)
        .should.be.rejectedWith(RestError, 'Query not found');
    }).timeout(timeout);

    it('queries oracle', async () => {
      const stopPolling = oracle.pollQueries((query) => {
        oracle.respondToQuery(query.id, queryResponse);
      });
      const response = await oracleClient.query('{"city": "Berlin"}');
      stopPolling();
      expect(response).to.be.equal(queryResponse);
    });
  });

  describe('Oracle query fee settings', () => {
    let oracleWithFee: Awaited<ReturnType<typeof registerOracle>>;
    let oracleWithFeeClient: OracleClient;
    const queryFee = 24000n;

    before(async () => {
      await aeSdk.selectAccount(aeSdk.addresses()[2]);
      oracleWithFee = await aeSdk
        .registerOracle('{"city": "str"}', '{"tmp": "num"}', { queryFee: queryFee.toString() });
      oracleWithFeeClient = new OracleClient(oracleWithFee.id, aeSdk.getContext());
    });

    it('Post Oracle Query without query fee', async () => {
      const query = await oracleClient.postQuery('{"city": "Berlin"}');
      assertNotNull(query.tx?.queryFee);
      expect(query.tx.queryFee).to.be.equal(0n);
    });

    it('Post Oracle Query with registered query fee', async () => {
      const query = await oracleWithFeeClient.postQuery('{"city": "Berlin"}');
      assertNotNull(query.tx?.queryFee);
      expect(query.tx.queryFee).to.be.equal(queryFee);
    });

    it('Post Oracle Query with custom query fee', async () => {
      const query = await oracleWithFeeClient
        .postQuery('{"city": "Berlin"}', { queryFee: (queryFee + 2000n).toString() });
      assertNotNull(query.tx?.queryFee);
      expect(query.tx.queryFee).to.be.equal(queryFee + 2000n);
    });
  });
});
