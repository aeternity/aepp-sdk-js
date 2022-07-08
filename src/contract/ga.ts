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

import { TX_TYPE, MAX_AUTH_FUN_GAS, TxSchema } from '../tx/builder/schema';
import {
  buildContractIdByContractTx, buildTx, BuiltTx, TxUnpacked, unpackTx,
} from '../tx/builder';
import {
  _buildTx, BuildTxOptions, getVmVersion, prepareTxParams,
} from '../tx';
import { hash } from '../utils/crypto';
import { decode, EncodedData } from '../utils/encoder';
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
  address: EncodedData<'ak'>,
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
    owner: EncodedData<'ak'>;
    transaction: EncodedData<'th'>;
    rawTx: EncodedData<'tx'>;
    gaContractId: EncodedData<'ct'>;
  }>> {
  const ownerId = await onAccount.address(options);
  if (await isGA(ownerId, { onNode })) throw new IllegalArgumentError(`Account ${ownerId} is already GA`);

  const contract = await getContractInstance({
    onAccount, onCompiler, onNode, source,
  });

  const tx = await _buildTx(TX_TYPE.gaAttach, {
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
  BuildTxOptions<TX_TYPE.gaAttach, 'authFun' | 'callData' | 'code' | 'ownerId' | 'gasLimit'>,
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
  rawTransaction: EncodedData<'tx'>,
  authData: {
    gasLimit?: number;
    callData?: EncodedData<'cb'>;
    source?: string;
    args?: any[];
  },
  authFnName: string,
  {
    onAccount, onCompiler, onNode, ...options
  }:
  { onAccount: AccountBase; onCompiler: Compiler; onNode: Node }
  & Parameters<AccountBase['address']>[0],
): Promise<EncodedData<'tx'>> {
  const wrapInEmptySignedTx = (
    tx: EncodedData<'tx'> | Uint8Array | TxUnpacked<TxSchema>,
  ): BuiltTx<TxSchema, 'tx'> => buildTx({ encodedTx: tx, signatures: [] }, TX_TYPE.signed);

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

  const { abiVersion } = await getVmVersion(TX_TYPE.contractCall, { onNode });
  const wrappedTx = wrapInEmptySignedTx(unpackTx<TX_TYPE.signed>(rawTransaction));
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
  const { fee } = await prepareTxParams(TX_TYPE.gaMeta, { ...params, onNode });
  const { rlpEncoded: metaTxRlp } = buildTx({ ...params, fee }, TX_TYPE.gaMeta);
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
  transaction: EncodedData<'tx'>,
  { onNode }: { onNode: Node },
): Promise<Uint8Array> {
  const { networkId } = await onNode.getStatus();
  return new Uint8Array(hash(
    concatBuffers([Buffer.from(networkId), decode(transaction)]),
  ));
}
