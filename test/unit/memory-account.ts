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

import '..';
import { describe, it } from 'mocha';
import { expect } from 'chai';
import MemoryAccount from '../../src/account/Memory';
import { generateKeyPair, verifyMessage, ArgumentError } from '../../src';

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
