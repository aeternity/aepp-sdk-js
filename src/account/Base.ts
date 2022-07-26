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
import { messageToHash, verifyMessage as verifyMessageCrypto, hash } from '../utils/crypto';
import { buildTx } from '../tx/builder';
import { decode, Encoded } from '../utils/encoder';
import { Tag } from '../tx/builder/constants';
import { getNetworkId } from '../Node';
import { concatBuffers } from '../utils/other';
import type { createMetaTx } from '../contract/ga';

/**
 * Check is provided object looks like an instance of AccountBase
 * @param acc - Object to check
 */
export const isAccountBase = (acc: AccountBase | any): boolean => (
  !['sign', 'address', 'signTransaction', 'signMessage'].some((f) => typeof acc[f] !== 'function')
);

/**
 * Account is one of the three basic building blocks of an
 * {@link AeSdk} and provides access to a signing key pair.
 */
export default abstract class AccountBase {
  networkId?: string;

  /**
   * @param options - Options
   * @param options.networkId - Using for signing transactions
   */
  constructor({ networkId }: { networkId?: string } = {}) {
    this.networkId ??= networkId;
  }

  /**
   * Sign encoded transaction
   * @param tx - Transaction to sign
   * @param opt - Options
   * @param opt.innerTx - Sign as inner transaction for PayingFor
   * @returns Signed transaction
   */
  async signTransaction(
    tx: Encoded.Transaction,
    { innerTx, networkId, ...options }: {
      innerTx?: boolean;
      networkId?: string;
      authData?: Parameters<typeof createMetaTx>[1];
      authFun?: Parameters<typeof createMetaTx>[2];
    } & Omit<Partial<Parameters<typeof createMetaTx>[3]>, 'onAccount'> = {},
  ): Promise<Encoded.Transaction> {
    const prefixes = [await this.getNetworkId({ networkId })];
    if (innerTx === true) prefixes.push('inner_tx');
    const rlpBinaryTx = decode(tx);
    const txWithNetworkId = concatBuffers([Buffer.from(prefixes.join('-')), hash(rlpBinaryTx)]);

    const signatures = [await this.sign(txWithNetworkId, options)];
    return buildTx({ encodedTx: rlpBinaryTx, signatures }, Tag.SignedTx).tx;
  }

  /**
   * Get network Id
   * @returns Network Id
   */
  readonly getNetworkId = getNetworkId;

  /**
   * Sign message
   * @param message - Message to sign
   * @param opt - Options
   * @returns Signature as hex string of Uint8Array
   */
  async signMessage(
    message: string,
    { returnHex = false, ...options }: { returnHex?: boolean } = {},
  ): Promise<string | Uint8Array> {
    const sig = await this.sign(messageToHash(message), options);
    return returnHex ? Buffer.from(sig).toString('hex') : sig;
  }

  /**
   * Verify message
   * @param message - Message to verify
   * @param signature - Signature
   * @param options - Options
   */
  async verifyMessage(
    message: string,
    signature: string | Uint8Array,
    options?: object,
  ): Promise<boolean> {
    return verifyMessageCrypto(
      message,
      typeof signature === 'string' ? Buffer.from(signature, 'hex') : signature,
      decode(await this.address(options)),
    );
  }

  /**
   * Sign data blob
   * @param data - Data blob to sign
   * @param options - Options
   * @returns Signed data blob
   */
  abstract sign(data: string | Uint8Array, options?: any): Promise<Uint8Array>;

  /**
   * Obtain account address
   * @returns Public account address
   */
  abstract address(opt?: object): Promise<Encoded.AccountAddress>;
}
