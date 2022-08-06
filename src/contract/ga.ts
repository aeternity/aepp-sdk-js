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

/**
 * Generalized Account module - routines to use generalized account
 */

import { Tag } from '../tx/builder/constants';
import { buildContractIdByContractTx } from '../tx/builder';
import { _buildTx, BuildTxOptions } from '../tx';
import { hash } from '../utils/crypto';
import { decode, Encoded } from '../utils/encoder';
import { IllegalArgumentError } from '../utils/errors';
import { concatBuffers } from '../utils/other';
import AccountBase from '../account/Base';
import { getContractInstance } from './methods';
import { send, SendOptions } from '../spend';
import Node from '../Node';
import { getAccount } from '../chain';
import Compiler from './Compiler';

/**
 * Convert current account to GA
 * @category contract
 * @param authFnName - Authorization function name
 * @param source - Auth contract source code
 * @param args - init arguments
 * @param options - Options
 * @returns General Account Object
 */
export async function createGeneralizedAccount(
  authFnName: string,
  source: string,
  args: any[],
  {
    onAccount, onCompiler, onNode, ...options
  }: CreateGeneralizedAccountOptions,
): Promise<Readonly<{
    owner: Encoded.AccountAddress;
    transaction: Encoded.TxHash;
    rawTx: Encoded.Transaction;
    gaContractId: Encoded.ContractAddress;
  }>> {
  const ownerId = onAccount.address;
  if ((await getAccount(ownerId, { onNode })).kind === 'generalized') {
    throw new IllegalArgumentError(`Account ${ownerId} is already GA`);
  }

  const contract = await getContractInstance({
    onAccount, onCompiler, onNode, source,
  });

  const tx = await _buildTx(Tag.GaAttachTx, {
    ...options,
    onNode,
    code: await contract.compile(),
    gasLimit: options.gasLimit ?? await contract._estimateGas('init', args, options),
    ownerId,
    callData: contract.calldata.encode(contract._name, 'init', args),
    authFun: hash(authFnName),
  });
  const contractId = buildContractIdByContractTx(tx);
  const { hash: transaction, rawTx } = await send(tx, {
    onNode, onAccount, onCompiler, ...options,
  });

  return Object.freeze({
    owner: ownerId,
    transaction,
    rawTx,
    gaContractId: contractId,
  });
}

interface CreateGeneralizedAccountOptions extends
  BuildTxOptions<Tag.GaAttachTx, 'authFun' | 'callData' | 'code' | 'ownerId' | 'gasLimit'>,
  SendOptions {
  onAccount: AccountBase;
  onCompiler: Compiler;
  onNode: Node;
  gasLimit?: number;
}

/**
 * Build a transaction hash the same as `Auth.tx_hash`
 * @category contract
 * @param transaction - tx-encoded transaction
 * @param options - Options
 * @param options.onNode - Node to use
 * @returns Transaction hash
 */
export async function buildAuthTxHash(
  transaction: Encoded.Transaction,
  { onNode }: { onNode: Node },
): Promise<Uint8Array> {
  const { networkId } = await onNode.getStatus();
  return new Uint8Array(hash(
    concatBuffers([Buffer.from(networkId), decode(transaction)]),
  ));
}
