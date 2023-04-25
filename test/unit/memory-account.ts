import '..';
import { describe, it } from 'mocha';
import { expect } from 'chai';
import {
  MemoryAccount, generateKeyPair, verifyMessage, ArgumentError,
} from '../../src';

const testAcc = generateKeyPair();

describe('MemoryAccount', () => {
  it('fails on invalid secret key', async () => {
    expect(() => new MemoryAccount(' '))
      .to.throw(ArgumentError, 'should be 64 bytes, got 0 instead');
  });

  it('Init with secretKey as hex string', async () => {
    const acc = new MemoryAccount(testAcc.secretKey);
    expect(acc.address).to.be.equal(testAcc.publicKey);
  });

  it('Init with secretKey as Buffer', async () => {
    const acc = new MemoryAccount(Buffer.from(testAcc.secretKey, 'hex'));
    expect(acc.address).to.be.equal(testAcc.publicKey);
  });

  it('generates', async () => {
    const acc = MemoryAccount.generate();
    expect(acc.address).to.satisfy((a: string) => a.startsWith('ak_'));
  });

  it('Sign message', async () => {
    const message = 'test';
    const account = new MemoryAccount(testAcc.secretKey);
    const signature = await account.signMessage(message);
    expect(verifyMessage(message, signature, testAcc.publicKey)).to.equal(true);
  });
});
