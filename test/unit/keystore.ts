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
import { dump, recover, Keystore } from '../../src/utils/keystore';
import { getAddressFromPriv } from '../../src/utils/crypto';
import { InvalidPasswordError } from '../../src/utils/errors';

const password = 'test';
const secretKey = Buffer.from('35bdc4b31d75aebea2693760a2c96afe87d99dc571ddc4666db0ac8a2b59b30ef1e0c4e567f3d08eff8330c57d70ad457e9f31fa221e14fcc851273ec9af50ae', 'hex');
const address = getAddressFromPriv(secretKey);
const keystoreStatic = {
  name: 'test',
  version: 1,
  public_key: address,
  id: '3459181e-f5ab-4506-acfa-cf7a2d41cdaf',
  crypto: {
    secret_type: 'ed25519',
    symmetric_alg: 'xsalsa20-poly1305',
    ciphertext: '78f77af6d1fe6cc9fad8813cd6309dbe7ac380137314c3b961bfa69fb67ccea259e5ef8b18b9014de79ebdae79b48e6b4564be1ce96e807c1458ea51d511d2d1764599338887e65987a160259eda69fb',
    cipher_params: { nonce: '0155ae65dcafdd1ec8bfd776ac351fe3da52767d3ddd9da8' },
    kdf: 'argon2id',
    kdf_params: {
      memlimit_kib: 65536,
      opslimit: 3,
      parallelism: 1,
      salt: 'ed7866c1f3bb16b077ad835b19eb510c',
    },
  },
};

describe('Keystore', () => {
  let keystore: Keystore;

  it('dump account to keystore object', async () => {
    keystore = await dump('test', password, secretKey);
    expect(keystore.public_key).to.be.equal(address);
  });

  it('dump accepts hex', async () => {
    const nonce = Buffer.from(keystoreStatic.crypto.cipher_params.nonce, 'hex');
    const salt = Buffer.from(keystoreStatic.crypto.kdf_params.salt, 'hex');
    const k = await dump('test', password, secretKey.toString('hex'), nonce, salt);
    k.id = keystoreStatic.id;
    expect(k).to.be.eql(keystoreStatic);
  });

  it('restore account from keystore object', async () => expect(await recover(password, keystore)).to.be.equal(secretKey.toString('hex')));

  it('use invalid keystore password', () => expect(recover(`${password}1`, keystore))
    .to.be.rejectedWith(InvalidPasswordError, 'Invalid password or nonce'));
});
