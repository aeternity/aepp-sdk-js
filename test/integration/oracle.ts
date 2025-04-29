import { describe, it, before } from 'mocha';
import { expect } from 'chai';
import { RestError } from '@azure/core-rest-pipeline';
import { getSdk, timeoutBlock } from '.';
import {
  AeSdk,
  decode,
  encode,
  Encoding,
  ORACLE_TTL_TYPES,
  Oracle,
  OracleClient,
  LogicError,
} from '../../src';
import { assertNotNull } from '../utils';
import { pause } from '../../src/utils/other';

describe('Oracle', () => {
  let aeSdk: AeSdk;
  let oracle: Oracle;
  let oracleClient: OracleClient;
  const queryResponse = '{"tmp": 30}';

  before(async () => {
    aeSdk = await getSdk(3);
    const expectedOracleId = encode(decode(aeSdk.address), Encoding.OracleAddress);
    oracle = new Oracle(aeSdk.accounts[aeSdk.address], aeSdk.getContext());
    expect(oracle.address).to.equal(expectedOracleId);
    oracleClient = new OracleClient(oracle.address, {
      ...aeSdk.getContext(),
      onAccount: aeSdk.accounts[aeSdk.addresses()[1]],
    });
    expect(oracleClient.address).to.equal(expectedOracleId);
  });

  describe('Oracle', () => {
    it('registers with 5000 TTL', async () => {
      const height = await aeSdk.getHeight();
      await oracle.register('{"city": "str"}', '{"tmp": "num"}', {
        oracleTtlType: ORACLE_TTL_TYPES.delta,
        oracleTtlValue: 5000,
      });
      const oracleState = await oracle.getState();
      const ttl = height + 5000;
      expect(oracleState.ttl).to.be.within(ttl, ttl + 4);
      expect(oracleState.id).to.equal(oracle.address);
    });

    it('extends TTL', async () => {
      const { ttl: ttlBefore } = await oracle.getState();
      await oracle.extendTtl({ oracleTtlType: ORACLE_TTL_TYPES.delta, oracleTtlValue: 7450 });
      const { ttl } = await oracle.getState();
      expect(ttl).to.equal(ttlBefore + 7450);
    });

    async function pollNQueries(
      orc: Oracle,
      count: number,
      includeResponded: boolean = false,
    ): Promise<string[]> {
      const res: string[] = [];
      return new Promise((resolve) => {
        const stopPolling = orc.pollQueries(
          (query) => {
            res.push(query.decodedQuery);
            if (res.length !== count) return;
            stopPolling();
            resolve(res);
          },
          { includeResponded },
        );
      });
    }

    const queries = [2, 3, 4].map((i) => `{"city": "Berlin${i}"}`);

    it('polls for queries', async () => {
      const pollPromise = pollNQueries(oracle, 3);
      for (const q of queries) {
        // eslint-disable-line no-restricted-syntax
        await oracleClient.postQuery(q);
      }
      expect(await pollPromise).to.eql(queries);
    });

    let query4: Awaited<ReturnType<OracleClient['getQuery']>>;
    it('gets queries', async () => {
      const res = await oracle.getQueries();
      expect(res).to.have.length(3);
      query4 = res.find((q) => q.decodedQuery.includes('Berlin4'))!;
      assertNotNull(query4);
      expect(query4).to.eql({
        id: query4.id,
        senderId: oracleClient.options.onAccount.address,
        senderNonce: 3,
        oracleId: oracle.address,
        query: 'ov_eyJjaXR5IjogIkJlcmxpbjQifR/koho=',
        response: 'or_Xfbg4g==',
        ttl: query4.ttl,
        responseTtl: { type: 'delta', value: 10 },
        fee: 0n,
        decodedQuery: '{"city": "Berlin4"}',
        decodedResponse: '',
      });
    });

    it('gets query', async () => {
      expect(await oracle.getQuery(query4.id)).to.eql(query4);
      const { decodedQuery, decodedResponse, ...q } = query4;
      expect(q).to.eql(await aeSdk.api.getOracleQueryByPubkeyAndQueryId(oracle.address, query4.id));
    });

    it('can poll for responded queries', async () => {
      const { queryId } = await oracleClient.postQuery('{"city": "Berlin"}');
      await oracle.respondToQuery(queryId, queryResponse);
      expect(await pollNQueries(oracle, 3)).to.have.same.members(queries);
      expect(await pollNQueries(oracle, 4, true)).to.have.same.members([
        ...queries,
        '{"city": "Berlin"}',
      ]);
    });

    it('responds to query', async () => {
      const { queryId } = await oracleClient.postQuery('{"city": "Berlin"}');
      await oracle.respondToQuery(queryId, queryResponse);

      const query = await oracle.getQuery(queryId);
      expect(query.decodedResponse).to.equal(queryResponse);
      const response = await oracleClient.pollForResponse(queryId);
      expect(response).to.equal(queryResponse);
    });

    it('handles query', async () => {
      const stop = oracle.handleQueries((queryEntry) =>
        JSON.stringify({ ...JSON.parse(queryEntry.decodedQuery), response: true }),
      );
      const response = await oracleClient.query('{"test": 42}');
      expect(response).to.equal('{"test":42,"response":true}');
      await stop();
    });

    it('fails to bind two query handles', async () => {
      const stop = oracle.handleQueries(() => 'handle 1');
      try {
        expect(() => oracle.handleQueries(() => 'handle 2')).to.throw(
          LogicError,
          'Another query handler already running, it needs to be stopped to run a new one',
        );
      } finally {
        await stop();
      }
    });

    async function postQueries(qs: string[]): Promise<Array<Promise<string>>> {
      const res: Array<Promise<string>> = [];
      for (const query of qs) {
        // eslint-disable-line no-restricted-syntax
        const { queryId } = await oracleClient.postQuery(query);
        res.push(oracleClient.pollForResponse(queryId));
      }
      return res;
    }

    it('responds to queries already created', async () => {
      const responsePromises = await postQueries(['foo', 'bar']);
      const stop = oracle.handleQueries(({ decodedQuery }) => `response to ${decodedQuery}`);
      try {
        const res = await Promise.all(responsePromises);
        expect(res).to.eql(['response to foo', 'response to bar']);
      } finally {
        await stop();
      }
    });

    it('responds to queries in different order', async () => {
      const responsePromises = await postQueries(['500', '250', '400']);
      const stop = oracle.handleQueries(async ({ decodedQuery }) => {
        await pause(+decodedQuery);
        return decodedQuery;
      });
      const res: string[] = [];
      try {
        await Promise.all(
          responsePromises.map(async (promise) => promise.then((r) => res.push(r))),
        );
        expect(res).to.eql(['250', '400', '500']);
      } finally {
        await stop();
      }
    });
  });

  describe('OracleClient', () => {
    it('posts query', async () => {
      const query = await oracleClient.postQuery('{"city": "Berlin"}');
      assertNotNull(query.tx?.query);
      expect(query.tx.query).to.equal('{"city": "Berlin"}');
    });

    it('polls for response for query without response', async () => {
      const { queryId } = await oracleClient.postQuery('{"city": "Berlin"}', { queryTtlValue: 1 });
      await expect(oracleClient.pollForResponse(queryId)).to.be.rejectedWith(
        /Giving up at height|error: Query not found/,
      );
    }).timeout(timeoutBlock);

    it('polls for response for query that is already expired without response', async () => {
      const { queryId } = await oracleClient.postQuery('{"city": "Berlin"}', { queryTtlValue: 1 });
      await aeSdk.awaitHeight((await aeSdk.getHeight()) + 2);
      await expect(oracleClient.pollForResponse(queryId)).to.be.rejectedWith(
        RestError,
        'Query not found',
      );
    }).timeout(timeoutBlock * 2);

    it('queries oracle', async () => {
      const stopPolling = oracle.pollQueries((query) => {
        oracle.respondToQuery(query.id, queryResponse);
      });
      const response = await oracleClient.query('{"city": "Berlin"}');
      stopPolling();
      expect(response).to.equal(queryResponse);
    });
  });

  describe('Oracle query fee settings', () => {
    let oracleWithFee: Oracle;
    let oracleWithFeeClient: OracleClient;
    const queryFee = 24000n;

    before(async () => {
      oracleWithFee = new Oracle(aeSdk.accounts[aeSdk.addresses()[2]], aeSdk.getContext());
      await oracleWithFee.register('{"city": "str"}', '{"tmp": "num"}', {
        queryFee: queryFee.toString(),
      });
      oracleWithFeeClient = new OracleClient(oracleWithFee.address, aeSdk.getContext());
    });

    it('Post Oracle Query without query fee', async () => {
      const query = await oracleClient.postQuery('{"city": "Berlin"}');
      assertNotNull(query.tx?.queryFee);
      expect(query.tx.queryFee).to.equal(0n);
    });

    it('Post Oracle Query with registered query fee', async () => {
      const query = await oracleWithFeeClient.postQuery('{"city": "Berlin"}');
      assertNotNull(query.tx?.queryFee);
      expect(query.tx.queryFee).to.equal(queryFee);
    });

    it('Post Oracle Query with custom query fee', async () => {
      const query = await oracleWithFeeClient.postQuery('{"city": "Berlin"}', {
        queryFee: (queryFee + 2000n).toString(),
      });
      assertNotNull(query.tx?.queryFee);
      expect(query.tx.queryFee).to.equal(queryFee + 2000n);
    });
  });
});
