/*
 * ISC License (ISC)
 * Copyright (c) 2022 aeternity developers
 *
 *  Permission to use, copy, modify, and/or distribute this software for any
 *  purpose with or without fee is hereby granted, provided that the above
 *  copyright notice and this permission notice appear in all copies.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
 *  REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
 *  AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 *  INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
 *  LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
 *  OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
 *  PERFORMANCE OF THIS SOFTWARE.
 */
import { describe, it, before } from 'mocha';
import { expect } from 'chai';
import { spy } from 'sinon';
import http from 'http';
import { getSdk } from '.';
import {
  generateKeyPair, AeSdk, Tag, UnexpectedTsError, MemoryAccount,
} from '../../src';
import { Encoded } from '../../src/utils/encoder';
import { assertNotNull } from '../utils';

describe('Node Chain', () => {
  let aeSdk: AeSdk;
  let aeSdkWithoutAccount: AeSdk;
  const { publicKey } = generateKeyPair();

  before(async () => {
    aeSdk = await getSdk();
    aeSdkWithoutAccount = await getSdk(0);
  });

  it('determines the height', async () => {
    expect(await aeSdkWithoutAccount.getHeight()).to.be.a('number');
  });

  it('combines height queries', async () => {
    const httpSpy = spy(http, 'request');
    const heights = await Promise.all(
      new Array(5).fill(undefined).map(async () => aeSdk.getHeight()),
    );
    expect(heights).to.eql(heights.map(() => heights[0]));
    expect(httpSpy.callCount).to.be.equal(1);
    httpSpy.restore();
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
    const tx = await aeSdk.buildTx(Tag.SpendTx, {
      amount: 1,
      senderId: aeSdk.address,
      recipientId: publicKey,
      payload: '',
      ttl: Number.MAX_SAFE_INTEGER,
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
    const httpSpy = spy(http, 'request');
    await aeSdk.spend(100, publicKey, { waitMined: false, verify: false });
    expect(httpSpy.args.length).to.be.equal(2); // nonce, post tx
    httpSpy.resetHistory();

    await aeSdk.spend(100, publicKey, { waitMined: false, verify: false });
    expect(httpSpy.args.length).to.be.equal(2); // nonce, post tx
    httpSpy.resetHistory();

    await aeSdk.spend(100, publicKey, { waitMined: false });
    expect(httpSpy.args.length).to.be.equal(5); // nonce, validator(acc, height, status), post tx
    httpSpy.restore();
  });

  const accounts = new Array(10).fill(undefined).map(() => MemoryAccount.generate());
  const transactions: Encoded.TxHash[] = [];

  it('multiple spends from one account', async () => {
    const { nextNonce } = await aeSdk.api.getAccountNextNonce(aeSdk.address);
    const httpSpy = spy(http, 'request');
    const spends = await Promise.all(accounts.map(async (account, idx) => aeSdk.spend(
      Math.floor(Math.random() * 1000 + 1e16),
      account.address,
      { nonce: nextNonce + idx, verify: false, waitMined: false },
    )));
    transactions.push(...spends.map(({ hash }) => hash));
    const txPostCount = accounts.length;
    expect(httpSpy.args.length).to.be.equal(txPostCount);
    httpSpy.restore();
  });

  it('multiple spends from different accounts', async () => {
    const httpSpy = spy(http, 'request');
    const spends = await Promise.all(
      accounts.map(async (onAccount) => aeSdkWithoutAccount.spend(1e15, aeSdk.address, {
        nonce: 1, verify: false, onAccount, waitMined: false,
      })),
    );
    transactions.push(...spends.map(({ hash }) => hash));
    const txPostCount = accounts.length;
    expect(httpSpy.args.length).to.be.equal(txPostCount);
    httpSpy.restore();
  });

  it('ensure transactions mined', async () => Promise.all(transactions.map(async (hash) => aeSdkWithoutAccount.poll(hash))));

  it('multiple contract dry-runs calls at one request', async () => {
    const contract = await aeSdk.initializeContract<{ foo: (x: number) => bigint }>({
      sourceCode:
        'contract Test =\n'
        + '  entrypoint foo(x : int) = x * 100',
    });
    await contract.$deploy();
    const { result } = await contract.foo(5);
    assertNotNull(result);
    const { gasUsed: gasLimit } = result;
    const { nextNonce } = await aeSdk.api.getAccountNextNonce(aeSdk.address);
    const httpSpy = spy(http, 'request');
    const numbers = new Array(32).fill(undefined).map((v, idx) => idx * 2);
    const results = (await Promise.all(
      numbers.map(async (v, idx) => contract
        .foo(v, { nonce: nextNonce + idx, gasLimit, combine: true })),
    )).map((r) => r.decodedResult);
    expect(results).to.be.eql(numbers.map((v) => BigInt(v * 100)));
    expect(httpSpy.args.length).to.be.equal(2);
    httpSpy.restore();
  });
});
