import { describe, before, it } from 'mocha';
import { expect } from 'chai';
import resetMiddleware, { presetAccount1Address, presetAccount2Address } from './reset-middleware';
import {
  Encoded,
  Encoding,
  IllegalArgumentError,
  isEncoded,
  Middleware,
  MiddlewarePageMissed,
  UnexpectedTsError,
} from '../../src';
import { assertNotNull } from '../utils';
import { pause } from '../../src/utils/other';
import {
  Activity,
  Auction,
  Channel,
  ContractCall,
  ContractLog,
  DeltaStat,
  KeyBlockExtended,
  Miner,
  Name,
  NameClaim,
  NameUpdate,
  Oracle,
  Pointee,
  Stat,
  TotalStat,
  Transaction,
  Transfer,
} from '../../src/apis/middleware';
import { MiddlewarePage } from '../../src/utils/MiddlewarePage';

function copyFields(
  target: { [key: string]: any },
  source: { [key: string]: any },
  fields: string[],
): void {
  fields
    .filter((key) => source[key] != null)
    .forEach((key) => {
      expect(typeof target[key]).to.equal(typeof source[key]);
      expect(target[key]?.constructor).to.equal(source[key]?.constructor);
      if (typeof target[key] === 'string' && target[key][2] === '_') {
        expect(target[key].slice(0, 2)).to.equal(source[key].slice(0, 2));
      }
      target[key] = source[key];
    });
}

describe('Middleware API', () => {
  const middleware = new Middleware('http://localhost:4000');

  before(async function init() {
    this.timeout('12s');
    await resetMiddleware();
    while (!(await middleware.getStatus()).mdwSynced) {
      await pause(200);
    }
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
      mdwLastMigration: 20241128134337,
      mdwRevision: '381b0128',
      mdwSynced: true,
      mdwSyncing: true,
      mdwTxIndex: res.mdwTxIndex,
      mdwVersion: '1.97.1',
      nodeHeight: res.nodeHeight,
      nodeProgress: 100,
      nodeRevision: '57bc00b760dbb3ccd10be51f447e33cb3a2f56e3',
      nodeSyncing: false,
      nodeVersion: '7.3.0-rc3',
    };
    expect(res).to.eql(expectedRes);
  });

  describe('blocks', () => {
    it('gets key blocks', async () => {
      const res = await middleware.getKeyBlocks({ limit: 15 });
      const expectedRes: typeof res = new MiddlewarePage<KeyBlockExtended>(
        {
          data: [
            {
              beneficiary: 'ak_11111111111111111111111111111111273Yts',
              beneficiaryReward: 0,
              flags: 'ba_gAAAAOYyHPU=',
              hash: 'kh_nvmdByyHT8513zwVwxQ1tTsKbgfgdp1LX43jHj3ujb2AvDSh5',
              height: 0,
              info: 'cb_Xfbg4g==',
              microBlocksCount: 0,
              miner: 'ak_11111111111111111111111111111111273Yts',
              prevHash: 'kh_2CipHmrBcC5LrmnggBrAGuxAf2fPDrAt79asKnadME4nyPRzBL',
              prevKeyHash: 'kh_11111111111111111111111111111111273Yts',
              stateHash: 'bs_HwreBuvhDCzAdkL2upX6qhEAkCXirujYP5BXkPDF7NZV76fdR',
              target: 1338,
              // TODO: remove after solving https://github.com/Azure/autorest.typescript/issues/3043
              time: undefined as unknown as Date,
              transactionsCount: 0,
              version: 1,
            },
          ],
          next: null,
          prev: null,
        },
        middleware,
      );
      expectedRes.data.unshift(...res.data.slice(0, -1));
      expect(res.data[0].time.getFullYear()).to.be.within(2024, 2030);
      expect(res).to.eql(expectedRes);
    });

    it('gets micro block', async () => {
      const microBlockHash = (await middleware.getKeyBlocks()).data
        .reverse()
        .find(({ prevHash }) => prevHash.startsWith('mh_'))?.prevHash;
      assertNotNull(microBlockHash);
      if (!isEncoded(microBlockHash, Encoding.MicroBlockHash)) throw new UnexpectedTsError();
      const res = await middleware.getMicroBlock(microBlockHash);
      const expectedRes: typeof res = {
        flags: 'ba_AAAAAIy5ASU=',
        gas: 78500,
        hash: 'mh_uMZS2rqBQ1ZD9GNTS2n54bRbATbupC2JV32wpj4gs4EGnfnKd',
        height: 2,
        microBlockIndex: 0,
        pofHash: 'no_fraud',
        prevHash: 'kh_cKJy5CavGHMCpzmZz5s38Yw2F6Es6t2ED3Rddb7zgakZ5xZwJ',
        prevKeyHash: 'kh_cKJy5CavGHMCpzmZz5s38Yw2F6Es6t2ED3Rddb7zgakZ5xZwJ',
        stateHash: 'bs_2JgJeoSoVCYgmhSimw473A4L6CGFTagQjDFDsSZJQFuemyiZZa',
        time: new Date(1721957163938),
        transactionsCount: 1,
        version: 6,
        signature:
          'sg_DmGnGbbfUNuYgvJyvA927kbqJ9mVDHoKMHYvRQR89LcmAV26WwUvLSdJwdvohnGcr58VRJtzjikEaJ9HuFwduo3jbMr9E',
        txsHash: 'bx_2i471KqJ5XTLVQJS4x95FyLuwbAcj4SetvemPUs4oV47S9dFb3',
      };
      copyFields(expectedRes, res, ['time', 'hash', 'prevHash', 'prevKeyHash', 'signature']);
      expect(res).to.eql(expectedRes);
    });
  });

  describe('transactions', () => {
    it('gets account activities', async () => {
      const res = await middleware.getAccountActivities(presetAccount1Address);
      const expectedRes: typeof res = new MiddlewarePage<Activity>(
        {
          data: [
            {
              blockHash: 'mh_f4S91p7y6hojhGhPHwzoXdjvZVWcuaBg759BDUzHDsQmYnC4o',
              blockTime: new Date(1721994542947),
              height: 11,
              payload: {
                blockHash: 'mh_f4S91p7y6hojhGhPHwzoXdjvZVWcuaBg759BDUzHDsQmYnC4o',
                blockHeight: 11,
                encodedTx:
                  'tx_+QEQCwH4hLhAfiGhhOZxwmnQvbdccs6QAfNW0eLK/B/Q/mnyRecva/7S5CzZM4CJc2A9/wIe/q6+SvycqfH44siQmJsCIo0rCLhA4jKt6g+45BFsA/1yHuMTtm2gYbocs1HsHQJQgVf84dFmEscGNzih38qBjerWY2Poscr9rKoDE2oCm0+VkrhkA7iG+IQyAqEBZaKlte018CTFZNmmlaD9LKcD19Vo4SqKqkJrvn4KnomHAca/UmNAAKEBpQ3vKE1jiARiiFIDILt4wWVsMHwCRAf74T0FFhAGxKqHAca/UmNAAAABAIYQFHIeoADAwKBsGHHwj5GEh4Gy4HE+O8s2b64SKuVCuBGlgfmEluytjAcR+sQp',
                hash: 'th_26quLwJJ5CezBuXKnm2duH7bgmBGBTkqjL1m9ybroZ9Kndp8h2',
                microIndex: 0,
                microTime: new Date(1721994542947),
                signatures: [
                  'sg_HW6JCb97ZBcn5hAoiqWNDoYVus1qqK9Ne2Ls1GjriSPzWhWkKX7EZigKbBayLcTmM2LNYpc2vcEBGFzEzsHBsssuLBcqV',
                  'sg_WbQJc3RweFShfr3YgFk5Wqin4QRsr9a487tuvXxi4yLHtYEqRXwffVUD2iz5GXAkJEXayyLMmGQpP22beMYNNYnyKrJNW',
                ],
                tx: {
                  channelId: 'ch_2HQRew5QMG8EVPHEWSxEaCQSUF9yRVLaSU4cHJpcG2AZt57Rx2',
                  channelReserve: 0n,
                  delegateIds: {
                    initiator: [],
                    responder: [],
                  },
                  fee: 17680000000000n,
                  initiatorAmount: 500000000000000n,
                  initiatorId: 'ak_mm92WC5DaSxLfWouNABCU9Uo1bDMFEXgbbnWU8n8o9u1e3qQp',
                  lockPeriod: 1,
                  nonce: 7,
                  responderAmount: 500000000000000n,
                  responderId: 'ak_2Fh6StA76AKdy8qsGdkEfkQyVmAYc2XE1irWRnDgXKhmBLKoXg',
                  stateHash: 'st_bBhx8I+RhIeBsuBxPjvLNm+uEirlQrgRpYH5hJbsrYwznWSz',
                  type: 'ChannelCreateTx',
                  version: 2,
                },
              },
              type: 'ChannelCreateTxEvent',
            },
            {
              blockHash: 'mh_2GzNyPoPZvKavxfvorCc7gwTFs8u6HKzua2z7fcakCxh66JfrU',
              blockTime: new Date(1721911705246),
              height: 3,
              payload: {
                amount: 500000000000000n,
                kind: 'fee_lock_name',
                refTxHash: 'th_2CKnN6EorvNiwwqRjSzXLrPLiHmcwo4Ny22dwCrSYRoD6MVGK1',
              },
              type: 'InternalTransferEvent',
            },
            {
              blockHash: 'mh_2GzNyPoPZvKavxfvorCc7gwTFs8u6HKzua2z7fcakCxh66JfrU',
              blockTime: new Date(1721911705246),
              height: 3,
              payload: {
                blockHash: 'mh_2GzNyPoPZvKavxfvorCc7gwTFs8u6HKzua2z7fcakCxh66JfrU',
                blockHeight: 3,
                encodedTx:
                  'tx_+KULAfhCuEBXzxuqo82mMkKCtMLjwrBwYa6B1zvwpqUeGT49lce9p0QMPb2tfgcgScxi2N87JfOwRpuI2iOsrP69uMtYfKIIuF34WyACoQGlDe8oTWOIBGKIUgMgu3jBZWwwfAJEB/vhPQUWEAbEqgKkMTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3ODAwLmNoYWluAIcBxr9SY0AAhg9Vhk+YAAarXkK8',
                hash: 'th_2CKnN6EorvNiwwqRjSzXLrPLiHmcwo4Ny22dwCrSYRoD6MVGK1',
                microIndex: 0,
                microTime: new Date(1721911705246),
                signatures: [
                  'sg_CVJMvQ7TPCbcmEn5GXFY9bh8okNTuE956PiiZaSJ2V9JWKgimmP86L5NUiZpFgeE6Am7QJk7KYwxJMGgFhQSXJJxrhqFJ',
                ],
                tx: {
                  accountId: 'ak_2Fh6StA76AKdy8qsGdkEfkQyVmAYc2XE1irWRnDgXKhmBLKoXg',
                  fee: 16860000000000n,
                  name: '123456789012345678901234567800.chain',
                  nameFee: 500000000000000n,
                  nameId: 'nm_ZdygpYcGrRPNJZC1WRLRsEx3KT91zE4Mieg4XNkM6Qvs71NaE',
                  nameSalt: 0,
                  nonce: 2,
                  ttl: 6,
                  type: 'NameClaimTx',
                  version: 2,
                },
              },
              type: 'NameClaimTxEvent',
            },
            {
              blockHash: 'mh_2SiHrRABSj8Hgdt3Dc2ypaKrUkjCTK92pUx1nZKLEAYMVhUu8G',
              blockTime: new Date(1721911705161),
              height: 2,
              payload: {
                blockHash: 'mh_2SiHrRABSj8Hgdt3Dc2ypaKrUkjCTK92pUx1nZKLEAYMVhUu8G',
                blockHeight: 2,
                encodedTx:
                  'tx_+PcLAfhCuEB+Tq5sUOIMedGLODH48nG1b7KNt4Dre9vyXC3eH2EjFe2EkVGpx4QN/eQU2OLHXJgg1/7uFO5S3pMlI+jqv78FuK/4rSoBoQGlDe8oTWOIBGKIUgMgu3jBZWwwfAJEB/vhPQUWEAbEqgG4avhoRgOg2qvS0QZEjddEG/XeWW7yVgfv7YPK4+Tsp1rY/AENke3AuDue/kTWRB8ANwA3ABoOgj8BAz/+gHggkgA3AQcHAQEAmC8CEUTWRB8RaW5pdBGAeCCSGWdldEFyZ4IvAIU4LjAuMACDCAADhkdlNJ1oAAUAAEyEO5rKAIcrEUTWRB8/Bmn2yg==',
                hash: 'th_2JMR7C1DjrGeZWyyLMkccRLga1Lct8Syy9hcZKD9PEZkN5JvSD',
                microIndex: 0,
                microTime: new Date(1721911705161),
                signatures: [
                  'sg_HXRkFjgjsFmFLZ1ywBgYj9VouQK1BySqCViALxq3ge69a86aDgd1ESqNXhCLebh7fH6SohTjbLXXxhjPnYXaGJfiX7DQV',
                ],
                tx: {
                  abiVersion: 3,
                  amount: 0n,
                  callData: 'cb_KxFE1kQfP4oEp9E=',
                  callerId: 'ak_2Fh6StA76AKdy8qsGdkEfkQyVmAYc2XE1irWRnDgXKhmBLKoXg',
                  code: 'cb_+GhGA6Daq9LRBkSN10Qb9d5ZbvJWB+/tg8rj5OynWtj8AQ2R7cC4O57+RNZEHwA3ADcAGg6CPwEDP/6AeCCSADcBBwcBAQCYLwIRRNZEHxFpbml0EYB4IJIZZ2V0QXJngi8AhTguMC4wAHQkH9o=',
                  contractId: 'ct_2JgVFKjJYUyJDnpJPhspX8C6RS6rFS46r3C1sy15tW9dDmPX2E',
                  deposit: 0n,
                  fee: 78500000000000n,
                  gas: 76,
                  gasPrice: 1000000000n,
                  nonce: 1,
                  ownerId: 'ak_2Fh6StA76AKdy8qsGdkEfkQyVmAYc2XE1irWRnDgXKhmBLKoXg',
                  ttl: 5,
                  type: 'ContractCreateTx',
                  version: 1,
                  vmVersion: 8,
                  ...{
                    aexn_type: null,
                    args: [],
                    compiler_version: '8.0.0',
                    gas_used: 61,
                    log: [],
                    return_type: 'ok',
                    return_value: 'cb_Xfbg4g==',
                    source_hash: '2qvS0QZEjddEG/XeWW7yVgfv7YPK4+Tsp1rY/AENke0=',
                  },
                },
              },
              type: 'ContractCreateTxEvent',
            },
            {
              blockHash: 'mh_Q6fJrHYWiaAz8277zX8fgAgyCpmBtioFd1RQdC36oRuCtjz19',
              blockTime: new Date(1721911704982),
              height: 1,
              payload: {
                blockHash: 'mh_Q6fJrHYWiaAz8277zX8fgAgyCpmBtioFd1RQdC36oRuCtjz19',
                blockHeight: 1,
                encodedTx:
                  'tx_+KMLAfhCuEDgjc7zMPb+xRW+pI0L5OqwjI+OBF0ee1zgmlkXsavoYXHZw7vTx6vxaAZxxs4ts/eZhAmqVGg3EmTsRAtccKMDuFv4WQwBoQGEDJdLlxZHdkVLoRnYTtxNYFio3skrbtxXirLTC0xCAKEBpQ3vKE1jiARiiFIDILt4wWVsMHwCRAf74T0FFhAGxKqIDeC2s6dkAACGD0w2IAgABAGAJs2FDw==',
                hash: 'th_U26TdBBNT56HFXWAb4ktFyWBTuCAnwdajecTL4ss2BhciRviG',
                microIndex: 0,
                microTime: new Date(1721911704982),
                signatures: [
                  'sg_WNvkq9RewEjZDrDLqXMUoyBd8pGzqAuyaDfG3bQAfGx4tF6smTLyYnFWmtY8SrJRnEHbriDUm836DSJSkMjiijLKBsSzo',
                ],
                tx: {
                  amount: 1000000000000000000n,
                  fee: 16820000000000n,
                  nonce: 1,
                  payload: 'ba_Xfbg4g==',
                  recipientId: 'ak_2Fh6StA76AKdy8qsGdkEfkQyVmAYc2XE1irWRnDgXKhmBLKoXg',
                  senderId: 'ak_21A27UVVt3hDkBE5J7rhhqnH5YNb4Y1dqo4PnSybrH85pnWo7E',
                  ttl: 4,
                  type: 'SpendTx',
                  version: 1,
                },
              },
              type: 'SpendTxEvent',
            },
          ],
          next: null,
          prev: null,
        },
        middleware,
      );
      expectedRes.data.forEach((item, idx) => {
        copyFields(item, res.data[idx], ['blockHash', 'blockTime']);
        copyFields(item.payload, res.data[idx].payload, ['blockHash', 'microTime']);
      });
      expect(res).to.eql(expectedRes);
    });

    it('gets transactions', async () => {
      const res = await middleware.getTransactions({ limit: 15 });
      const expectedRes: typeof res = new MiddlewarePage<Transaction>(
        {
          data: [
            {
              blockHash: 'mh_2nWwtjNCnjUYMqGfgfrt8MsnvRYuY8ZdET31RXTa4jFBdzEKF8',
              blockHeight: 1,
              encodedTx:
                'tx_+KMLAfhCuEDgjc7zMPb+xRW+pI0L5OqwjI+OBF0ee1zgmlkXsavoYXHZw7vTx6vxaAZxxs4ts/eZhAmqVGg3EmTsRAtccKMDuFv4WQwBoQGEDJdLlxZHdkVLoRnYTtxNYFio3skrbtxXirLTC0xCAKEBpQ3vKE1jiARiiFIDILt4wWVsMHwCRAf74T0FFhAGxKqIDeC2s6dkAACGD0w2IAgABAGAJs2FDw==',
              hash: 'th_U26TdBBNT56HFXWAb4ktFyWBTuCAnwdajecTL4ss2BhciRviG',
              microIndex: 0,
              microTime: new Date(1721973919196),
              signatures: [
                'sg_WNvkq9RewEjZDrDLqXMUoyBd8pGzqAuyaDfG3bQAfGx4tF6smTLyYnFWmtY8SrJRnEHbriDUm836DSJSkMjiijLKBsSzo',
              ],
              tx: {
                amount: 1000000000000000000n,
                fee: 16820000000000n,
                nonce: 1,
                payload: 'ba_Xfbg4g==',
                recipientId: 'ak_2Fh6StA76AKdy8qsGdkEfkQyVmAYc2XE1irWRnDgXKhmBLKoXg',
                senderId: 'ak_21A27UVVt3hDkBE5J7rhhqnH5YNb4Y1dqo4PnSybrH85pnWo7E',
                ttl: 4,
                type: 'SpendTx',
                version: 1,
              },
            },
          ],
          next: null,
          prev: null,
        },
        middleware,
      );
      const tx = res.data.at(-1);
      assertNotNull(tx);
      res.data.length = 0;
      res.data.push(tx);
      copyFields(expectedRes.data[0], res.data[0], ['blockHash', 'microTime']);
      expect(res).to.eql(expectedRes);
    });

    it('gets transactions count', async () => {
      const res = await middleware.getTransactionsCount();
      const expectedRes: typeof res = { body: 11 };
      expect(res).to.eql(expectedRes);
    });

    it('gets transfers', async () => {
      const res = await middleware.getTransfers();
      const expectedRes: typeof res = new MiddlewarePage<Transfer>(
        {
          data: [
            {
              accountId: 'ak_mm92WC5DaSxLfWouNABCU9Uo1bDMFEXgbbnWU8n8o9u1e3qQp',
              amount: 570288700000000000000n,
              height: 7,
              kind: 'fee_spend_name',
              // TODO: remove after solving https://github.com/aeternity/ae_mdw/issues/2079
              refBlockHash: 'NameClaimTx' as Encoded.MicroBlockHash,
              refTxHash: 'th_C7LscPqF5Nf5QrgZDSVbY92v7rruefN1qHjrHVuk2bdNwZF1e',
              refTxType: 'mh_2MYrB5Qjb4NCYZMVmbqnazacY76gGzNgEjW2VnEKzovDTky8fD',
            },
          ],
          next: null,
          prev: null,
        },
        middleware,
      );
      expectedRes.data.push(...res.data.slice(1));
      copyFields(expectedRes.data[0], res.data[0], ['refTxType']);
      expect(res).to.eql(expectedRes);
    });
  });

  describe('contracts', () => {
    it('gets contract calls', async () => {
      const res = await middleware.getContractCalls();
      const expectedRes: typeof res = new MiddlewarePage<ContractCall>(
        {
          data: [
            {
              function: 'Chain.spend',
              height: 9,
              contractId: 'ct_2J7DrZAUV3gMFPt9DJi6uJBBZ3T4eKyKY7xtLot7puu3yP2kQp',
              blockHash: 'mh_zmcTZSgZcuQ9fL6h6iNNp3ftFvbQ2FjtgPHg9qEHgbwyqFFpi',
              localIdx: 0,
              callTxHash: 'th_2cNd6j4CtZYaY6F6AWNbYDXZGkaQbaAjjjtBiLATiaiXJ1P812',
              contractTxHash: 'th_2TzSqAuvAAEVFpucVgEALitxyJSJCBsR3RbxpSzPhbYbaasXBb',
              internalTx: {
                amount: 42,
                fee: 0,
                nonce: 0,
                payload: 'ba_Q2hhaW4uc3BlbmRFa4Tl',
                recipient_id: 'ak_21A27UVVt3hDkBE5J7rhhqnH5YNb4Y1dqo4PnSybrH85pnWo7E',
                sender_id: 'ak_2J7DrZAUV3gMFPt9DJi6uJBBZ3T4eKyKY7xtLot7puu3yP2kQp',
                type: 'SpendTx',
                version: 1,
              },
              microIndex: 0,
            },
          ],
          next: null,
          prev: null,
        },
        middleware,
      );
      copyFields(expectedRes.data[0], res.data[0], ['blockHash']);
      expect(res).to.eql(expectedRes);
    });

    it('gets contract logs', async () => {
      const res = await middleware.getContractLogs();
      const expectedRes: typeof res = new MiddlewarePage<ContractLog>(
        {
          data: [
            {
              args: ['43'],
              data: 'test-string',
              height: 9,
              contractId: 'ct_2J7DrZAUV3gMFPt9DJi6uJBBZ3T4eKyKY7xtLot7puu3yP2kQp',
              blockHash: 'mh_zmcTZSgZcuQ9fL6h6iNNp3ftFvbQ2FjtgPHg9qEHgbwyqFFpi',
              eventName: null,
              logIdx: 0,
              blockTime: new Date(1721968249016),
              eventHash: 'KGBGHR0NTNENA10FD9MJS5P39C1LD4T9AUBIPIDL772714A57HH0====',
              callTxHash: 'th_2cNd6j4CtZYaY6F6AWNbYDXZGkaQbaAjjjtBiLATiaiXJ1P812',
              contractTxHash: 'th_2TzSqAuvAAEVFpucVgEALitxyJSJCBsR3RbxpSzPhbYbaasXBb',
              microIndex: 0,
              extCallerContractId: null,
              extCallerContractTxHash: null,
              parentContractId: null,
            },
          ],
          next: null,
          prev: null,
        },
        middleware,
      );
      copyFields(expectedRes.data[0], res.data[0], ['blockHash', 'blockTime']);
      expect(res).to.eql(expectedRes);
    });

    it('gets contract', async () => {
      const { contractId } = (await middleware.getContractCalls()).data[0];
      const res = await middleware.getContract(contractId);
      const expectedRes: typeof res = {
        contract: 'ct_2J7DrZAUV3gMFPt9DJi6uJBBZ3T4eKyKY7xtLot7puu3yP2kQp',
        blockHash: 'mh_BDHVCb4umyui7j68WoQTNXmUDvPk7bbq9aFTZkTysfjwp81fn',
        createTx: {
          abiVersion: 3,
          amount: 100n,
          callData: 'cb_KxFE1kQfP4oEp9E=',
          code: 'cb_+QEcRgOgzPAt3CM1MXJqVKUexArUzQqzhuZqPx4w8pc2S1dcOHXAuO+4wf5E1kQfADcANwAaDoI/AQM//mWl4A8CNwGHAjcBBzcCdwc3AAg9AAIERjYAAABiL1+fAYEFPg9NJAu8Y6cqlt/F0eAzEdVzQbFz6kWUaMkB2l2DOwABAz9GNgAAAEY2AgACYi4AnwGBpBcI7Bft3XUED2ptPhcjSwNWk6lXlyzJtTnEcJFFPGICAQM//pdbzNwANwFHADcADAOvggECASstdGVzdC1zdHJpbmdWAgMRZaXgDw8Cb4Imz2UNAFQBAz+oLwMRRNZEHxFpbml0EWWl4A8tQ2hhaW4uZXZlbnQRl1vM3BVzcGVuZIIvAIU4LjAuMAAyWaKG',
          deposit: 0n,
          fee: 82160000000000n,
          gas: 76,
          gasPrice: 1000000000n,
          nonce: 4,
          ownerId: 'ak_mm92WC5DaSxLfWouNABCU9Uo1bDMFEXgbbnWU8n8o9u1e3qQp',
          ttl: 11,
          vmVersion: 8,
        },
        aexnType: null,
        sourceTxHash: 'th_2TzSqAuvAAEVFpucVgEALitxyJSJCBsR3RbxpSzPhbYbaasXBb',
        sourceTxType: 'ContractCreateTx',
      };
      copyFields(expectedRes, res, ['blockHash']);
      expect(res).to.eql(expectedRes);
    });
  });

  describe('names', () => {
    it('gets names', async () => {
      const res = await middleware.getNames();
      const expectedRes: typeof res = new MiddlewarePage<Name>(
        {
          data: [
            {
              active: true,
              hash: 'nm_2VSJFCVStB8ZdkLWcyd4adywYoyqYNzMt9Td924Jf8ESi94Nni',
              activeFrom: 3,
              approximateActivationTime: new Date(1721740187500),
              approximateExpireTime: new Date(1754140007661),
              claimsCount: 1,
              expireHeight: 180003,
              pointers: [
                {
                  encodedKey: 'ba_YWNjb3VudF9wdWJrZXn8jckR',
                  id: presetAccount1Address,
                  key: 'account_pubkey',
                },
                {
                  encodedKey: 'ba_cmF3S2V56FoL5g==',
                  id: 'ba_wP/uRGujhA==',
                  key: 'rawKey',
                },
              ],
              auction: null,
              auctionTimeout: 0,
              ownership: {
                current: presetAccount2Address,
                original: presetAccount2Address,
              },
              name: '123456789012345678901234567801.chain',
              nameFee: 500000000000000n,
              revoke: null,
            },
          ],
          next: null,
          prev: null,
        },
        middleware,
      );
      expectedRes.data.push(res.data[1]);
      copyFields(expectedRes.data[0], res.data[0], [
        'activeFrom',
        'approximateActivationTime',
        'approximateExpireTime',
        'expireHeight',
      ]);
      expect(res).to.eql(expectedRes);
    });

    it('gets names count', async () => {
      const res = await middleware.getNamesCount();
      const expectedRes: typeof res = { body: 2 };
      expect(res).to.eql(expectedRes);
    });

    it('gets name claims', async () => {
      const res = await middleware.getNameClaims('123456789012345678901234567801.chain');
      const expectedRes: typeof res = new MiddlewarePage<NameClaim>(
        {
          data: [
            {
              activeFrom: 5,
              blockHash: 'mh_2MYrB5Qjb4NCYZMVmbqnazacY76gGzNgEjW2VnEKzovDTky8fD',
              height: 5,
              sourceTxHash: 'th_XEwyUgf8BoTdEmcDJcngx3GGCGFeb16XDRfPYHy5zQB4d5kk5',
              sourceTxType: 'NameClaimTx',
              tx: {
                accountId: 'ak_mm92WC5DaSxLfWouNABCU9Uo1bDMFEXgbbnWU8n8o9u1e3qQp',
                fee: 16860000000000n,
                name: '123456789012345678901234567801.chain',
                nameFee: 500000000000000n,
                nameSalt: 0,
                nonce: 1,
                ttl: 8,
              },
              internalSource: false,
            },
          ],
          next: null,
          prev: null,
        },
        middleware,
      );
      copyFields(expectedRes.data[0], res.data[0], ['blockHash']);
      expect(res).to.eql(expectedRes);
    });

    it('gets name updates', async () => {
      const res = await middleware.getNameUpdates('123456789012345678901234567801.chain');
      const expectedRes: typeof res = new MiddlewarePage<NameUpdate>(
        {
          data: [
            {
              activeFrom: 5,
              blockHash: 'mh_2G1nKcenAWtgqJywzmAFLXajZESRySnapUmF4JAboyekmwjBxa',
              height: 6,
              sourceTxHash: 'th_2U32kq8HH1qxS5rohqVGzC9mF9E3mdcj3pZC6o9kfjCB4t1p8h',
              sourceTxType: 'NameUpdateTx',
              tx: {
                accountId: 'ak_mm92WC5DaSxLfWouNABCU9Uo1bDMFEXgbbnWU8n8o9u1e3qQp',
                clientTtl: 3600,
                fee: 18080000000000n,
                nameId: 'nm_2VSJFCVStB8ZdkLWcyd4adywYoyqYNzMt9Td924Jf8ESi94Nni',
                nameTtl: 180000,
                nonce: 2,
                pointers: [
                  {
                    encodedKey: 'ba_YWNjb3VudF9wdWJrZXn8jckR',
                    id: 'ak_2Fh6StA76AKdy8qsGdkEfkQyVmAYc2XE1irWRnDgXKhmBLKoXg',
                    key: 'account_pubkey',
                  },
                  {
                    encodedKey: 'ba_cmF3S2V56FoL5g==',
                    id: 'ba_wP/uRGujhA==',
                    key: 'rawKey',
                  },
                ],
                ttl: 9,
              },
              internalSource: false,
            },
          ],
          next: null,
          prev: null,
        },
        middleware,
      );
      copyFields(expectedRes.data[0], res.data[0], ['blockHash']);
      expect(res).to.eql(expectedRes);
    });

    it('gets account pointees pointers', async () => {
      const res = await middleware.getAccountPointees(presetAccount1Address);
      const expectedRes: typeof res = new MiddlewarePage<Pointee>(
        {
          data: [
            {
              active: true,
              blockHash: 'mh_2AVwWGLB7H8McaS1Yr7dfGoepTTVmTXJVFU5TCeDDAxgkyGDAr',
              blockHeight: 6,
              blockTime: new Date(1721994539489),
              key: 'account_pubkey',
              name: '123456789012345678901234567801.chain',
              sourceTxHash: 'th_2U32kq8HH1qxS5rohqVGzC9mF9E3mdcj3pZC6o9kfjCB4t1p8h',
              sourceTxType: 'NameUpdateTx',
              tx: {
                accountId: 'ak_mm92WC5DaSxLfWouNABCU9Uo1bDMFEXgbbnWU8n8o9u1e3qQp',
                clientTtl: 3600,
                fee: 18080000000000n,
                nameId: 'nm_2VSJFCVStB8ZdkLWcyd4adywYoyqYNzMt9Td924Jf8ESi94Nni',
                nameTtl: 180000,
                nonce: 2,
                pointers: [
                  {
                    encodedKey: 'ba_YWNjb3VudF9wdWJrZXn8jckR',
                    id: 'ak_2Fh6StA76AKdy8qsGdkEfkQyVmAYc2XE1irWRnDgXKhmBLKoXg',
                    key: 'account_pubkey',
                  },
                  {
                    encodedKey: 'ba_cmF3S2V56FoL5g==',
                    id: 'ba_wP/uRGujhA==',
                    key: 'rawKey',
                  },
                ],
                ttl: 9,
              },
            },
          ],
          next: null,
          prev: null,
        },
        middleware,
      );
      copyFields(expectedRes.data[0], res.data[0], ['blockHash', 'blockTime']);
      expect(res).to.eql(expectedRes);
    });

    it('gets auctions', async () => {
      const res = await middleware.getNamesAuctions();
      const expectedRes: typeof res = new MiddlewarePage<Auction>(
        {
          data: [
            {
              activationTime: new Date(1721975996873),
              approximateExpireTime: new Date(1722407457100),
              auctionEnd: 2407,
              claimsCount: 1,
              lastBid: {
                blockHash: 'mh_BoBikwwf68giAEFKNYEh93uNkGu9enzx8cjn2vX7CRTnY5g6T',
                blockHeight: 7,
                encodedTx:
                  'tx_+IoLAfhCuEA6/CTIyE5UbHQIB8sWFKudzIu8dWfB71IRqDzbp0IUIiIpvPIEg4s/2nZ5aHrh7XxFc2+GqsRkqw8XffUTpxcCuEL4QCACoQFloqW17TXwJMVk2aaVoP0spwPX1WjhKoqqQmu+fgqeiQOHMS5jaGFpbgCJHupYdyGHT8AAhg7Xy82AAArCRC+X',
                hash: 'th_C7LscPqF5Nf5QrgZDSVbY92v7rruefN1qHjrHVuk2bdNwZF1e',
                microIndex: 0,
                microTime: new Date(1721975996873),
                signatures: [
                  'sg_8iagZbC7qnDeRDNkm1y1LyQCUqgobMKNH1G6Pv7QatFfPyo2oPzy5sUQdojZSY9BK7poupGqfQz2Eo8VnVkCyaaBRN8ks',
                ],
                tx: {
                  accountId: 'ak_mm92WC5DaSxLfWouNABCU9Uo1bDMFEXgbbnWU8n8o9u1e3qQp',
                  fee: 16320000000000n,
                  name: '1.chain',
                  nameFee: 570288700000000000000n,
                  nameId: 'nm_TcQ86NkLJanH2dz5Rv1Z8s1VQjw6fDQAXW4oYyGQpHjez3j3p',
                  nameSalt: 0,
                  nonce: 3,
                  ttl: 182407,
                  type: 'NameClaimTx',
                  version: 2,
                },
              },
              name: '1.chain',
              nameFee: 570288700000000000000n,
            },
          ],
          next: null,
          prev: null,
        },
        middleware,
      );
      copyFields(expectedRes.data[0], res.data[0], [
        'activationTime',
        'approximateExpireTime',
        'auctionEnd',
      ]);
      copyFields(expectedRes.data[0].lastBid, res.data[0].lastBid, ['blockHash', 'microTime']);
      expect(res).to.eql(expectedRes);
    });
  });

  describe('oracles', () => {
    it('gets oracles', async () => {
      const res = await middleware.getOracles();
      const expectedRes: typeof res = new MiddlewarePage<Oracle>(
        {
          data: [
            {
              active: true,
              activeFrom: 10,
              approximateExpireTime: new Date(1722066317304),
              expireHeight: 510,
              format: {
                query: 'string',
                response: 'string',
              },
              oracle: 'ok_mm92WC5DaSxLfWouNABCU9Uo1bDMFEXgbbnWU8n8o9u1e3qQp',
              queryFee: 0n,
              register: {
                blockHash: 'mh_2g1RkdVUBXLbxxjR7P2zi1429Navw4HKuzvtC3TezFCjQjwmqE',
                blockHeight: 10,
                hash: 'th_299u2zPGuFDJPpmYM6ZpRaAiCnRViGwW4aph12Hz9Qr1Cc7tPP',
                microIndex: 0,
                microTime: new Date(1721976497295),
                signatures: [
                  'sg_NaZNFJArMypD4wp4MbJ2cMvG6aWk7PSynP9qVsti1CabtMKSUbPwRUz55Yer7XiNURN6PcycF7NwBANaeJPMCpwKoWM9b',
                ],
                tx: {
                  fee: 16432000000000n,
                  nonce: 6,
                  oracleId: 'ok_mm92WC5DaSxLfWouNABCU9Uo1bDMFEXgbbnWU8n8o9u1e3qQp',
                  oracleTtl: {
                    type: 'delta',
                    value: 500,
                  },
                  ttl: 13,
                  txHash: 'th_299u2zPGuFDJPpmYM6ZpRaAiCnRViGwW4aph12Hz9Qr1Cc7tPP',
                  type: 'OracleRegisterTx',
                  version: 1,
                  abiVersion: 0,
                  accountId: 'ak_mm92WC5DaSxLfWouNABCU9Uo1bDMFEXgbbnWU8n8o9u1e3qQp',
                  queryFee: 0n,
                  queryFormat: 'string',
                  responseFormat: 'string',
                },
                encodedTx:
                  'tx_+IsLAfhCuECk8CD7+rO/nCOX4fF6BylVDytJmDquVV56cv7/Lvsg23evMjX45PwdRDn2x/HGBuduMmUQaOESI+GoNarbsNEIuEP4QRYBoQFloqW17TXwJMVk2aaVoP0spwPX1WjhKoqqQmu+fgqeiQaGc3RyaW5nhnN0cmluZwAAggH0hg7x34XgAA0A0ekNLA==',
              },
              registerTime: new Date(1721976497295),
              registerTxHash: 'th_299u2zPGuFDJPpmYM6ZpRaAiCnRViGwW4aph12Hz9Qr1Cc7tPP',
            },
          ],
          next: null,
          prev: null,
        },
        middleware,
      );
      copyFields(expectedRes.data[0].register, res.data[0].register, ['blockHash', 'microTime']);
      copyFields(expectedRes.data[0], res.data[0], ['registerTime', 'approximateExpireTime']);
      expect(res).to.eql(expectedRes);
    });

    it('gets oracle', async () => {
      const { oracle } = (await middleware.getOracles()).data[0];
      const res = await middleware.getOracle(oracle);
      const expectedRes: typeof res = {
        active: true,
        activeFrom: 10,
        approximateExpireTime: new Date(1722066317304),
        expireHeight: 510,
        format: {
          query: 'string',
          response: 'string',
        },
        oracle: 'ok_mm92WC5DaSxLfWouNABCU9Uo1bDMFEXgbbnWU8n8o9u1e3qQp',
        queryFee: 0n,
        register: {
          blockHash: 'mh_25G1JPh8yUNypc8Mbv1H5CSRwLRZ8GMdpYdgcANFj9YBsQNcZ2',
          blockHeight: 10,
          encodedTx:
            'tx_+IsLAfhCuECk8CD7+rO/nCOX4fF6BylVDytJmDquVV56cv7/Lvsg23evMjX45PwdRDn2x/HGBuduMmUQaOESI+GoNarbsNEIuEP4QRYBoQFloqW17TXwJMVk2aaVoP0spwPX1WjhKoqqQmu+fgqeiQaGc3RyaW5nhnN0cmluZwAAggH0hg7x34XgAA0A0ekNLA==',
          hash: 'th_299u2zPGuFDJPpmYM6ZpRaAiCnRViGwW4aph12Hz9Qr1Cc7tPP',
          microIndex: 0,
          microTime: new Date(1722066317304),
          signatures: [
            'sg_NaZNFJArMypD4wp4MbJ2cMvG6aWk7PSynP9qVsti1CabtMKSUbPwRUz55Yer7XiNURN6PcycF7NwBANaeJPMCpwKoWM9b',
          ],
          tx: {
            abiVersion: 0,
            accountId: 'ak_mm92WC5DaSxLfWouNABCU9Uo1bDMFEXgbbnWU8n8o9u1e3qQp',
            fee: 16432000000000n,
            nonce: 6,
            oracleId: 'ok_mm92WC5DaSxLfWouNABCU9Uo1bDMFEXgbbnWU8n8o9u1e3qQp',
            oracleTtl: {
              type: 'delta',
              value: 500,
            },
            queryFee: 0n,
            queryFormat: 'string',
            responseFormat: 'string',
            ttl: 13,
            txHash: 'th_299u2zPGuFDJPpmYM6ZpRaAiCnRViGwW4aph12Hz9Qr1Cc7tPP',
            type: 'OracleRegisterTx',
            version: 1,
          },
        },
        registerTime: new Date(1721976497295),
        registerTxHash: 'th_299u2zPGuFDJPpmYM6ZpRaAiCnRViGwW4aph12Hz9Qr1Cc7tPP',
      };
      copyFields(expectedRes, res, ['registerTime', 'approximateExpireTime']);
      copyFields(expectedRes.register, res.register, ['blockHash', 'microTime']);
      expect(res).to.eql(expectedRes);
    });
  });

  describe('channels', () => {
    it('gets channels', async () => {
      const res = await middleware.getChannels();
      const expectedRes: typeof res = new MiddlewarePage<Channel>(
        {
          data: [
            {
              active: true,
              amount: 1000000000000000n,
              channel: 'ch_2HQRew5QMG8EVPHEWSxEaCQSUF9yRVLaSU4cHJpcG2AZt57Rx2',
              channelReserve: 0n,
              delegateIds: {
                initiator: [],
                responder: [],
              },
              initiator: 'ak_mm92WC5DaSxLfWouNABCU9Uo1bDMFEXgbbnWU8n8o9u1e3qQp',
              initiatorAmount: 500000000000000n,
              lastUpdatedHeight: 11,
              lastUpdatedTime: new Date(1721984829629),
              lastUpdatedTxHash: 'th_26quLwJJ5CezBuXKnm2duH7bgmBGBTkqjL1m9ybroZ9Kndp8h2',
              lastUpdatedTxType: 'ChannelCreateTx',
              lockPeriod: 1,
              lockedUntil: 0,
              responder: 'ak_2Fh6StA76AKdy8qsGdkEfkQyVmAYc2XE1irWRnDgXKhmBLKoXg',
              responderAmount: 500000000000000n,
              round: 1,
              soloRound: 0,
              stateHash: 'st_bBhx8I+RhIeBsuBxPjvLNm+uEirlQrgRpYH5hJbsrYwznWSz',
              updatesCount: 1,
            },
          ],
          next: null,
          prev: null,
        },
        middleware,
      );
      copyFields(expectedRes.data[0], res.data[0], ['lastUpdatedTime']);
      expect(res).to.eql(expectedRes);
    });

    it('gets channel', async () => {
      const { channel } = (await middleware.getChannels()).data[0];
      const res = await middleware.getChannel(channel);
      const expectedRes: typeof res = {
        active: true,
        amount: 1000000000000000n,
        channel: 'ch_2HQRew5QMG8EVPHEWSxEaCQSUF9yRVLaSU4cHJpcG2AZt57Rx2',
        channelReserve: 0n,
        delegateIds: {
          initiator: [],
          responder: [],
        },
        initiator: 'ak_mm92WC5DaSxLfWouNABCU9Uo1bDMFEXgbbnWU8n8o9u1e3qQp',
        initiatorAmount: 500000000000000n,
        lastUpdatedHeight: 11,
        lastUpdatedTime: new Date(1721984829629),
        lastUpdatedTxHash: 'th_26quLwJJ5CezBuXKnm2duH7bgmBGBTkqjL1m9ybroZ9Kndp8h2',
        lastUpdatedTxType: 'ChannelCreateTx',
        lockPeriod: 1,
        lockedUntil: 0,
        responder: 'ak_2Fh6StA76AKdy8qsGdkEfkQyVmAYc2XE1irWRnDgXKhmBLKoXg',
        responderAmount: 500000000000000n,
        round: 1,
        soloRound: 0,
        stateHash: 'st_bBhx8I+RhIeBsuBxPjvLNm+uEirlQrgRpYH5hJbsrYwznWSz',
        updatesCount: 1,
      };
      copyFields(expectedRes, res, ['lastUpdatedTime']);
      expect(res).to.eql(expectedRes);
    });
  });

  describe('statistics', () => {
    const startDate = new Date().toISOString().split('T')[0];
    const endDate = new Date(Date.now() + 24 * 60 * 60_000).toISOString().split('T')[0];

    it('gets delta', async () => {
      const res = await middleware.getDeltaStats();
      const expectedRes: typeof res = new MiddlewarePage<DeltaStat>(
        {
          data: [
            {
              height: 12,
              auctionsStarted: 0,
              namesActivated: 0,
              namesExpired: 0,
              namesRevoked: 0,
              oraclesRegistered: 0,
              oraclesExpired: 0,
              contractsCreated: 0,
              blockReward: 0n,
              devReward: 0n,
              lockedInAuctions: 0n,
              burnedInAuctions: 0n,
              channelsOpened: 0,
              channelsClosed: 0,
              lockedInChannels: 0n,
              lastTxHash: 'th_26quLwJJ5CezBuXKnm2duH7bgmBGBTkqjL1m9ybroZ9Kndp8h2',
            },
          ],
          next: '/v3/stats/delta?cursor=2&limit=10',
          prev: null,
        },
        middleware,
      );
      expectedRes.data.push(...res.data.slice(1));
      expect(res).to.eql(expectedRes);
    });

    it('gets total', async () => {
      const res = await middleware.getTotalStats();
      const expectedRes: typeof res = new MiddlewarePage<TotalStat>(
        {
          data: [
            {
              height: 12,
              contracts: 2,
              lockedInAuctions: 0n,
              burnedInAuctions: 1000000000000000n,
              lockedInChannels: 1000000000000000n,
              activeAuctions: 1,
              activeNames: 2,
              inactiveNames: 0,
              activeOracles: 1,
              inactiveOracles: 0,
              openChannels: 1,
              lastTxHash: 'th_26quLwJJ5CezBuXKnm2duH7bgmBGBTkqjL1m9ybroZ9Kndp8h2',
              sumBlockReward: 0n,
              sumDevReward: 0n,
              totalTokenSupply: 0n,
            },
          ],
          next: '/v3/stats/total?cursor=2&limit=10',
          prev: null,
        },
        middleware,
      );
      expectedRes.data.push(...res.data.slice(1));
      expect(res).to.eql(expectedRes);
    });

    it('gets miner', async () => {
      const res = await middleware.getMinerStats();
      const expectedRes: typeof res = new MiddlewarePage<Miner>(
        { data: [], next: null, prev: null },
        middleware,
      );
      expect(res).to.eql(expectedRes);
    });

    it('gets blocks', async () => {
      const res = await middleware.getBlocksStats();
      const expectedRes: typeof res = new MiddlewarePage<Stat>(
        {
          data: [{ count: 24, endDate, startDate }],
          next: null,
          prev: null,
        },
        middleware,
      );
      expect(res).to.eql(expectedRes);
    });

    it('gets transactions', async () => {
      const res = await middleware.getTransactionsStats();
      const expectedRes: typeof res = new MiddlewarePage<Stat>(
        {
          data: [{ count: 11, endDate, startDate }],
          next: null,
          prev: null,
        },
        middleware,
      );
      expect(res).to.eql(expectedRes);
    });

    it('gets names', async () => {
      const res = await middleware.getNamesStats();
      const expectedRes: typeof res = new MiddlewarePage<Stat>(
        {
          data: [{ count: 0, endDate, startDate }],
          next: null,
          prev: null,
        },
        middleware,
      );
      expect(res).to.eql(expectedRes);
    });
  });

  describe('request by path', () => {
    it('fails if unknown path', async () => {
      await expect(middleware.requestByPath('/404')).to.be.rejectedWith(
        IllegalArgumentError,
        "Can't find operation spec corresponding to /404",
      );
    });

    it('gets not paginated data', async () => {
      const res = await middleware.requestByPath('/v3/status');
      const expectedRes: typeof res = await middleware.getStatus();
      expect(res).to.eql(expectedRes);
    });

    it('gets first page', async () => {
      const res = await middleware.requestByPath<MiddlewarePage<Activity>>(
        `/v3/accounts/${presetAccount1Address}/activities`,
      );
      const expectedRes: typeof res = await middleware.getAccountActivities(presetAccount1Address);
      expect(res).to.eql(expectedRes);
    });

    it('gets first page with query parameters', async () => {
      const res = await middleware.requestByPath<MiddlewarePage<Activity>>(
        `/v3/accounts/${presetAccount1Address}/activities?limit=1`,
      );
      const expectedRes: typeof res = new MiddlewarePage<Activity>(
        {
          data: (await middleware.getAccountActivities(presetAccount1Address)).data.slice(0, 1),
          next: `/v3/accounts/${presetAccount1Address}/activities?cursor=3-3-1&limit=1`,
          prev: null,
        },
        middleware,
      );
      expect(res).to.eql(expectedRes);
    });

    it('gets second page', async () => {
      const res = await middleware.requestByPath<MiddlewarePage<Activity>>(
        `/v3/accounts/${presetAccount1Address}/activities?cursor=3-3-1&limit=1`,
      );
      const expectedRes: typeof res = new MiddlewarePage<Activity>(
        {
          data: (await middleware.getAccountActivities(presetAccount1Address)).data.slice(1, 2),
          next: `/v3/accounts/${presetAccount1Address}/activities?cursor=3-3-0&limit=1`,
          prev: `/v3/accounts/${presetAccount1Address}/activities?cursor=11-11-0&limit=1&rev=1`,
        },
        middleware,
      );
      expect(res).to.eql(expectedRes);
    });
  });

  describe('pagination', () => {
    it('nevigates to the next page', async () => {
      const first = await middleware.getTransactions({ limit: 1 });
      const res = await first.next();
      const expectedRes: typeof res = new MiddlewarePage<Transaction>(
        {
          data: (await middleware.getTransactions()).data.slice(1, 2),
          next: '/v3/transactions?cursor=8&limit=1',
          prev: '/v3/transactions?cursor=10&limit=1&rev=1',
        },
        middleware,
      );
      expect(res).to.eql(expectedRes);
    });

    it('nevigates to the previous page', async () => {
      const first = await middleware.getTransactions({ limit: 1 });
      const second = await first.next();
      const res = await second.prev();
      expect(res).to.eql(first);
      expect(res.prevPath).to.eql(null);
      const expectedRes: typeof res = new MiddlewarePage<Transaction>(
        {
          data: (await middleware.getTransactions()).data.slice(0, 1),
          next: '/v3/transactions?cursor=9&limit=1',
          prev: null,
        },
        middleware,
      );
      expect(res).to.eql(expectedRes);
    });

    it('fails to navigate out of page range', async () => {
      const first = await middleware.getTransactions({ limit: 1 });
      await expect(first.prev()).to.be.rejectedWith(
        MiddlewarePageMissed,
        'There is no previous page',
      );
    });
  });
});
