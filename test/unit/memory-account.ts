import '..';
import { describe, it } from 'mocha';
import { expect } from 'chai';
import { MemoryAccount, verifyMessage, InvalidChecksumError } from '../../src';

const secretKey = 'sk_2CuofqWZHrABCrM7GY95YSQn8PyFvKQadnvFnpwhjUnDCFAWmf';

describe('MemoryAccount', () => {
  it('fails on invalid secret key', async () => {
    expect(() => new MemoryAccount('ak_test' as any))
      .to.throw(InvalidChecksumError, 'Invalid checksum');
  });

  it('Init with secretKey', async () => {
    const acc = new MemoryAccount(secretKey);
    expect(acc.address).to.be.equal('ak_21A27UVVt3hDkBE5J7rhhqnH5YNb4Y1dqo4PnSybrH85pnWo7E');
    expect(acc.secretKey).to.be.equal(secretKey);
  });

  it('generates', async () => {
    const acc = MemoryAccount.generate();
    expect(acc.address).to.satisfy((a: string) => a.startsWith('ak_'));
  });

  it('Sign message', async () => {
    const message = 'test';
    const account = new MemoryAccount(secretKey);
    const signature = await account.signMessage(message);
    expect(signature).to.be.eql(Uint8Array.from([
      0, 140, 249, 124, 66, 31, 147, 247, 203, 165, 188, 56, 230, 186, 154, 230, 113, 200, 189,
      113, 6, 140, 52, 219, 199, 130, 46, 121, 201, 45, 239, 59, 109, 139, 175, 243, 83, 186, 83,
      6, 87, 148, 163, 176, 118, 97, 26, 22, 209, 172, 47, 88, 13, 29, 56, 200, 155, 242, 104, 110,
      74, 51, 47, 0,
    ]));
    expect(verifyMessage(message, signature, account.address)).to.be.equal(true);
  });
});
