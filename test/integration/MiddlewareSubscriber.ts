import {
  describe, it, before, beforeEach,
} from 'mocha';
import { expect } from 'chai';
import { spy } from 'sinon';
import '../index';
import { assertNotNull } from '../utils';
import {
  _MiddlewareSubscriber, _MiddlewareSubscriberError, _MiddlewareSubscriberDisconnected,
  MemoryAccount, AeSdkMethods, Node,
} from '../../src';
import { pause } from '../../src/utils/other';

describe('MiddlewareSubscriber', () => {
  let middleware: _MiddlewareSubscriber;
  // TODO: remove after solving https://github.com/aeternity/ae_mdw/issues/1336
  const account = MemoryAccount.generate();
  const aeSdk = new AeSdkMethods({
    onNode: new Node('https://testnet.aeternity.io'),
    onAccount: account,
  });

  before(async () => {
    const { status } = await fetch(
      `https://faucet.aepps.com/account/${account.address}`,
      { method: 'POST' },
    );
    console.assert([200, 425].includes(status), 'Invalid faucet response code', status);
  });

  beforeEach(async () => {
    middleware = new _MiddlewareSubscriber('wss://testnet.aeternity.io/mdw/websocket');
  });

  it('fails to connect to invalid url', async () => {
    middleware = new _MiddlewareSubscriber('wss://testnet.aeternity.io/mdw/api');
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
    const promise = new Promise((resolve, reject) => {
      middleware.subscribeObject('ak_test', (payload, error) => {
        if (error != null) reject(error);
        else resolve(payload);
      });
    });
    await expect(promise).to.be.rejectedWith(_MiddlewareSubscriberError, 'invalid target: ak_test');
  });

  async function ensureConnected(ms: _MiddlewareSubscriber): Promise<void> {
    return Promise.race([
      (async () => {
        while (ms.webSocket?.bufferedAmount !== 0) {
          await pause(100);
        }
        await new Promise((resolve) => {
          assertNotNull(ms.webSocket);
          ms.webSocket.addEventListener('message', resolve);
        });
      })(),
      pause(4000).then(() => { throw new Error('Timeout'); }),
    ]);
  }

  it('reconnects if subscribed again', async () => {
    expect(middleware.webSocket).to.be.equal(undefined);
    let unsubscribe = middleware.subscribeTransactions(() => {});
    await ensureConnected(middleware);
    expect(middleware.webSocket).to.be.not.equal(undefined);
    unsubscribe();
    expect(middleware.webSocket).to.be.equal(undefined);

    unsubscribe = middleware.subscribeTransactions(() => {});
    await ensureConnected(middleware);
    expect(middleware.webSocket).to.be.not.equal(undefined);
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
    expect(handleTx.firstCall.args[1]).to.be.instanceOf(_MiddlewareSubscriberDisconnected);
    expect(middleware.webSocket).to.be.equal(undefined);

    middleware.reconnect();
    await ensureConnected(middleware);
    expect(middleware.webSocket).to.not.be.equal(undefined);
    unsubscribe();
    expect(handleTx.callCount).to.be.equal(1);
  });

  async function fetchNodeRaw(path: string): Promise<any> {
    const response = await fetch(`https://testnet.aeternity.io/v3/${path}`);
    if (response.status !== 200) throw new Error(`Unexpected status code: ${response.status}`);
    return response.json();
  }

  // TODO: enable after solving https://github.com/aeternity/ae_mdw/issues/1336
  it.skip('subscribes for new transactions', async () => {
    const [{ hash }, transaction] = await Promise.all([
      aeSdk.spend(1, account.address),
      new Promise((resolve, reject) => {
        const unsubscribe = middleware.subscribeTransactions((payload, error) => {
          unsubscribe();
          if (error != null) reject(error);
          else resolve(payload);
        });
      }),
    ]);
    expect(transaction).to.be.eql(await fetchNodeRaw(`transactions/${hash}`));
  }).timeout(80_000);

  // TODO: enable after fixing https://github.com/aeternity/ae_mdw/issues/1337
  it.skip('subscribes for account', async () => {
    const { hash } = await aeSdk.spend(1, account.address);
    const transaction = await new Promise((resolve, reject) => {
      const unsubscribe = middleware.subscribeObject(account.address, (payload, error) => {
        unsubscribe();
        if (error != null) reject(error);
        else resolve(payload);
      });
    });
    expect(transaction).to.be.eql(await fetchNodeRaw(`transactions/${hash}`));
  }).timeout(80_000);

  // TODO: enable after solving https://github.com/aeternity/ae_mdw/issues/1336
  it.skip('subscribes for micro block', async () => {
    const [{ blockHash }, microBlock] = await Promise.all([
      aeSdk.spend(1, account.address),
      new Promise((resolve, reject) => {
        const unsubscribe = middleware.subscribeMicroBlocks((payload, error) => {
          unsubscribe();
          if (error != null) reject(error);
          else resolve(payload);
        });
      }),
    ]);
    expect(microBlock).to.be.eql(await fetchNodeRaw(`micro-blocks/hash/${blockHash}/header`));
  }).timeout(80_000);

  // TODO: enable after solving https://github.com/aeternity/ae_mdw/issues/1336
  it.skip('subscribes simultaneously for micro block', async () => {
    const [{ hash, blockHash }, transaction, microBlock] = await Promise.all([
      aeSdk.spend(1, account.address),
      new Promise((resolve, reject) => {
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
    expect(transaction).to.be.eql(await fetchNodeRaw(`transactions/${hash}`));
    expect(microBlock).to.be.eql(await fetchNodeRaw(`micro-blocks/hash/${blockHash}/header`));
  }).timeout(80_000);
});
