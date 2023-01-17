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
  ArgumentError,
  InternalError,
  InvalidAuthDataError,
  NotImplementedError,
} from '../utils/errors';
import { decode, Encoded } from '../utils/encoder';
import { getAccount } from '../chain';
import Contract from '../contract/Contract';
import { buildTxAsync, buildTx } from '../tx/builder';
import { Tag } from '../tx/builder/constants';

/**
 * Generalized account class
 */
export default class AccountGeneralized extends AccountBase {
  override readonly address: Encoded.AccountAddress;

  #authFun?: string;

  /**
   * @param address - Address of generalized account
   */
  constructor(address: Encoded.AccountAddress) {
    super();
    decode(address);
    this.address = address;
  }

  // eslint-disable-next-line class-methods-use-this
  override async sign(): Promise<Uint8Array> {
    throw new NotImplementedError('Can\'t sign using generalized account');
  }

  // eslint-disable-next-line class-methods-use-this
  override async signMessage(): Promise<Uint8Array> {
    throw new NotImplementedError('Can\'t sign using generalized account');
  }

  override async signTransaction(
    tx: Encoded.Transaction,
    { authData, onCompiler, onNode }: Parameters<AccountBase['signTransaction']>[1],
  ): Promise<Encoded.Transaction> {
    if (authData == null || onCompiler == null || onNode == null) {
      throw new ArgumentError('authData, onCompiler, onNode', 'provided', null);
    }
    const {
      callData, sourceCode, args, gasLimit,
    } = authData;

    const authCallData = callData ?? await (async () => {
      if (this.#authFun == null) {
        const account = await getAccount(this.address, { onNode });
        if (account.kind !== 'generalized') {
          throw new ArgumentError('account kind', 'generalized', account.kind);
        }
        this.#authFun = account.authFun;
      }
      if (this.#authFun == null) {
        throw new InternalError('Account in generalised, but authFun not provided');
      }

      if (sourceCode == null || args == null) {
        throw new InvalidAuthDataError('Auth data must contain source code and arguments.');
      }
      const contract = await Contract.initialize({ onCompiler, onNode, sourceCode });
      return contract._calldata.encode(contract._name, this.#authFun, args);
    })();

    const gaMetaTx = await buildTxAsync({
      tag: Tag.GaMetaTx,
      tx: decode(buildTx({ tag: Tag.SignedTx, encodedTx: decode(tx), signatures: [] })),
      gaId: this.address,
      authData: authCallData,
      gasLimit,
      onNode,
    });
    return buildTx({ tag: Tag.SignedTx, encodedTx: decode(gaMetaTx), signatures: [] });
  }
}
