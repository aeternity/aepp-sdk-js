import { describe, it, before } from 'mocha';
import { expect, should } from 'chai';
import BigNumber from 'bignumber.js';
import { getSdk, networkId } from '.';
import { assertNotNull } from '../utils';
import {
  AeSdk,
  AccountMemory,
  AE_AMOUNT_FORMATS,
  UnavailableAccountError,
  TypeError,
  ArgumentError,
  encode,
  Encoding,
  Encoded,
} from '../../src';

should();

describe('Accounts', () => {
  let aeSdk: AeSdk;
  let aeSdkNoCoins: AeSdk;
  const receiver = AccountMemory.generate();

  before(async () => {
    aeSdk = await getSdk(2);
    aeSdkNoCoins = await getSdk(0);
    aeSdkNoCoins.addAccount(AccountMemory.generate(), { select: true });
  });

  it('removes account', async () => {
    const [address] = aeSdk.addresses();
    const account = aeSdk.accounts[address];
    aeSdk.removeAccount(address);
    expect(Object.keys(aeSdk.accounts)).to.have.length(1);
    expect(aeSdk.selectedAddress).to.equal(undefined);
    aeSdk.addAccount(account, { select: true });
  });

  it('determining the balance with 0 balance', async () => {
    await aeSdkNoCoins.getBalance(aeSdkNoCoins.address).should.eventually.be.equal('0');
  });

  it('spending coins with 0 balance', async () => {
    await aeSdkNoCoins.spend(1, receiver.address).should.be.rejectedWith(Error);
  });

  it('spending negative amount of coins', () =>
    expect(aeSdk.spend(-1, receiver.address)).to.be.rejectedWith(
      ArgumentError,
      'value should be greater or equal to 0, got -1 instead',
    ));

  it('determines the balance using `balance`', async () => {
    await aeSdk.getBalance(aeSdk.address).should.eventually.be.a('string');
  });

  describe('transferFunds', () => {
    const spend = async (
      fraction: number,
    ): Promise<{
      balanceBefore: BigNumber;
      balanceAfter: BigNumber;
      amount: BigNumber;
      fee: BigNumber;
    }> => {
      const balanceBefore = new BigNumber(await aeSdk.getBalance(aeSdk.address));
      const { tx } = await aeSdk.transferFunds(fraction, receiver.address);
      const balanceAfter = new BigNumber(await aeSdk.getBalance(aeSdk.address));
      assertNotNull(tx?.amount);
      return {
        balanceBefore,
        balanceAfter,
        amount: new BigNumber(tx.amount.toString()),
        fee: new BigNumber(tx.fee.toString()),
      };
    };

    it('throws exception if fraction is out of range', () =>
      aeSdk
        .transferFunds(-1, receiver.address)
        .should.be.rejectedWith(
          ArgumentError,
          'fraction should be a number between 0 and 1, got -1 instead',
        ));

    it('spends 0% of balance', async () => {
      const { balanceBefore, balanceAfter, amount } = await spend(0);
      balanceBefore.should.be.not.eql(balanceAfter);
      amount.isZero().should.be.equal(true);
    });

    it('spends 68.97% of balance', async () => {
      const { balanceBefore, balanceAfter, amount, fee } = await spend(0.6897);
      balanceBefore.times(0.6897).integerValue(BigNumber.ROUND_HALF_UP).should.be.eql(amount);
      balanceAfter.plus(amount).plus(fee).should.be.eql(balanceBefore);
    });

    it('spends 100% of balance', async () => {
      const { balanceBefore, balanceAfter, amount, fee } = await spend(1);
      amount.plus(fee).should.be.eql(balanceBefore);
      balanceAfter.isZero().should.be.equal(true);
    });

    it('accepts onAccount option', async () => {
      await aeSdk.transferFunds(1, aeSdk.address, { onAccount: receiver });
      new BigNumber(await aeSdk.getBalance(receiver.address)).isZero().should.be.equal(true);
    });
  });

  it('spends coins', async () => {
    const ret = await aeSdk.spend(1, receiver.address);
    ret.should.have.property('tx');
    assertNotNull(ret.tx);
    ret.tx.should.include({ amount: 1n, recipientId: receiver.address });
  });

  it('spends coins in AE format', async () => {
    const ret = await aeSdk.spend(0.001, receiver.address, { denomination: AE_AMOUNT_FORMATS.AE });
    ret.should.have.property('tx');
    assertNotNull(ret.tx);
    ret.tx.should.include({ amount: 10n ** 15n, recipientId: receiver.address });
  });

  it('spends with a payload', async () => {
    const payload = encode(Buffer.from([1, 2, 3, 4]), Encoding.Bytearray);
    const { tx } = await aeSdk.spend(1, receiver.address, { payload });
    expect(tx?.payload).to.equal('ba_AQIDBI3kcuI=');
  });

  it('Get Account by block height/hash', async () => {
    const address = 'ak_2swhLkgBPeeADxVTAVCJnZLY5NZtCFiM93JxsEaMuC59euuFRQ';
    if (networkId === 'ae_uat') {
      expect(await aeSdk.getBalance(address, { height: 500000 })).to.equal(
        '4577590840980663351396',
      );
      return;
    }
    if (networkId === 'ae_mainnet') {
      expect(await aeSdk.getBalance(address, { height: 362055 })).to.equal('100000000000000');
      return;
    }
    const genesis = 'ak_21A27UVVt3hDkBE5J7rhhqnH5YNb4Y1dqo4PnSybrH85pnWo7E';
    expect(await aeSdk.getBalance(genesis, { height: 0 })).to.equal('10000000000000000000000');
  });

  (networkId === 'ae_dev' ? it : it.skip)(
    'validate account balance by height before and after spend tx',
    async () => {
      async function getBalance(height?: number): Promise<bigint> {
        return (await aeSdk.getAccount(aeSdk.address, { height })).balance;
      }

      const beforeSpend = await getBalance();
      const beforeHeight = (await aeSdk.getHeight()) + 1;
      await aeSdk.awaitHeight(beforeHeight);
      const spend = await aeSdk.spend(123, 'ak_2swhLkgBPeeADxVTAVCJnZLY5NZtCFiM93JxsEaMuC59euuFRQ');

      const afterSpend = await getBalance();
      assertNotNull(spend.tx?.amount);
      expect(beforeSpend - afterSpend).to.equal(spend.tx.fee + spend.tx.amount);
      expect(await getBalance(beforeHeight)).to.equal(beforeSpend);
      assertNotNull(spend.blockHeight);
      await aeSdk.awaitHeight(spend.blockHeight + 1);
      expect(await getBalance(spend.blockHeight + 1)).to.equal(afterSpend);
    },
  );

  describe('Make operation on specific account without changing of current account', () => {
    it('Can make spend on specific account', async () => {
      const accounts = aeSdk.addresses();
      const onAccount = accounts.find((acc) => acc !== aeSdk.address);

      const { tx } = await aeSdk.spend(1, aeSdk.address, { onAccount });
      assertNotNull(tx?.senderId);
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
        aeSdk.spend(1, aeSdk.address, {
          onAccount: 'ak_q2HatMwDnwCBpdNtN9oXf5gpD9pGSgFxaa8i2Evcam6gjiggk',
        });
      }).to.throw(
        UnavailableAccountError,
        'Account for ak_q2HatMwDnwCBpdNtN9oXf5gpD9pGSgFxaa8i2Evcam6gjiggk not available',
      );
    });

    it('Fail on no accounts', async () => {
      const aeSdkWithoutAccount = await getSdk(0);
      await expect(aeSdkWithoutAccount.spend(1, aeSdk.address)).to.be.rejectedWith(
        TypeError,
        'Account should be an address (ak-prefixed string), or instance of AccountBase, got undefined instead',
      );
    });

    it('Invalid on account options', async () => {
      await expect(
        aeSdk.unsafeSign('tx_Aasdasd', { onAccount: 123 as unknown as Encoded.AccountAddress }),
      ).to.be.rejectedWith(
        TypeError,
        'Account should be an address (ak-prefixed string), or instance of AccountBase, got 123 instead',
      );
    });

    it('Make operation on account using AccountMemory', async () => {
      const account = AccountMemory.generate();
      const data = 'Hello';
      const signature = await account.unsafeSign(data);
      const sigUsingMemoryAccount = await aeSdk.unsafeSign(data, { onAccount: account });
      expect(signature).to.eql(sigUsingMemoryAccount);
    });
  });

  it('spend without waiting for mining', async () => {
    const th = await aeSdk.spend(1, receiver.address, { waitMined: false });
    th.should.be.a('object');
    th.hash.slice(0, 3).should.equal('th_');
    await aeSdk.poll(th.hash);
  });
});
