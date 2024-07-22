import { describe, before, it } from 'mocha';
import { expect } from 'chai';
import resetMiddleware, { presetAccountAddress } from './reset-middleware';
import { Middleware } from '../../src';
import { assertNotNull } from '../utils';

describe('Middleware API', () => {
  const middleware = new Middleware('http://localhost:4000');

  before(async () => {
    await resetMiddleware();
  });

  it('gets status', async () => {
    const res = await middleware.getStatus();
    const expectedRes: typeof res = {
      mdwAsyncTasks: {
        longTasks: 0,
        producerBuffer: 0,
        totalPending: res.mdwAsyncTasks.totalPending,
      },
      mdwGensPerMinute: res.mdwGensPerMinute,
      mdwHeight: res.mdwHeight,
      mdwLastMigration: 20240702122227,
      mdwRevision: '6252c01f',
      mdwSynced: true,
      mdwSyncing: true,
      mdwTxIndex: res.mdwTxIndex,
      mdwVersion: '1.81.0',
      nodeHeight: res.nodeHeight,
      nodeProgress: 100,
      nodeRevision: 'b394868693b70a3a7ce5dfec144f718f60e79964',
      nodeSyncing: false,
      nodeVersion: '7.1.0',
    };
    expect(res).to.be.eql(expectedRes);
  });

  it('gets account activities', async () => {
    const res = await middleware.getAccountActivities(presetAccountAddress);
    const expectedRes: typeof res = {
      data: [{
        blockHash: 'mh_28wMvNExkFqRSGc2KchZzQWr9QrNiHCFD3sBeMNCM5shK9iqXw',
        blockTime: 1721213472190,
        height: 3,
        payload: {
          kind: 'fee_lock_name',
          amount: 3,
          refTxHash: 'th_Wt9hi3oaWpr5mfR2zJHPJg7bAWkYbPwajoS361NVVHmeQ3Wmx',
        },
        type: 'InternalTransferEvent',
      }, {
        blockHash: 'mh_28wMvNExkFqRSGc2KchZzQWr9QrNiHCFD3sBeMNCM5shK9iqXw',
        blockTime: 1721213472190,
        height: 3,
        payload: {
          blockHash: 'mh_28wMvNExkFqRSGc2KchZzQWr9QrNiHCFD3sBeMNCM5shK9iqXw',
          blockHeight: 3,
          encoded_tx: 'tx_+KULAfhCuEDWbZq1WeArvSAaNYZWvXvTwRPiiakFeSJ1XGavpe/A47SNYu6wKSdeChh3IZtTMJIblgbluqE0eCrW0tXfv+4GuF34WyACoQGlDe8oTWOIBGKIUgMgu3jBZWwwfAJEB/vhPQUWEAbEqgKkOWJLazQxMHJ0NFpFblBablh5RkoyS292c0lBenptLmNoYWluAIcBxr9SY0AAhg9Vhk+YAAZA2OYv',
          hash: 'th_Wt9hi3oaWpr5mfR2zJHPJg7bAWkYbPwajoS361NVVHmeQ3Wmx',
          microIndex: 0,
          microTime: 1721213472190,
          signatures: [
            'sg_V46KfD6DhcDXP3FKnXY3YUps67zWxjrQphen95VFwj9GiMdDAnVuMdgumF2v8Gu3xTMJJB9n56yr5JQrcpW2d7oFfh9Ua',
          ],
          tx: {
            account_id: 'ak_2Fh6StA76AKdy8qsGdkEfkQyVmAYc2XE1irWRnDgXKhmBLKoXg',
            fee: 16860000000000,
            name: '9bKk410rt4ZEnPZnXyFJ2KovsIAzzm.chain',
            name_fee: 500000000000000,
            name_id: 'nm_27MpcZebrNCLB8AWaJBjp6TrzdjwMWKDJQDBnTWb82E2sut7P7',
            name_salt: 0,
            nonce: 2,
            ttl: 6,
            type: 'NameClaimTx',
            version: 2,
          },
        },
        type: 'NameClaimTxEvent',
      }, {
        blockHash: 'mh_Regp5RaGeK2mxpQmifSgbrF4DwXiQNkkt8VjFnkNB4NK5v3St',
        blockTime: 1721213472106,
        height: 2,
        payload: {
          blockHash: 'mh_Regp5RaGeK2mxpQmifSgbrF4DwXiQNkkt8VjFnkNB4NK5v3St',
          blockHeight: 2,
          encoded_tx: 'tx_+PcLAfhCuEB+Tq5sUOIMedGLODH48nG1b7KNt4Dre9vyXC3eH2EjFe2EkVGpx4QN/eQU2OLHXJgg1/7uFO5S3pMlI+jqv78FuK/4rSoBoQGlDe8oTWOIBGKIUgMgu3jBZWwwfAJEB/vhPQUWEAbEqgG4avhoRgOg2qvS0QZEjddEG/XeWW7yVgfv7YPK4+Tsp1rY/AENke3AuDue/kTWRB8ANwA3ABoOgj8BAz/+gHggkgA3AQcHAQEAmC8CEUTWRB8RaW5pdBGAeCCSGWdldEFyZ4IvAIU4LjAuMACDCAADhkdlNJ1oAAUAAEyEO5rKAIcrEUTWRB8/Bmn2yg==',
          hash: 'th_2JMR7C1DjrGeZWyyLMkccRLga1Lct8Syy9hcZKD9PEZkN5JvSD',
          microIndex: 0,
          microTime: 1721213472106,
          signatures: [
            'sg_HXRkFjgjsFmFLZ1ywBgYj9VouQK1BySqCViALxq3ge69a86aDgd1ESqNXhCLebh7fH6SohTjbLXXxhjPnYXaGJfiX7DQV',
          ],
          tx: {
            abi_version: 3,
            aexn_type: null,
            amount: 0,
            args: [],
            call_data: 'cb_KxFE1kQfP4oEp9E=',
            caller_id: 'ak_2Fh6StA76AKdy8qsGdkEfkQyVmAYc2XE1irWRnDgXKhmBLKoXg',
            code: 'cb_+GhGA6Daq9LRBkSN10Qb9d5ZbvJWB+/tg8rj5OynWtj8AQ2R7cC4O57+RNZEHwA3ADcAGg6CPwEDP/6AeCCSADcBBwcBAQCYLwIRRNZEHxFpbml0EYB4IJIZZ2V0QXJngi8AhTguMC4wAHQkH9o=',
            compiler_version: '8.0.0',
            contract_id: 'ct_2JgVFKjJYUyJDnpJPhspX8C6RS6rFS46r3C1sy15tW9dDmPX2E',
            deposit: 0,
            fee: 78500000000000,
            gas: 76,
            gas_price: 1000000000,
            gas_used: 61,
            log: [],
            nonce: 1,
            owner_id: 'ak_2Fh6StA76AKdy8qsGdkEfkQyVmAYc2XE1irWRnDgXKhmBLKoXg',
            return_type: 'ok',
            return_value: 'cb_Xfbg4g==',
            source_hash: '2qvS0QZEjddEG/XeWW7yVgfv7YPK4+Tsp1rY/AENke0=',
            ttl: 5,
            type: 'ContractCreateTx',
            version: 1,
            vm_version: 8,
          },
        },
        type: 'ContractCreateTxEvent',
      }, {
        blockHash: 'mh_2Wcpmr8PBEjj7qc78Y1dusvAKsQNuYhgoQNPsx3XdHtphvw8mT',
        blockTime: 1721213471890,
        height: 1,
        payload: {
          blockHash: 'mh_2Wcpmr8PBEjj7qc78Y1dusvAKsQNuYhgoQNPsx3XdHtphvw8mT',
          blockHeight: 1,
          encoded_tx: 'tx_+KMLAfhCuEDgjc7zMPb+xRW+pI0L5OqwjI+OBF0ee1zgmlkXsavoYXHZw7vTx6vxaAZxxs4ts/eZhAmqVGg3EmTsRAtccKMDuFv4WQwBoQGEDJdLlxZHdkVLoRnYTtxNYFio3skrbtxXirLTC0xCAKEBpQ3vKE1jiARiiFIDILt4wWVsMHwCRAf74T0FFhAGxKqIDeC2s6dkAACGD0w2IAgABAGAJs2FDw==',
          hash: 'th_U26TdBBNT56HFXWAb4ktFyWBTuCAnwdajecTL4ss2BhciRviG',
          microIndex: 0,
          microTime: 1721213471890,
          signatures: [
            'sg_WNvkq9RewEjZDrDLqXMUoyBd8pGzqAuyaDfG3bQAfGx4tF6smTLyYnFWmtY8SrJRnEHbriDUm836DSJSkMjiijLKBsSzo',
          ],
          tx: {
            amount: 1000000000000000000,
            fee: 16820000000000,
            nonce: 1,
            payload: 'ba_Xfbg4g==',
            recipient_id: 'ak_2Fh6StA76AKdy8qsGdkEfkQyVmAYc2XE1irWRnDgXKhmBLKoXg',
            sender_id: 'ak_21A27UVVt3hDkBE5J7rhhqnH5YNb4Y1dqo4PnSybrH85pnWo7E',
            ttl: 4,
            type: 'SpendTx',
            version: 1,
          },
        },
        type: 'SpendTxEvent',
      }],
      next: null,
      prev: null,
    };
    assertNotNull(expectedRes.data);
    expectedRes.data.forEach((item, idx) => {
      assertNotNull(res.data);
      item.blockHash = res.data[idx].blockHash;
      item.blockTime = res.data[idx].blockTime;
      (['blockHash', 'microTime', 'signatures', 'encodedTx'] as const).forEach((key) => {
        assertNotNull(res.data);
        if (res.data[idx].payload[key] == null) return;
        (item.payload[key] as any) = res.data[idx].payload[key];
      });
    });
    expect(res).to.be.eql(expectedRes);
  });
});
