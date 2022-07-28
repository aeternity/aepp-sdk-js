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

import { MAX_AUTH_FUN_GAS, TxSchema } from '../tx/builder/schema';
import { Tag } from '../tx/builder/constants';
import {
  buildContractIdByContractTx, buildTx, BuiltTx, TxUnpacked, unpackTx,
} from '../tx/builder';
import {
  _buildTx, BuildTxOptions, getVmVersion, prepareTxParams,
} from '../tx';
import { hash } from '../utils/crypto';
import { decode, Encoded, Encoding } from '../utils/encoder';
import { IllegalArgumentError, MissingParamError, InvalidAuthDataError } from '../utils/errors';
import { concatBuffers } from '../utils/other';
import AccountBase from '../account/Base';
import { getContractInstance } from './methods';
import { send, SendOptions } from '../spend';
import Node from '../Node';
import { getAccount } from '../chain';
import Compiler from './Compiler';

/**
 * Check if account is GA
 * @category contract
 * @param address - Account address
 * @param options - Options
 * @returns if account is GA
 */
export async function isGA(
  address: Encoded.AccountAddress,
  options: Parameters<typeof getAccount>[1],
): Promise<boolean> {
  const { contractId } = await getAccount(address, options);
  return contractId != null;
}

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
  const ownerId = await onAccount.address(options);
  if (await isGA(ownerId, { onNode })) throw new IllegalArgumentError(`Account ${ownerId} is already GA`);

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
 * Create a metaTx transaction
 * @category contract
 * @param rawTransaction - Inner transaction
 * @param authData - Object with gaMeta params
 * @param authFnName - Authorization function name
 * @param options - Options
 * @param options.onAccount - Account to use
 * @returns Transaction string
 */
export async function createMetaTx(
  rawTransaction: Encoded.Transaction,
  authData: {
    gasLimit?: number;
    callData?: Encoded.ContractBytearray;
    source?: string;
    args?: any[];
  },
  authFnName: string,
  {
    onAccount, onCompiler, onNode, ...options
  }:
  { onAccount: AccountBase; onCompiler: Compiler; onNode: Node }
  & Parameters<AccountBase['address']>[0],
): Promise<Encoded.Transaction> {
  const wrapInEmptySignedTx = (
    tx: Encoded.Transaction | Uint8Array | TxUnpacked<TxSchema>,
  ): BuiltTx<TxSchema, Encoding.Transaction> => (
    buildTx({ encodedTx: tx, signatures: [] }, Tag.SignedTx)
  );

  if (Object.keys(authData).length <= 0) throw new MissingParamError('authData is required');

  const gasLimit = authData.gasLimit ?? MAX_AUTH_FUN_GAS;
  if (gasLimit > MAX_AUTH_FUN_GAS) {
    throw new InvalidAuthDataError(`the maximum gasLimit value for ga authFun is ${MAX_AUTH_FUN_GAS}, got ${gasLimit}`);
  }

  const authCallData = authData.callData ?? await (async () => {
    if (authData.source == null || authData.args == null) throw new InvalidAuthDataError('Auth data must contain source code and arguments.');
    const contract = await getContractInstance({
      onCompiler, onNode, source: authData.source,
    });
    return contract.calldata.encode(contract._name, authFnName, authData.args);
  })();

  const { abiVersion } = await getVmVersion(Tag.ContractCallTx, { onNode });
  const wrappedTx = wrapInEmptySignedTx(unpackTx<Tag.SignedTx>(rawTransaction));
  const params = {
    ...options,
    tx: {
      ...wrappedTx,
      tx: wrappedTx.txObject,
    },
    // TODO: accept an address instead
    gaId: await onAccount.address(options),
    abiVersion,
    authData: authCallData,
    gasLimit,
    vsn: 2,
  };
  // @ts-expect-error createMetaTx needs to be integrated into tx builder
  const { fee } = await prepareTxParams(Tag.GaMetaTx, { ...params, onNode });
  const { rlpEncoded: metaTxRlp } = buildTx({ ...params, fee }, Tag.GaMetaTx);
  return wrapInEmptySignedTx(metaTxRlp).tx;
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
