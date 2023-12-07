import { describe, it, before } from 'mocha';
import { expect } from 'chai';
import { PipelineRequest, PipelineResponse, SendRequest } from '@azure/core-rest-pipeline';
import { getSdk } from '.';
import {
  generateKeyPair, AeSdk, Tag, UnexpectedTsError, MemoryAccount, Encoded, Contract,
} from '../../src';
import { assertNotNull } from '../utils';

describe('Node Chain', () => {
  let aeSdk: AeSdk;
  let aeSdkWithoutAccount: AeSdk;
  const { publicKey } = generateKeyPair();

  function resetRequestCounter(): () => number {
    let counter = 0;
    [aeSdk, aeSdkWithoutAccount].forEach((sdk) => {
      sdk.api.pipeline.removePolicy({ name: 'counter' });
      sdk.api.pipeline.addPolicy({
        name: 'counter',
        async sendRequest(request: PipelineRequest, next: SendRequest): Promise<PipelineResponse> {
          counter += 1;
          return next(request);
        },
      }, { phase: 'Deserialize' });
    });
    return () => counter;
  }

  before(async () => {
    aeSdk = await getSdk();
    aeSdkWithoutAccount = await getSdk(0);
  });

  it('determines the height', async () => {
    expect(await aeSdkWithoutAccount.getHeight()).to.be.a('number');
  });

  it('combines height queries', async () => {
    const getCount = resetRequestCounter();
    const heights = await Promise.all(
      new Array(5).fill(undefined).map(async () => aeSdk.getHeight()),
    );
    expect(heights).to.eql(heights.map(() => heights[0]));
    expect(getCount()).to.be.equal(1);
  });

  it('waits for specified heights', async () => {
    const target = await aeSdkWithoutAccount.getHeight() + 1;
    await aeSdkWithoutAccount.awaitHeight(target).should.eventually.be.at.least(target);
    await aeSdkWithoutAccount.getHeight().should.eventually.be.at.least(target);
  });

  it('Can verify transaction from broadcast error', async () => {
    const error = await aeSdk
      .spend(0, publicKey, { ttl: 1, absoluteTtl: true, verify: false })
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
      recipientId: publicKey,
    });
    const signed = await aeSdk.signTransaction(tx);
    const { txHash } = await aeSdk.api.postTransaction({ tx: signed });

    await aeSdk.poll(txHash).should.eventually.be.fulfilled;
    await aeSdk.poll('th_xxx', { blocks: 1 }).should.eventually.be.rejected;
  });

  it('Wait for transaction confirmation', async () => {
    const txData = await aeSdk.spend(1000, aeSdk.address, { confirm: true });
    if (txData.blockHeight == null) throw new UnexpectedTsError();
    const isConfirmed = (await aeSdk.getHeight()) >= txData.blockHeight + 3;

    isConfirmed.should.be.equal(true);

    const txData2 = await aeSdk.spend(1000, aeSdk.address, { confirm: 4 });
    if (txData2.blockHeight == null) throw new UnexpectedTsError();
    const isConfirmed2 = (await aeSdk.getHeight()) >= txData2.blockHeight + 4;
    isConfirmed2.should.be.equal(true);
  });

  it('doesn\'t make extra requests', async () => {
    let getCount;
    let hash;
    getCount = resetRequestCounter();
    hash = (await aeSdk.spend(100, publicKey, { waitMined: false, verify: false })).hash;
    expect(getCount()).to.be.equal(2); // nonce, post tx
    await aeSdk.poll(hash);

    getCount = resetRequestCounter();
    hash = (await aeSdk.spend(100, publicKey, { waitMined: false, verify: false })).hash;
    expect(getCount()).to.be.equal(2); // nonce, post tx
    await aeSdk.poll(hash);

    getCount = resetRequestCounter();
    hash = (await aeSdk.spend(100, publicKey, { waitMined: false })).hash;
    expect(getCount()).to.be.equal(5); // nonce, validator(acc, height, status), post tx
    await aeSdk.poll(hash);
  });

  const accounts = new Array(10).fill(undefined).map(() => MemoryAccount.generate());
  const transactions: Encoded.TxHash[] = [];

  it('multiple spends from one account', async () => {
    const { nextNonce } = await aeSdk.api.getAccountNextNonce(aeSdk.address);
    const getCount = resetRequestCounter();
    const spends = await Promise.all(accounts.map(async (account, idx) => aeSdk.spend(
      Math.floor(Math.random() * 1000 + 1e16),
      account.address,
      { nonce: nextNonce + idx, verify: false, waitMined: false },
    )));
    transactions.push(...spends.map(({ hash }) => hash));
    const txPostCount = accounts.length;
    expect(getCount()).to.be.equal(txPostCount);
  });

  it('multiple spends from different accounts', async () => {
    const getCount = resetRequestCounter();
    const spends = await Promise.all(
      accounts.map(async (onAccount) => aeSdkWithoutAccount.spend(1e15, aeSdk.address, {
        nonce: 1, verify: false, onAccount, waitMined: false,
      })),
    );
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
    const getCount = resetRequestCounter();
    const numbers = new Array(32).fill(undefined).map((v, idx) => idx * 2);
    const results = (await Promise.all(
      numbers.map(async (v, idx) => contract
        .foo(v, { nonce: nextNonce + idx, gasLimit, combine: true })),
    )).map((r) => r.decodedResult);
    expect(results).to.be.eql(numbers.map((v) => BigInt(v * 100)));
    expect(getCount()).to.be.equal(2);
  });
});
