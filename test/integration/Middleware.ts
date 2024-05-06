import { describe, it } from 'mocha';
import { expect } from 'chai';
import '../index';
import { _Middleware } from '../../src';

describe('Middleware API', () => {
  // TODO: remove after solving https://github.com/aeternity/ae_mdw/issues/1336
  const middleware = new _Middleware('https://testnet.aeternity.io/mdw/');

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
      mdwLastMigration: res.mdwLastMigration,
      mdwRevision: res.mdwRevision,
      mdwSynced: true,
      mdwSyncing: true,
      mdwTxIndex: res.mdwTxIndex,
      mdwVersion: res.mdwVersion,
      nodeHeight: res.nodeHeight,
      nodeProgress: 100,
      nodeRevision: res.nodeRevision,
      nodeSyncing: false,
      nodeVersion: res.nodeVersion,
    };
    expect(res).to.be.eql(expectedRes);
  });

  it('gets account activities', async () => {
    const res = await middleware.getAccountActivities('ak_DtJrupsqqByQag76NrxAAimmkYJMk7on7z3xktdZpdkmxKQak');
    const expectedRes: typeof res = {
      data: [{
        blockHash: 'mh_LAo6Cg6d8LGDpxJ3se2aGJZbCubDZyC6GonHK58MKiW4a4LWb',
        blockTime: 1684995426848,
        height: 779178,
        payload: {
          block_hash: 'mh_LAo6Cg6d8LGDpxJ3se2aGJZbCubDZyC6GonHK58MKiW4a4LWb',
          block_height: 779178,
          encoded_tx: 'tx_+QEKCwHAuQEE+QEBUQKhAR1BkBtnVYcqjIhl7aOh9hEy9W96OFTeeQreTa3ExE/auG8rEWzyVws7Ap8AoLb4BE1sdD+LZw3SM+libDajr+a976yRMKi9b7k5whrinwEBAFGw3Ke65y52/KhwL5lYHOlRuOIZZy2V190M5H1ywIgN5fAylDfLImUL3WDwC4UAHa6EcyMc3Pl8apaHFuO79AMDhkduhMz4AILDUIQ7msoAuFr4WAsBwLhT+FEMAaEBHUGQG2dVhyqMiGXto6H2ETL1b3o4VN55Ct5NrcTET9qhAUCcLjbyYA3yE1vkfr0zC0M4oNrQ3lNoPHDD6EzUnVzAcIYPJvVhyAAAAIAv4MYN',
          hash: 'th_YHj5aB6JzHciY5f6jqgtso8u2iY9p6MT9RV96FwXQNS1MpSML',
          micro_index: 18,
          micro_time: 1684995426848,
          tx: {
            abi_version: 3,
            auth_data: 'cb_KxFs8lcLOwKfAKC2+ARNbHQ/i2cN0jPpYmw2o6/mve+skTCovW+5OcIa4p8BAQBRsNynuucudvyocC+ZWBzpUbjiGWctldfdDOR9csCIDeXwMpQ3yyJlC91g8AuFAB2uhHMjHNz5fGqWhxbju/QDsvQe5g==',
            fee: 78540000000000,
            ga_id: 'ak_DtJrupsqqByQag76NrxAAimmkYJMk7on7z3xktdZpdkmxKQak',
            gas: 50000,
            gas_price: 1000000000,
            gas_used: 8444,
            return_type: 'ok',
            tx: {
              signatures: [],
              tx: {
                amount: 112,
                fee: 16660000000000,
                nonce: 0,
                payload: 'ba_Xfbg4g==',
                recipient_id: 'ak_VTNurrhRhJBVK19JfUnEv4qgdZJT7DUghxz3ACEFBNKgw8R3D',
                sender_id: 'ak_DtJrupsqqByQag76NrxAAimmkYJMk7on7z3xktdZpdkmxKQak',
                type: 'SpendTx',
                version: 1,
              },
            },
            type: 'GAMetaTx',
            version: 2,
          },
        },
        type: 'GAMetaTxEvent',
      }, {
        blockHash: 'mh_2R1PVwTNP3Jha7oRby9Me3SRBP4R9he6RMH6eCCJGyVBHAzy5f',
        blockTime: 1684995366595,
        height: 779178,
        payload: {
          block_hash: 'mh_2R1PVwTNP3Jha7oRby9Me3SRBP4R9he6RMH6eCCJGyVBHAzy5f',
          block_height: 779178,
          encoded_tx: 'tx_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',
          hash: 'th_AScnu6AAGHvfewMELKvmc6KH9jaMfzopGpcFFo1HAoS7ne1fD',
          micro_index: 11,
          micro_time: 1684995366595,
          signatures: [
            'sg_SBD5RkjMkfDM8KGJTgTTgmfXaimac2cGy4x39efXZjrPdr5zVJAmqu8dLiMNoVX1FHTESERRvejAnDVDjxLq6x2gb1SzK',
          ],
          tx: {
            abi_version: 3,
            args: [
              {
                type: 'address',
                value: 'ak_2PahBfbkrmBFfbb4FGEVErP7mChFGPYFb9eGMARU514u5V3K52',
              },
            ],
            auth_fun: '0x6cf2570b0a1599b708291e50aa3daf13d0c7f2484bc337ddad2413a37fd4a009',
            auth_fun_name: 'authorize',
            call_data: 'cb_KxFE1kQfG58AoLb4BE1sdD+LZw3SM+libDajr+a976yRMKi9b7k5whrijU9L2Q==',
            code: 'cb_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',
            contract_id: 'ct_2TRQYcmvhRrbGrNKXy8uBZX2MQbgHrZmVCEHZBAJkhs24DdeVP',
            fee: 107820000000000,
            gas: 597,
            gas_price: 1000000000,
            gas_used: 478,
            nonce: 1,
            owner_id: 'ak_DtJrupsqqByQag76NrxAAimmkYJMk7on7z3xktdZpdkmxKQak',
            return_type: 'ok',
            type: 'GAAttachTx',
            version: 1,
            vm_version: 7,
          },
        },
        type: 'GAAttachTxEvent',
      }, {
        blockHash: 'mh_25snWYwTkU1xjPCcH592XVNzL894qSpF4yqnt8tABKGEVm6nSz',
        blockTime: 1684995336526,
        height: 779178,
        payload: {
          block_hash: 'mh_25snWYwTkU1xjPCcH592XVNzL894qSpF4yqnt8tABKGEVm6nSz',
          block_height: 779178,
          encoded_tx: 'tx_+K4LAfhCuEBjZgd36W2H8rB5KZzut7wvRnAsjJSD+CEg8Dbm8ivFXmDzKFauG8QJpnm9kmVnNl0xOI7xVsm0brXYTMNuAmUDuGb4ZAwBoQHhMrjx3begTmO3+pZHmlS7xSWlMafxvAzkkhIZAwZ/sKEBHUGQG2dVhyqMiGXto6H2ETL1b3o4VN55Ct5NrcTET9qIRWORgkT0AACGD39vJaAAAIKQmIlGYXVjZXQgVHiaKLKm',
          hash: 'th_242zV1qXwag6iBH3Pd8zn3DQC37h4uP38CoFjkaTgT19AVKMHo',
          micro_index: 7,
          micro_time: 1684995336526,
          signatures: [
            'sg_E1Ezn9EMsxTZz7a93Zc5kjXkS1t3WqFbr3X8DqqjdXXfXD9Xy6DZQpjB2rHfcoZ3ySZ1FHh9bzMjfQfdA9mRJJ4yeYdfN',
          ],
          tx: {
            amount: 5000000000000000000,
            fee: 17040000000000,
            nonce: 37016,
            payload: 'ba_RmF1Y2V0IFR4tYtyuw==',
            recipient_id: 'ak_DtJrupsqqByQag76NrxAAimmkYJMk7on7z3xktdZpdkmxKQak',
            sender_id: 'ak_2iBPH7HUz3cSDVEUWiHg76MZJ6tZooVNBmmxcgVK6VV8KAE688',
            type: 'SpendTx',
            version: 1,
          },
        },
        type: 'SpendTxEvent',
      }],
      next: null,
      prev: null,
    };
    expect(res).to.be.eql(expectedRes);
  });
});
