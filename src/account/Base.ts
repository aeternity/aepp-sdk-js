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
import { Encoded } from '../utils/encoder';
import Node from '../Node';
import type { createMetaTx } from '../contract/ga';
import Compiler from '../contract/Compiler';

/**
 * Check is provided object looks like an instance of AccountBase
 * @param acc - Object to check
 */
export const isAccountBase = (acc: AccountBase | any): boolean => (
  !['sign', 'signTransaction', 'signMessage'].some((f) => typeof acc[f] !== 'function')
  && acc.address.startsWith('ak_')
);

/**
 * Account is one of the three basic building blocks of an
 * {@link AeSdk} and provides access to a signing key pair.
 */
export default abstract class AccountBase {
  /**
   * Sign encoded transaction
   * @param tx - Transaction to sign
   * @param options - Options
   * @param options.innerTx - Sign as inner transaction for PayingFor
   * @returns Signed transaction
   */
  abstract signTransaction(
    tx: Encoded.Transaction,
    options: {
      innerTx?: boolean;
      networkId?: string;
      authData?: Parameters<typeof createMetaTx>[1];
      onNode?: Node;
      onCompiler?: Compiler;
    },
  ): Promise<Encoded.Transaction>;

  /**
   * Sign message
   * @param message - Message to sign
   * @param options - Options
   * @returns Signature as hex string of Uint8Array
   */
  abstract signMessage(message: string, options?: any): Promise<Uint8Array>;

  /**
   * Sign data blob
   * @param data - Data blob to sign
   * @param options - Options
   * @returns Signed data blob
   */
  abstract sign(data: string | Uint8Array, options?: any): Promise<Uint8Array>;

  /**
   * Account address
   */
  readonly address: Encoded.AccountAddress;
}
