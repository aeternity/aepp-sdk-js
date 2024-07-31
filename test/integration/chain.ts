import { describe, it, before } from 'mocha';
import { expect } from 'chai';
import { stub } from 'sinon';
import { getSdk, timeoutBlock } from '.';
import {
  AeSdk, Tag, MemoryAccount, Encoded, Node, Contract,
} from '../../src';
import { assertNotNull, bindRequestCounter } from '../utils';

describe('Node Chain', () => {
  let aeSdk: AeSdk;
  let aeSdkWithoutAccount: AeSdk;
  const recipient = MemoryAccount.generate().address;

  before(async () => {
    aeSdk = await getSdk();
    aeSdkWithoutAccount = await getSdk(0);
  });

  describe('getHeight', () => {
    it('determines the height', async () => {
      expect(await aeSdkWithoutAccount.getHeight()).to.be.a('number');
    });

    it('combines height queries', async () => {
      const getCount = bindRequestCounter(aeSdk.api);
      const heights = await Promise.all(
        new Array(5).fill(undefined).map(async () => aeSdk.getHeight()),
      );
      expect(heights).to.eql(heights.map(() => heights[0]));
      expect(getCount()).to.be.equal(1);
    });

    it('returns height from cache', async () => {
      const height = await aeSdk.getHeight();
      const getCount = bindRequestCounter(aeSdk.api);
      expect(await aeSdk.getHeight({ cached: true })).to.be.equal(height);
      expect(getCount()).to.be.equal(0);
    });

    it('returns not cached height if network changed', async () => {
      const height = await aeSdk.getHeight();
      aeSdk.addNode('test-2', new Node(`${aeSdk.api.$host}/`), true);
      const getCount = bindRequestCounter(aeSdk.api);
      expect(await aeSdk.getHeight({ cached: true })).to.be.equal(height);
      expect(getCount()).to.be.equal(2); // status, height
      aeSdk.selectNode('test');
      aeSdk.pool.delete('test-2');
    });

    it('uses correct cache key if node changed while doing request', async () => {
      const heightPromise = aeSdk.getHeight();
      aeSdk.addNode('test-2', new Node('https://test.stg.aepps.com'), true);
      await heightPromise;
      await expect(aeSdk.getHeight({ cached: true }))
        .to.be.rejectedWith('v3/status error: 404 status code');
      aeSdk.selectNode('test');
    });
  });

  it('waits for specified heights', async () => {
    const target = await aeSdkWithoutAccount.getHeight() + 1;
    await aeSdkWithoutAccount.awaitHeight(target).should.eventually.be.at.least(target);
    await aeSdkWithoutAccount.getHeight().should.eventually.be.at.least(target);
  }).timeout(timeoutBlock);

  it('Can verify transaction from broadcast error', async () => {
    const error = await aeSdk
      .spend(0, recipient, { ttl: 1, absoluteTtl: true, verify: false })
      .catch((e) => e);
    expect(await error.verifyTx()).to.have.lengthOf(1);
  });

  it('Get current generation', async () => {
    const generation = await aeSdkWithoutAccount.getCurrentGeneration();
    generation.should.has.property('keyBlock');
  });

  it('Get key block', async () => {
    const { keyBlock } = await aeSdkWithoutAccount.getCurrentGeneration();
    // TODO type should be corrected in node api
    const keyBlockByHash = await aeSdkWithoutAccount
      .getKeyBlock(keyBlock.hash as Encoded.KeyBlockHash);
    const keyBlockByHeight = await aeSdkWithoutAccount.getKeyBlock(keyBlock.height);
    keyBlockByHash.should.be.an('object');
    keyBlockByHeight.should.be.an('object');
  });

  it('Get generation', async () => {
    const { keyBlock } = await aeSdkWithoutAccount.getCurrentGeneration();
    // TODO type should be corrected in node api
    const genByHash = await aeSdkWithoutAccount
      .getGeneration(keyBlock.hash as Encoded.KeyBlockHash);
    const genByHeight = await aeSdkWithoutAccount.getGeneration(keyBlock.height);
    genByHash.should.be.an('object');
    genByHeight.should.be.an('object');
  });

  it('polls for transactions', async () => {
    const tx = await aeSdk.buildTx({
      tag: Tag.SpendTx,
      amount: 1,
      senderId: aeSdk.address,
      recipientId: recipient,
    });
    const signed = await aeSdk.signTransaction(tx);
    const { txHash } = await aeSdk.api.postTransaction({ tx: signed });

    await aeSdk.poll(txHash).should.eventually.be.fulfilled;
    await aeSdk.poll('th_xxx', { blocks: 1 }).should.eventually.be.rejected;
  });

  it('Wait for transaction confirmation', async () => {
    const res = await aeSdk.spend(1000, aeSdk.address, { confirm: 1 });
    assertNotNull(res.blockHeight);
    expect(await aeSdk.getHeight() >= res.blockHeight + 1).to.be.equal(true);
  }).timeout(timeoutBlock);

  it('doesn\'t make extra requests', async () => {
    let getCount;
    let hash;

    await aeSdk.getHeight({ cached: false });
    getCount = bindRequestCounter(aeSdk.api);
    hash = (await aeSdk.spend(100, recipient, { waitMined: false, verify: false })).hash;
    expect(getCount()).to.be.equal(2); // nonce, post tx
    await aeSdk.poll(hash);

    await aeSdk.getHeight({ cached: false });
    getCount = bindRequestCounter(aeSdk.api);
    hash = (await aeSdk.spend(100, recipient, { waitMined: false, verify: false })).hash;
    expect(getCount()).to.be.equal(2); // nonce, post tx
    await aeSdk.poll(hash);

    await aeSdk.getHeight({ cached: false });
    getCount = bindRequestCounter(aeSdk.api);
    hash = (await aeSdk.spend(100, recipient, { waitMined: false })).hash;
    expect(getCount()).to.be.equal(6); // nonce, validator(acc, recipient, height, status), post tx
    await aeSdk.poll(hash);
  });

  const accounts = new Array(10).fill(undefined).map(() => MemoryAccount.generate());
  const transactions: Encoded.TxHash[] = [];

  const txPostRetry = '/v3/transactions?__sdk-retry=';
  it('multiple spends from one account', async () => {
    const { nextNonce } = await aeSdk.api.getAccountNextNonce(aeSdk.address);
    await aeSdk.getHeight({ cached: false });
    const getCount = bindRequestCounter(aeSdk.api);
    const spends = await Promise.all(accounts.map(async (account, idx) => aeSdk.spend(
      Math.floor(Math.random() * 1000 + 1e15),
      account.address,
      { nonce: nextNonce + idx, verify: false, waitMined: false },
    )));
    transactions.push(...spends.map(({ hash }) => hash));
    const txPostCount = accounts.length;
    expect(getCount({ exclude: [txPostRetry] })).to.be.equal(txPostCount);
  });

  it('multiple spends from different accounts', async () => {
    await aeSdkWithoutAccount.spend(0, aeSdk.address, {
      onAccount: Object.values(aeSdk.accounts)[0],
    });
    const s = stub(aeSdkWithoutAccount._options, '_expectedMineRate').value(60_000);
    const getCount = bindRequestCounter(aeSdkWithoutAccount.api);
    const spends = await Promise.all(
      accounts.map(async (onAccount) => aeSdkWithoutAccount.spend(1e14, aeSdk.address, {
        nonce: 1, verify: false, onAccount, waitMined: false,
      })),
    );
    s.restore();
    transactions.push(...spends.map(({ hash }) => hash));
    const txPostCount = accounts.length;
    expect(getCount()).to.be.equal(txPostCount);
  });

  it('ensure transactions mined', async () => Promise.all(transactions.map(async (hash) => aeSdkWithoutAccount.poll(hash))));

  it('multiple contract dry-runs calls at one request', async () => {
    const contract = await Contract.initialize<{ foo: (x: number) => bigint }>({
      ...aeSdk.getContext(),
      sourceCode:
        'contract Test =\n'
        + '  entrypoint foo(x : int) = x * 100',
    });
    await contract.$deploy([]);
    const { result } = await contract.foo(5);
    assertNotNull(result);
    const { gasUsed: gasLimit } = result;
    const { nextNonce } = await aeSdk.api.getAccountNextNonce(aeSdk.address);
    const getCount = bindRequestCounter(aeSdk.api);
    const numbers = new Array(32).fill(undefined).map((v, idx) => idx * 2);
    const results = (await Promise.all(
      numbers.map(async (v, idx) => contract
        .foo(v, { nonce: nextNonce + idx, gasLimit, combine: true })),
    )).map((r) => r.decodedResult);
    expect(results).to.be.eql(numbers.map((v) => BigInt(v * 100)));
    expect(getCount()).to.be.equal(1);
  });
});
