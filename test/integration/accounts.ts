import { describe, it, before } from 'mocha';
import { expect } from 'chai';
import BigNumber from 'bignumber.js';
import { getSdk } from '.';
import {
  AeSdk, MemoryAccount,
  generateKeyPair,
  UnavailableAccountError, TypeError, ArgumentError, UnexpectedTsError,
} from '../../src';
import { Encoded } from '../../src/utils/encoder';

describe('Accounts', () => {
  let aeSdk: AeSdk;
  let aeSdkNoCoins: AeSdk;
  const receiver = MemoryAccount.generate();

  before(async () => {
    aeSdk = await getSdk(2);
    aeSdkNoCoins = await getSdk(0);
    aeSdkNoCoins.addAccount(MemoryAccount.generate(), { select: true });
  });

  it('removes account', async () => {
    const [address] = aeSdk.addresses();
    const account = aeSdk.accounts[address];
    aeSdk.removeAccount(address);
    expect(Object.keys(aeSdk.accounts)).to.have.length(1);
    expect(aeSdk.selectedAddress).to.be.equal(undefined);
    aeSdk.addAccount(account, { select: true });
  });

  it('determining the balance with 0 balance', async () => {
    expect(await aeSdkNoCoins.getBalance(aeSdkNoCoins.address)).to.be.equal(0n);
  });

  it('spending coins with 0 balance', async () => {
    await aeSdkNoCoins.spend(1, receiver.address).should.be.rejectedWith(Error);
  });

  it('spending negative amount of coins', () => expect(aeSdk.spend(-1, receiver.address))
    .to.be.rejectedWith(ArgumentError, 'value should be greater or equal to 0, got -1 instead'));

  it('determines the balance using `balance`', async () => {
    expect(await aeSdk.getBalance(aeSdk.address)).to.be.a('bigint');
  });

  describe('transferFunds', () => {
    const spend = async (fraction: number): Promise<{
      balanceBefore: BigNumber;
      balanceAfter: BigNumber;
      amount: BigNumber;
      fee: BigNumber;
    }> => {
      const balanceBefore = new BigNumber((await aeSdk.getBalance(aeSdk.address)).toString());
      const { tx } = await aeSdk.transferFunds(fraction, receiver.address);
      const balanceAfter = new BigNumber((await aeSdk.getBalance(aeSdk.address)).toString());
      if (tx == null || tx.amount == null) throw new UnexpectedTsError();
      return {
        balanceBefore,
        balanceAfter,
        amount: new BigNumber(tx.amount.toString()),
        fee: new BigNumber(tx.fee.toString()),
      };
    };

    it('throws exception if fraction is out of range', () => aeSdk
      .transferFunds(-1, receiver.address)
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
      await aeSdk.transferFunds(1, aeSdk.address, { onAccount: receiver });
      expect(await aeSdk.getBalance(receiver.address)).to.be.equal(0n);
    });
  });

  it('spends coins', async () => {
    const ret = await aeSdk.spend(1, receiver.address);
    ret.should.have.property('tx');
    if (ret.tx == null) throw new UnexpectedTsError();
    ret.tx.should.include({ amount: 1n, recipientId: receiver.address });
  });

  it('spends coins in AE format', async () => {
    const ret = await aeSdk.spend(1e18, receiver.address);
    ret.should.have.property('tx');
    if (ret.tx == null) throw new UnexpectedTsError();
    ret.tx.should.include({ amount: 10n ** 18n, recipientId: receiver.address });
  });

  it('spends big amount of coins', async () => {
    const bigAmount = 10n ** 31n + 10n ** 17n;
    const { publicKey } = generateKeyPair();
    const ret = await aeSdk.spend(bigAmount.toString(), publicKey);

    const balanceAfter = await aeSdk.getBalance(publicKey);
    balanceAfter.should.be.equal(bigAmount);
    ret.should.have.property('tx');
    if (ret.tx == null) throw new UnexpectedTsError();
    ret.tx.should.include({ amount: bigAmount, recipientId: publicKey });
  });

  it('Get Account by block height/hash', async () => {
    await aeSdk.awaitHeight(await aeSdk.getHeight() + 3);
    const spend = await aeSdk.spend(123, 'ak_DMNCzsVoZnpV5fe8FTQnNsTfQ48YM5C3WbHPsJyHjAuTXebFi');
    if (spend.blockHeight == null || spend.tx?.amount == null) throw new UnexpectedTsError();
    await aeSdk.awaitHeight(spend.blockHeight + 2);
    const accountAfterSpend = await aeSdk.getAccount(aeSdk.address);
    const accountBeforeSpendByHash = await aeSdk
      .getAccount(aeSdk.address, { height: spend.blockHeight - 1 });
    expect(accountBeforeSpendByHash.balance - accountAfterSpend.balance).to.be
      .equal(spend.tx.fee + spend.tx.amount);
  });

  describe('Make operation on specific account without changing of current account', () => {
    it('Can make spend on specific account', async () => {
      const accounts = aeSdk.addresses();
      const onAccount = accounts.find((acc) => acc !== aeSdk.address);

      const { tx } = await aeSdk.spend(1, aeSdk.address, { onAccount });
      if (tx?.senderId == null) throw new UnexpectedTsError();
      tx.senderId.should.be.equal(onAccount);
    });

    it('Fail on invalid account', () => {
      expect(() => {
        aeSdk.spend(1, aeSdk.address, { onAccount: 1 as any });
      }).to.throw(
        TypeError,
        'Account should be an address (ak-prefixed string), or instance of AccountBase, got 1 instead',
      );
    });

    it('Fail on non exist account', () => {
      expect(() => {
        aeSdk.spend(1, aeSdk.address, { onAccount: 'ak_q2HatMwDnwCBpdNtN9oXf5gpD9pGSgFxaa8i2Evcam6gjiggk' });
      }).to.throw(
        UnavailableAccountError,
        'Account for ak_q2HatMwDnwCBpdNtN9oXf5gpD9pGSgFxaa8i2Evcam6gjiggk not available',
      );
    });

    it('Fail on no accounts', async () => {
      const aeSdkWithoutAccount = await getSdk(0);
      await expect(aeSdkWithoutAccount.spend(1, aeSdk.address))
        .to.be.rejectedWith(
          TypeError,
          'Account should be an address (ak-prefixed string), or instance of AccountBase, got undefined instead',
        );
    });

    it('Invalid on account options', async () => {
      await expect(
        aeSdk.sign('tx_Aasdasd', { onAccount: 123 as unknown as Encoded.AccountAddress }),
      ).to.be.rejectedWith(
        TypeError,
        'Account should be an address (ak-prefixed string), or instance of AccountBase, got 123 instead',
      );
    });

    it('Make operation on account using MemoryAccount', async () => {
      const account = MemoryAccount.generate();
      const data = 'Hello';
      const signature = await account.sign(data);
      const sigUsingMemoryAccount = await aeSdk.sign(data, { onAccount: account });
      expect(signature).to.be.eql(sigUsingMemoryAccount);
    });
  });

  it('spend without waiting for mining', async () => {
    const th = await aeSdk.spend(1, receiver.address, { waitMined: false });
    th.should.be.a('object');
    th.hash.slice(0, 3).should.equal('th_');
  });
});
