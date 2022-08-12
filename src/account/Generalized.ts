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
import getContractInstance from '../contract/Contract';
import { _buildTx } from '../tx';
import { Tag } from '../tx/builder/constants';
import { buildTx } from '../tx/builder';

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

    if (this.#authFun == null && callData == null) {
      const account = await getAccount(this.address, { onNode });
      if (account.kind !== 'generalized') {
        throw new ArgumentError('account kind', 'generalized', account.kind);
      }
      this.#authFun = account.authFun;
      if (this.#authFun == null) {
        throw new InternalError('Account in generalised, but authFun not provided');
      }
    }

    const authCallData = callData ?? await (async () => {
      if (sourceCode == null || args == null) {
        throw new InvalidAuthDataError('Auth data must contain source code and arguments.');
      }
      const contract = await getContractInstance({ onCompiler, onNode, sourceCode });
      return contract.calldata.encode(contract._name, this.#authFun, args);
    })();

    const gaMetaTx = await _buildTx(Tag.GaMetaTx, {
      tx: buildTx({ encodedTx: decode(tx), signatures: [] }, Tag.SignedTx).rlpEncoded,
      gaId: this.address,
      authData: authCallData,
      gasLimit,
      nonce: 0,
      onNode,
    });
    return buildTx({ encodedTx: decode(gaMetaTx), signatures: [] }, Tag.SignedTx).tx;
  }
}
