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
import { ArgumentError, InternalError, InvalidKeypairError } from '../utils/errors';
import { decode, Encoded } from '../utils/encoder';
import { createMetaTx } from '../contract/ga';
import { getAccount } from '../chain';
import Node from '../Node';
import Compiler from '../contract/Compiler';

/**
 * Generalized account class
 */
export default class AccountGeneralized extends AccountBase {
  #address: Encoded.AccountAddress;

  #authFun?: string;

  /**
   * @param address - Address of generalized account
   */
  constructor(address: Encoded.AccountAddress) {
    super({});
    decode(address);
    this.#address = address;
  }

  // eslint-disable-next-line class-methods-use-this
  override async sign(): Promise<Uint8Array> {
    throw new InvalidKeypairError('You are trying to sign data using generalized account without keypair');
  }

  override async signTransaction(
    tx: Encoded.Transaction,
    { authData, onCompiler, onNode }: {
      authData?: Parameters<typeof createMetaTx>[1];
      onNode?: Node;
      onCompiler?: Compiler;
    },
  ): Promise<Encoded.Transaction> {
    if (authData == null || onCompiler == null || onNode == null) {
      throw new ArgumentError('authData, onCompiler, onNode', 'provided', null);
    }

    if (this.#authFun == null) {
      const account = await getAccount(await this.address(), { onNode });
      if (account.kind !== 'generalized') {
        throw new ArgumentError('account kind', 'generalized', account.kind);
      }
      this.#authFun = account.authFun;
      if (this.#authFun == null) {
        throw new InternalError('Account in generalised, but authFun not provided');
      }
    }

    return createMetaTx(tx, authData, this.#authFun, { onCompiler, onNode, onAccount: this });
  }

  async address(): Promise<Encoded.AccountAddress> {
    return this.#address;
  }
}
