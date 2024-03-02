import { describe, it, before } from 'mocha';
import { expect } from 'chai';
import { getSdk, url } from '.';
import {
  NodeGateway, AeSdk, Tag, buildTx, Encoded,
} from '../../src';
import { bindRequestCounter } from '../utils';

describe('NodeGateway', () => {
  let aeSdk: AeSdk;
  const node = new NodeGateway(url, { retryCount: 2, retryOverallDelay: 500 });
  node.pipeline.addPolicy({
    name: 'swallow-post-tx-request',
    async sendRequest(request, next) {
      const suffix = 'transactions?int-as-string=true';
      if (!request.url.endsWith(suffix)) return next(request);
      request.url = request.url.replace(suffix, 'status');
      request.method = 'GET';
      delete request.body;
      const response = await next(request);
      response.bodyAsText = '{"tx_hash": "fake"}';
      return response;
    },
  });
  let spendTxHighNonce: Encoded.Transaction;

  before(async () => {
    aeSdk = await getSdk();
    const spendTx = buildTx({
      tag: Tag.SpendTx, recipientId: aeSdk.address, senderId: aeSdk.address, nonce: 1e10,
    });
    spendTxHighNonce = await aeSdk.signTransaction(spendTx);
  });

  it('doesn\'t retries getAccountByPubkey before seeing a transaction', async () => {
    const getCount = bindRequestCounter(node);
    await node.getAccountByPubkey(aeSdk.address);
    expect(getCount()).to.be.equal(1);
  });

  it('doesn\'t retries getAccountNextNonce before seeing a transaction', async () => {
    const getCount = bindRequestCounter(node);
    await node.getAccountNextNonce(aeSdk.address);
    expect(getCount()).to.be.equal(1);
  });

  it('retries getAccountByPubkey', async () => {
    await node.postTransaction({ tx: spendTxHighNonce });
    const getCount = bindRequestCounter(node);
    await node.getAccountByPubkey(aeSdk.address);
    expect(getCount()).to.be.equal(3);
  });

  it('retries getAccountNextNonce once for multiple calls', async () => {
    await node.postTransaction({ tx: spendTxHighNonce });
    const getCount = bindRequestCounter(node);
    const nonces = await Promise.all(
      new Array(3).fill(undefined).map(async () => node.getAccountNextNonce(aeSdk.address)),
    );
    expect(getCount()).to.be.equal(3);
    expect(nonces).to.be.eql(nonces.map(() => ({ nextNonce: 1 })));
  });

  it('doesn\'t retries nonce for generalized account', async () => {
    const sourceCode = `contract BlindAuth =
      stateful entrypoint authorize() : bool = false`;
    await aeSdk.createGeneralizedAccount('authorize', [], { sourceCode });
    await node.postTransaction({ tx: spendTxHighNonce });

    const getCount = bindRequestCounter(node);
    await node.getAccountByPubkey(aeSdk.address);
    await node.getAccountNextNonce(aeSdk.address);
    expect(getCount()).to.be.equal(2);
  });
});
