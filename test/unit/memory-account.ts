import '..';
import { describe, it } from 'mocha';
import { expect } from 'chai';
import { MemoryAccount, verifyMessage, InvalidChecksumError, verifySignature } from '../../src';

const secretKey = 'sk_2CuofqWZHrABCrM7GY95YSQn8PyFvKQadnvFnpwhjUnDCFAWmf';

describe('MemoryAccount', () => {
  it('fails on invalid secret key', async () => {
    expect(() => new MemoryAccount('ak_test' as any)).to.throw(
      InvalidChecksumError,
      'Invalid checksum',
    );
  });

  it('Init with secretKey', async () => {
    const acc = new MemoryAccount(secretKey);
    expect(acc.address).to.equal('ak_21A27UVVt3hDkBE5J7rhhqnH5YNb4Y1dqo4PnSybrH85pnWo7E');
    expect(acc.secretKey).to.equal(secretKey);
  });

  it('generates', async () => {
    const acc = MemoryAccount.generate();
    expect(acc.address).to.satisfy((a: string) => a.startsWith('ak_'));
  });

  it('Sign raw data', async () => {
    const data = Buffer.from(new Array(10).fill(0).map((_, idx) => idx));
    const account = new MemoryAccount(secretKey);
    const signature = await account.unsafeSign(data);
    expect(signature).to.eql(
      Uint8Array.from([
        113, 154, 121, 195, 164, 141, 153, 234, 196, 82, 120, 31, 198, 179, 208, 138, 88, 63, 98,
        221, 126, 199, 240, 117, 105, 164, 118, 214, 30, 211, 116, 118, 211, 89, 218, 196, 223, 182,
        6, 218, 199, 123, 123, 227, 78, 140, 113, 205, 53, 38, 23, 15, 56, 186, 245, 88, 217, 187,
        249, 219, 99, 74, 255, 5,
      ]),
    );
    expect(verifySignature(data, signature, account.address)).to.equal(true);
  });

  it('Sign message', async () => {
    const message = 'test';
    const account = new MemoryAccount(secretKey);
    const signature = await account.signMessage(message);
    expect(signature).to.eql(
      Uint8Array.from([
        0, 140, 249, 124, 66, 31, 147, 247, 203, 165, 188, 56, 230, 186, 154, 230, 113, 200, 189,
        113, 6, 140, 52, 219, 199, 130, 46, 121, 201, 45, 239, 59, 109, 139, 175, 243, 83, 186, 83,
        6, 87, 148, 163, 176, 118, 97, 26, 22, 209, 172, 47, 88, 13, 29, 56, 200, 155, 242, 104,
        110, 74, 51, 47, 0,
      ]),
    );
    expect(verifyMessage(message, signature, account.address)).to.equal(true);
  });

  it('Sign message message with non-ASCII chars', async () => {
    const message = 'tæst';
    const account = new MemoryAccount(secretKey);
    const signature = await account.signMessage(message);
    expect(signature).to.eql(
      Uint8Array.from([
        164, 138, 41, 174, 108, 125, 147, 42, 137, 79, 226, 64, 156, 196, 232, 24, 216, 105, 105,
        132, 212, 15, 198, 226, 48, 119, 36, 2, 115, 211, 90, 24, 242, 213, 206, 221, 215, 32, 192,
        137, 161, 10, 2, 16, 184, 7, 0, 177, 157, 15, 143, 138, 207, 71, 51, 245, 56, 155, 18, 68,
        183, 197, 251, 3,
      ]),
    );
    expect(verifyMessage(message, signature, account.address)).to.equal(true);
  });
});
