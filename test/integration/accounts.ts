/*
 * ISC License (ISC)
 * Copyright (c) 2021 aeternity developers
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
import BigNumber from 'bignumber.js';
import { getSdk } from '.';
import { generateKeyPair } from '../../src/utils/crypto';
import MemoryAccount from '../../src/account/Memory';
import { AE_AMOUNT_FORMATS } from '../../src/utils/amount-formatter';
import {
  UnavailableAccountError,
  TypeError,
  ArgumentError,
  InvalidKeypairError,
  InvalidTxParamsError,
  UnexpectedTsError,
} from '../../src/utils/errors';
import { AeSdk } from '../../src';

describe('Accounts', () => {
  let aeSdk: AeSdk;
  let aeSdkNoCoins: AeSdk;
  const receiverKey = generateKeyPair();
  const receiver = receiverKey.publicKey;

  before(async () => {
    aeSdk = await getSdk(2);
    aeSdkNoCoins = await getSdk(0);
    await aeSdkNoCoins
      .addAccount(new MemoryAccount({ keypair: generateKeyPair() }), { select: true });
  });

  it('removes account', async () => {
    const [address] = aeSdk.addresses();
    const account = aeSdk.accounts[address];
    aeSdk.removeAccount(address);
    expect(Object.keys(aeSdk.accounts)).to.have.length(1);
    expect(aeSdk.selectedAddress).to.be.equal(undefined);
    await aeSdk.addAccount(account, { select: true });
  });

  it('determining the balance with 0 balance', async () => {
    await aeSdkNoCoins.getBalance(await aeSdkNoCoins.address()).should.eventually.be.equal('0');
  });

  it('spending coins with 0 balance', async () => {
    await aeSdkNoCoins.spend(1, receiver).should.be.rejectedWith(Error);
  });

  it('spending negative amount of coins', () => expect(aeSdk.spend(-1, receiver))
    .to.be.rejectedWith(InvalidTxParamsError, 'Transaction build error. {"amount":"-1 must be >= 0"}'));

  it('determines the balance using `balance`', async () => {
    await aeSdk.getBalance(await aeSdk.address()).should.eventually.be.a('string');
  });

  describe('transferFunds', () => {
    const spend = async (fraction: number): Promise<{
      balanceBefore: BigNumber;
      balanceAfter: BigNumber;
      amount: BigNumber;
      fee: BigNumber;
    }> => {
      const balanceBefore = new BigNumber(await aeSdk.getBalance(await aeSdk.address()));
      const { tx } = await aeSdk.transferFunds(fraction, receiver);
      const balanceAfter = new BigNumber(await aeSdk.getBalance(await aeSdk.address()));
      if (tx == null || tx.amount == null) throw new UnexpectedTsError();
      return {
        balanceBefore,
        balanceAfter,
        amount: new BigNumber(tx.amount.toString()),
        fee: new BigNumber(tx.fee.toString()),
      };
    };

    it('throws exception if fraction is out of range', () => aeSdk.transferFunds(-1, receiver)
      .should.be.rejectedWith(ArgumentError, 'fraction should be a number between 0 and 1, got -1 instead'));

    it('spends 0% of balance', async () => {
      const { balanceBefore, balanceAfter, amount } = await spend(0);
      balanceBefore.should.be.not.eql(balanceAfter);
      amount.isZero().should.be.equal(true);
    });

    it('spends 68.97% of balance', async () => {
      const {
        balanceBefore, balanceAfter, amount, fee,
      } = await spend(0.6897);
      balanceBefore.times(0.6897).integerValue(BigNumber.ROUND_HALF_UP).should.be.eql(amount);
      balanceAfter.plus(amount).plus(fee).should.be.eql(balanceBefore);
    });

    it('spends 100% of balance', async () => {
      const {
        balanceBefore, balanceAfter, amount, fee,
      } = await spend(1);
      amount.plus(fee).should.be.eql(balanceBefore);
      balanceAfter.isZero().should.be.equal(true);
    });

    it('accepts onAccount option', async () => {
      await aeSdk.transferFunds(1, await aeSdk.address(), { onAccount: receiverKey });
      new BigNumber(await aeSdk.getBalance(receiver)).isZero().should.be.equal(true);
    });
  });

  it('spends coins', async () => {
    const ret = await aeSdk.spend(1, receiver);
    ret.should.have.property('tx');
    if (ret.tx == null) throw new UnexpectedTsError();
    ret.tx.should.include({ amount: 1n, recipientId: receiver });
  });

  it('spends coins in AE format', async () => {
    const ret = await aeSdk.spend(1, receiver, { denomination: AE_AMOUNT_FORMATS.AE });
    ret.should.have.property('tx');
    if (ret.tx == null) throw new UnexpectedTsError();
    ret.tx.should.include({ amount: 10n ** 18n, recipientId: receiver });
  });

  it('spends big amount of coins', async () => {
    const bigAmount = 10n ** 31n + 10n ** 17n;
    const { publicKey } = generateKeyPair();
    const ret = await aeSdk.spend(bigAmount.toString(), publicKey);

    const balanceAfter = await aeSdk.getBalance(publicKey);
    balanceAfter.should.be.equal(bigAmount.toString());
    ret.should.have.property('tx');
    if (ret.tx == null) throw new UnexpectedTsError();
    ret.tx.should.include({ amount: bigAmount, recipientId: publicKey });
  });

  it('Get Account by block height/hash', async () => {
    await aeSdk.awaitHeight(await aeSdk.getHeight() + 3);
    const spend = await aeSdk.spend(123, 'ak_DMNCzsVoZnpV5fe8FTQnNsTfQ48YM5C3WbHPsJyHjAuTXebFi');
    if (spend.blockHeight == null || spend.tx?.amount == null) throw new UnexpectedTsError();
    await aeSdk.awaitHeight(spend.blockHeight + 2);
    const accountAfterSpend = await aeSdk.getAccount(await aeSdk.address());
    const accountBeforeSpendByHash = await aeSdk
      .getAccount(await aeSdk.address(), { height: spend.blockHeight - 1 });
    expect(accountBeforeSpendByHash.balance - accountAfterSpend.balance).to.be
      .equal(spend.tx.fee + spend.tx.amount);
  });

  describe('Make operation on specific account without changing of current account', () => {
    it('Can make spend on specific account', async () => {
      const current = await aeSdk.address();
      const accounts = aeSdk.addresses();
      const onAccount = accounts.find((acc) => acc !== current);

      const { tx } = await aeSdk.spend(1, await aeSdk.address(), { onAccount });
      if (tx?.senderId == null) throw new UnexpectedTsError();
      tx.senderId.should.be.equal(onAccount);
      current.should.be.equal(current);
    });

    it('Fail on invalid account', async () => {
      await expect(aeSdk.spend(1, await aeSdk.address(), { onAccount: 1 as any }))
        .to.be.rejectedWith(
          TypeError,
          'Account should be an address (ak-prefixed string), keypair, or instance of AccountBase, got 1 instead',
        );
    });

    it('Fail on non exist account', async () => {
      await expect(aeSdk.spend(1, await aeSdk.address(), { onAccount: 'ak_q2HatMwDnwCBpdNtN9oXf5gpD9pGSgFxaa8i2Evcam6gjiggk' }))
        .to.be.rejectedWith(
          UnavailableAccountError,
          'Account for ak_q2HatMwDnwCBpdNtN9oXf5gpD9pGSgFxaa8i2Evcam6gjiggk not available',
        );
    });

    it('Fail on no accounts', async () => {
      const aeSdkWithoutAccount = await getSdk(0);
      await expect(aeSdkWithoutAccount.spend(1, await aeSdk.address()))
        .to.be.rejectedWith(
          TypeError,
          'Account should be an address (ak-prefixed string), keypair, or instance of AccountBase, got undefined instead',
        );
    });

    it('Invalid on account options', async () => {
      await expect(aeSdk.sign('tx_Aasdasd', { onAccount: 123 }))
        .to.be.rejectedWith(
          TypeError,
          'Account should be an address (ak-prefixed string), keypair, or instance of AccountBase, got 123 instead',
        );
    });
    it('Make operation on account using keyPair/MemoryAccount', async () => {
      const keypair = generateKeyPair();
      const memoryAccount = new MemoryAccount({ keypair });
      const data = 'Hello';
      const signature = await memoryAccount.sign(data);
      const sigUsingKeypair = await aeSdk.sign(data, { onAccount: keypair });
      const sigUsingMemoryAccount = await aeSdk.sign(data, { onAccount: memoryAccount });
      signature.toString().should.be.equal(sigUsingKeypair.toString());
      signature.toString().should.be.equal(sigUsingMemoryAccount.toString());
      // address
      const addressFromKeypair = await aeSdk.address({ onAccount: keypair });
      const addressFrommemoryAccount = await aeSdk.address({ onAccount: memoryAccount });
      addressFromKeypair.should.be.equal(keypair.publicKey);
      addressFrommemoryAccount.should.be.equal(keypair.publicKey);
    });
    it('Make operation on account using keyPair: Invalid keypair', async () => {
      const keypair = generateKeyPair();
      keypair.publicKey = 'ak_bev1aPMdAeJTuUiCJ7mHbdQiAizrkRGgoV9FfxHYb6pAxo5WY';
      const data = 'Hello';
      await expect(aeSdk.sign(data, { onAccount: keypair })).to.be.rejectedWith(InvalidKeypairError, 'Invalid Key Pair');
      await expect(aeSdk.address({ onAccount: keypair })).to.be.rejectedWith(InvalidKeypairError, 'Invalid Key Pair');
    });
  });

  it('spend without waiting for mining', async () => {
    const th = await aeSdk.spend(1, receiver, { waitMined: false });
    th.should.be.a('object');
    th.hash.slice(0, 3).should.equal('th_');
  });
});
