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
import AccountBase from './Base';
import {
  generateKeyPairFromSecret, sign, generateKeyPair, hash, messageToHash,
} from '../utils/crypto';
import { ArgumentError } from '../utils/errors';
import {
  decode, encode, Encoded, Encoding,
} from '../utils/encoder';
import { concatBuffers } from '../utils/other';
import { buildTx } from '../tx/builder';
import { Tag } from '../tx/builder/constants';

const secretKeys = new WeakMap();

/**
 * In-memory account class
 */
export default class AccountMemory extends AccountBase {
  override readonly address: Encoded.AccountAddress;

  /**
   * @param secretKey - Secret key
   */
  constructor(secretKey: string | Uint8Array) {
    super();
    secretKey = typeof secretKey === 'string' ? Buffer.from(secretKey, 'hex') : secretKey;
    if (secretKey.length !== 64) {
      throw new ArgumentError('secretKey', '64 bytes', secretKey.length);
    }
    secretKeys.set(this, secretKey);
    this.address = encode(
      generateKeyPairFromSecret(secretKeys.get(this)).publicKey,
      Encoding.AccountAddress,
    );
  }

  /**
   * Generates a new AccountMemory using a random secret key
   */
  static generate(): AccountMemory {
    return new AccountMemory(generateKeyPair().secretKey);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  override async sign(data: string | Uint8Array, options?: any): Promise<Uint8Array> {
    return sign(data, secretKeys.get(this));
  }

  override async signTransaction(
    tx: Encoded.Transaction,
    { innerTx, networkId, ...options }: { innerTx?: boolean; networkId?: string } = {},
  ): Promise<Encoded.Transaction> {
    if (networkId == null) {
      throw new ArgumentError('networkId', 'provided', networkId);
    }
    const prefixes = [networkId];
    if (innerTx === true) prefixes.push('inner_tx');
    const rlpBinaryTx = decode(tx);
    const txWithNetworkId = concatBuffers([Buffer.from(prefixes.join('-')), hash(rlpBinaryTx)]);

    const signatures = [await this.sign(txWithNetworkId, options)];
    return buildTx({ encodedTx: rlpBinaryTx, signatures }, Tag.SignedTx).tx;
  }

  override async signMessage(message: string, options?: any): Promise<Uint8Array> {
    return this.sign(messageToHash(message), options);
  }
}
