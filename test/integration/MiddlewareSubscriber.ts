import { describe, it, beforeEach } from 'mocha';
import { expect } from 'chai';
import { spy } from 'sinon';
import WebSocket from 'isomorphic-ws';
import '../index';
import { assertNotNull } from '../utils';
import resetMiddleware from './reset-middleware';
import {
  MiddlewareSubscriber,
  MiddlewareSubscriberError,
  MiddlewareSubscriberDisconnected,
  MemoryAccount,
  AeSdkMethods,
} from '../../src';
import { pause } from '../../src/utils/other';

describe('MiddlewareSubscriber', () => {
  let middleware: MiddlewareSubscriber;
  let aeSdk: AeSdkMethods;
  const address = 'ak_21A27UVVt3hDkBE5J7rhhqnH5YNb4Y1dqo4PnSybrH85pnWo7E';

  beforeEach(async () => {
    aeSdk = await resetMiddleware();
    middleware = new MiddlewareSubscriber('ws://localhost:4001/v2/websocket');
  });

  it('fails to connect to invalid url', async () => {
    middleware = new MiddlewareSubscriber('ws://localhost:4000/api');
    const promise = new Promise((resolve, reject) => {
      middleware.subscribeKeyBlocks((payload, error) => {
        if (error != null) reject(error);
        else resolve(payload);
      });
    });
    await expect(promise).to.be.rejectedWith('Unexpected server response: 200');
    expect(middleware.webSocket).to.be.equal(undefined);
  });

  it('fails to subscribe to invalid address', async () => {
    let unsubscribe: (() => void) | undefined;
    const promise = new Promise((resolve, reject) => {
      unsubscribe = middleware.subscribeObject('ak_test', (payload, error) => {
        if (error != null) reject(error);
        else resolve(payload);
      });
    });
    await expect(promise).to.be.rejectedWith(MiddlewareSubscriberError, 'invalid target: ak_test');
    assertNotNull(unsubscribe);
    unsubscribe();
  });

  async function ensureConnected(ms: MiddlewareSubscriber): Promise<void> {
    return Promise.race([
      (async () => {
        while (ms.webSocket?.readyState !== WebSocket.OPEN) {
          await pause(100);
        }
      })(),
      pause(500).then(() => {
        throw new Error('Timeout');
      }),
    ]);
  }

  it('reconnects if subscribed again', async () => {
    expect(middleware.webSocket).to.be.equal(undefined);
    let unsubscribe = middleware.subscribeTransactions(() => {});
    await ensureConnected(middleware);
    assertNotNull(middleware.webSocket);
    unsubscribe();
    expect(middleware.webSocket).to.be.equal(undefined);

    unsubscribe = middleware.subscribeTransactions(() => {});
    await ensureConnected(middleware);
    assertNotNull(middleware.webSocket);
    unsubscribe();
    expect(middleware.webSocket).to.be.equal(undefined);
  });

  it('can be reconnected', async () => {
    const handleTx = spy();
    const unsubscribe = middleware.subscribeTransactions(handleTx);
    await ensureConnected(middleware);
    assertNotNull(middleware.webSocket);
    middleware.webSocket.close();
    await new Promise((resolve) => {
      assertNotNull(middleware.webSocket);
      middleware.webSocket.addEventListener('close', resolve);
    });
    expect(handleTx.callCount).to.be.equal(1);
    expect(handleTx.firstCall.args[0]).to.be.equal(undefined);
    expect(handleTx.firstCall.args[1]).to.be.instanceOf(MiddlewareSubscriberDisconnected);
    expect(middleware.webSocket).to.be.equal(undefined);

    middleware.reconnect();
    await ensureConnected(middleware);
    assertNotNull(middleware.webSocket);
    unsubscribe();
    expect(handleTx.callCount).to.be.equal(1);
  });

  async function fetchNodeRaw(path: string): Promise<any> {
    const response = await fetch(`http://localhost:4013/v3/${path}`);
    if (response.status !== 200) throw new Error(`Unexpected status code: ${response.status}`);
    return response.json();
  }

  it('subscribes for new transactions', async () => {
    const [{ hash }, transaction] = await Promise.all([
      aeSdk.spend(1, address),
      new Promise<any>((resolve, reject) => {
        const unsubscribe = middleware.subscribeTransactions((payload, error) => {
          unsubscribe();
          if (error != null) reject(error);
          else resolve(payload);
        });
      }),
    ]);
    expect(transaction).to.be.eql({
      ...(await fetchNodeRaw(`transactions/${hash}`)),
      tx_index: transaction.tx_index,
      micro_index: transaction.micro_index,
      micro_time: transaction.micro_time,
    });
  });

  it('subscribes for account', async () => {
    const [{ hash }, transaction] = await Promise.all([
      aeSdk.spend(1, address),
      new Promise<any>((resolve, reject) => {
        const unsubscribe = middleware.subscribeObject(address, (payload, error) => {
          unsubscribe();
          if (error != null) reject(error);
          else resolve(payload);
        });
      }),
    ]);
    expect(transaction).to.be.eql({
      ...(await fetchNodeRaw(`transactions/${hash}`)),
      tx_index: transaction.tx_index,
      micro_index: transaction.micro_index,
      micro_time: transaction.micro_time,
    });
  });

  it('subscribes for different accounts', async () => {
    const account2 = MemoryAccount.generate();
    const address2 = account2.address;
    const events1: any[] = [];
    const events2: any[] = [];
    const unsubscribe1 = middleware.subscribeObject(address, (payload) => events1.push(payload));
    const unsubscribe2 = middleware.subscribeObject(address2, (payload) => events2.push(payload));
    const tx1 = await aeSdk.spend(1e14, address2);
    const [tx2, tx3] = await Promise.all([
      aeSdk.spend(1, account2.address, { onAccount: account2 }),
      aeSdk.spend(1, address),
    ]);
    while (events1.length !== 2 || events2.length !== 2) {
      await pause(0);
    }
    unsubscribe1();
    unsubscribe2();
    expect(events1.map((ev) => ev.hash)).to.be.eql([tx1.hash, tx3.hash]);
    expect(events2.map((ev) => ev.hash)).to.be.eql([tx1.hash, tx2.hash]);
  });

  it('subscribes for micro block', async () => {
    const height = await aeSdk.getHeight();
    const [{ blockHash }, microBlock] = await Promise.all([
      aeSdk.spend(1, address),
      new Promise((resolve, reject) => {
        const unsubscribe = middleware.subscribeMicroBlocks((payload, error) => {
          if (payload?.height < height) return;
          unsubscribe();
          if (error != null) reject(error);
          else resolve(payload);
        });
      }),
    ]);
    expect(microBlock).to.be.eql({
      ...(await fetchNodeRaw(`micro-blocks/hash/${blockHash}/header`)),
      transactions_count: 1,
      micro_block_index: 0,
    });
  });

  it('subscribes simultaneously for micro block', async () => {
    const [{ hash, blockHash }, transaction, microBlock] = await Promise.all([
      aeSdk.spend(1, address),
      new Promise<any>((resolve, reject) => {
        const unsubscribe = middleware.subscribeTransactions((payload, error) => {
          expect(middleware.webSocket).to.be.not.equal(undefined);
          unsubscribe();
          if (error != null) reject(error);
          else resolve(payload);
        });
      }),
      new Promise((resolve, reject) => {
        const unsubscribe = middleware.subscribeMicroBlocks((payload, error) => {
          unsubscribe();
          if (error != null) reject(error);
          else resolve(payload);
        });
      }),
    ]);
    expect(transaction).to.be.eql({
      ...(await fetchNodeRaw(`transactions/${hash}`)),
      tx_index: transaction.tx_index,
      micro_index: transaction.micro_index,
      micro_time: transaction.micro_time,
    });
    expect(microBlock).to.be.eql({
      ...(await fetchNodeRaw(`micro-blocks/hash/${blockHash}/header`)),
      transactions_count: 1,
      micro_block_index: 0,
    });
  });
});
