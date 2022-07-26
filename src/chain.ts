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
import { AE_AMOUNT_FORMATS, formatAmount } from './utils/amount-formatter';
import verifyTransaction, { ValidatorResult } from './tx/validator';
import { pause } from './utils/other';
import { isNameValid, produceNameId } from './tx/builder/helpers';
import { DRY_RUN_ACCOUNT } from './tx/builder/schema';
import { AensName } from './tx/builder/constants';
import {
  AensPointerContextError, DryRunError, InvalidAensNameError, TransactionError,
  TxTimedOutError, TxNotInChainError, InternalError,
} from './utils/errors';
import Node, { TransformNodeType } from './Node';
import {
  Account as AccountNode, ByteCode, ContractObject, DryRunResult, DryRunResults,
  Generation, KeyBlock, MicroBlockHeader, NameEntry, SignedTx,
} from './apis/node';
import { decode, Encoded, Encoding } from './utils/encoder';
import AccountBase from './account/Base';

/**
 * @category chain
 */
export function _getPollInterval(
  type: 'block' | 'microblock',
  { _expectedMineRate = 180000, _microBlockCycle = 3000, _maxPollInterval = 5000 }:
  { _expectedMineRate?: number; _microBlockCycle?: number; _maxPollInterval?: number },
): number {
  const base = {
    block: _expectedMineRate,
    microblock: _microBlockCycle,
  }[type];
  return Math.min(base / 3, _maxPollInterval);
}

/**
 * @category exception
 */
export class InvalidTxError extends TransactionError {
  validation: ValidatorResult[];

  transaction: Encoded.Transaction;

  constructor(
    message: string,
    validation: ValidatorResult[],
    transaction: Encoded.Transaction,
  ) {
    super(message);
    this.name = 'InvalidTxError';
    this.validation = validation;
    this.transaction = transaction;
  }
}

/**
 * Obtain current height of the chain
 * @category chain
 * @returns Current chain height
 */
export async function getHeight({ onNode }: { onNode: Node }): Promise<number> {
  return (await onNode.getCurrentKeyBlockHeight()).height;
}

/**
 * Wait for a transaction to be mined
 * @category chain
 * @param th - The hash of transaction to poll
 * @param options - Options
 * @param options.interval - Interval (in ms) at which to poll the chain
 * @param options.blocks - Number of blocks mined after which to fail
 * @param options.onNode - Node to use
 * @returns The transaction as it was mined
 */
export async function poll(
  th: Encoded.TxHash,
  {
    blocks = 10, interval, onNode, ...options
  }:
  { blocks?: number; interval?: number; onNode: Node } & Parameters<typeof _getPollInterval>[1],
): Promise<TransformNodeType<SignedTx>> {
  interval ??= _getPollInterval('microblock', options);
  const max = await getHeight({ onNode }) + blocks;
  do {
    const tx = await onNode.getTransactionByHash(th);
    if (tx.blockHeight !== -1) return tx;
    await pause(interval);
  } while (await getHeight({ onNode }) < max);
  throw new TxTimedOutError(blocks, th);
}

/**
 * Wait for the chain to reach a specific height
 * @category chain
 * @param height - Height to wait for
 * @param options - Options
 * @param options.interval - Interval (in ms) at which to poll the chain
 * @param options.onNode - Node to use
 * @returns Current chain height
 */
export async function awaitHeight(
  height: number,
  { interval, onNode, ...options }:
  { interval?: number; onNode: Node } & Parameters<typeof _getPollInterval>[1],
): Promise<number> {
  interval ??= _getPollInterval('block', options);
  let currentHeight;
  do {
    if (currentHeight != null) await pause(interval);
    currentHeight = (await onNode.getCurrentKeyBlockHeight()).height;
  } while (currentHeight < height);
  return currentHeight;
}

/**
 * Wait for transaction confirmation
 * @category chain
 * @param txHash - Transaction hash
 * @param options - Options
 * @param options.confirm - Number of micro blocks to wait for transaction confirmation
 * @param options.onNode - Node to use
 * @returns Current Height
 */
export async function waitForTxConfirm(
  txHash: Encoded.TxHash,
  { confirm = 3, onNode, ...options }:
  { confirm?: number; onNode: Node } & Parameters<typeof awaitHeight>[1],
): Promise<number> {
  const { blockHeight } = await onNode.getTransactionByHash(txHash);
  const height = await awaitHeight(blockHeight + confirm, { onNode, ...options });
  const { blockHeight: newBlockHeight } = await onNode.getTransactionByHash(txHash);
  switch (newBlockHeight) {
    case -1:
      throw new TxNotInChainError(txHash);
    case blockHeight:
      return height;
    default:
      return waitForTxConfirm(txHash, { onNode, confirm, ...options });
  }
}

/**
 * Submit a signed transaction for mining
 * @category chain
 * @param tx - Transaction to submit
 * @param options - Options
 * @param options.onNode - Node to use
 * @param options.onAccount - Account to use
 * @param options.verify - Verify transaction before sending
 * @param options.waitMined - Ensure that transaction get into block
 * @param options.confirm - Number of micro blocks that should be mined after tx get included
 * @returns Transaction details
 */
export async function sendTransaction(
  tx: Encoded.Transaction,
  {
    onNode, onAccount, verify = true, waitMined = true, confirm, ...options
  }:
  SendTransactionOptions,
): Promise<SendTransactionReturnType> {
  if (verify) {
    const validation = await verifyTransaction(tx, onNode);
    if (validation.length > 0) {
      const message = `Transaction verification errors: ${
        validation.map((v: { message: string }) => v.message).join(', ')}`;
      throw new InvalidTxError(message, validation, tx);
    }
  }

  try {
    let __queue;
    try {
      __queue = onAccount != null ? `tx-${await onAccount.address(options)}` : null;
    } catch (error) {
      __queue = null;
    }
    const { txHash } = await onNode.postTransaction(
      { tx },
      __queue != null ? { requestOptions: { customHeaders: { __queue } } } : {},
    );

    if (waitMined) {
      const pollResult = await poll(txHash, { onNode, ...options });
      const txData = {
        ...pollResult,
        hash: pollResult.hash as Encoded.TxHash,
        rawTx: tx,
      };
      // wait for transaction confirmation
      if (confirm != null && (confirm === true || confirm > 0)) {
        const c = typeof confirm === 'boolean' ? undefined : confirm;
        return {
          ...txData,
          confirmationHeight: await waitForTxConfirm(txHash, { onNode, confirm: c, ...options }),
        };
      }
      return txData;
    }
    return { hash: txHash, rawTx: tx };
  } catch (error) {
    throw Object.assign(error, {
      rawTx: tx,
      verifyTx: async () => verifyTransaction(tx, onNode),
    });
  }
}

type SendTransactionOptionsType = {
  onNode: Node;
  onAccount?: AccountBase;
  verify?: boolean;
  waitMined?: boolean;
  confirm?: boolean | number;
} & Parameters<typeof poll>[1] & Omit<Parameters<typeof waitForTxConfirm>[1], 'confirm'>;
interface SendTransactionOptions extends SendTransactionOptionsType {}
interface SendTransactionReturnType extends Partial<TransformNodeType<SignedTx>> {
  hash: Encoded.TxHash;
  rawTx: Encoded.Transaction;
  confirmationHeight?: number;
}

/**
 * Get account by account public key
 * @category chain
 * @param address - Account address (public key)
 * @param options - Options
 * @param options.height - Get account on specific block by block height
 * @param options.hash - Get account on specific block by micro block hash or key block hash
 * @param options.onNode - Node to use
 */
export async function getAccount(
  address: Encoded.AccountAddress | Encoded.ContractAddress,
  { height, hash, onNode }:
  { height?: number; hash?: Encoded.KeyBlockHash | Encoded.MicroBlockHash; onNode: Node },
): Promise<TransformNodeType<AccountNode>> {
  if (height != null) return onNode.getAccountByPubkeyAndHeight(address, height);
  if (hash != null) return onNode.getAccountByPubkeyAndHash(address, hash);
  return onNode.getAccountByPubkey(address);
}

/**
 * Request the balance of specified account
 * @category chain
 * @param address - The public account address to obtain the balance for
 * @param options - Options
 * @param options.format
 * @param options.height - The chain height at which to obtain the balance for
 * (default: top of chain)
 * @param options.hash - The block hash on which to obtain the balance for (default: top of chain)
 */
export async function getBalance(
  address: Encoded.AccountAddress | Encoded.ContractAddress,
  { format = AE_AMOUNT_FORMATS.AETTOS, ...options }:
  { format?: AE_AMOUNT_FORMATS } & Parameters<typeof getAccount>[1],
): Promise<string> {
  const { balance } = await getAccount(address, options).catch(() => ({ balance: 0n }));

  return formatAmount(balance, { targetDenomination: format });
}

/**
 * Obtain current generation
 * @category chain
 * @param options - Options
 * @param options.onNode - Node to use
 * @returns Current Generation
 */
export async function getCurrentGeneration(
  { onNode }: { onNode: Node },
): Promise<TransformNodeType<Generation>> {
  return onNode.getCurrentGeneration();
}

/**
 * Get generation by hash or height
 * @category chain
 * @param hashOrHeight - Generation hash or height
 * @param options - Options
 * @param options.onNode - Node to use
 * @returns Generation
 */
export async function getGeneration(
  hashOrHeight: Encoded.KeyBlockHash | number,
  { onNode }: { onNode: Node },
): Promise<TransformNodeType<Generation>> {
  if (typeof hashOrHeight === 'number') return onNode.getGenerationByHeight(hashOrHeight);
  return onNode.getGenerationByHash(hashOrHeight);
}

/**
 * Get micro block transactions
 * @category chain
 * @param hash - Micro block hash
 * @param options - Options
 * @param options.onNode - Node to use
 * @returns Transactions
 */
export async function getMicroBlockTransactions(
  hash: Encoded.MicroBlockHash,
  { onNode }: { onNode: Node },
): Promise<TransformNodeType<SignedTx[]>> {
  return (await onNode.getMicroBlockTransactionsByHash(hash)).transactions;
}

/**
 * Get key block
 * @category chain
 * @param hashOrHeight - Key block hash or height
 * @param options - Options
 * @param options.onNode - Node to use
 * @returns Key Block
 */
export async function getKeyBlock(
  hashOrHeight: Encoded.KeyBlockHash | number,
  { onNode }: { onNode: Node },
): Promise<TransformNodeType<KeyBlock>> {
  if (typeof hashOrHeight === 'number') return onNode.getKeyBlockByHeight(hashOrHeight);
  return onNode.getKeyBlockByHash(hashOrHeight);
}

/**
 * Get micro block header
 * @category chain
 * @param hash - Micro block hash
 * @param options - Options
 * @param options.onNode - Node to use
 * @returns Micro block header
 */
export async function getMicroBlockHeader(
  hash: Encoded.MicroBlockHash,
  { onNode }: { onNode: Node },
): Promise<TransformNodeType<MicroBlockHeader>> {
  return onNode.getMicroBlockHeaderByHash(hash);
}

interface TxDryRunArguments {
  tx: Encoded.Transaction;
  accountAddress: Encoded.AccountAddress;
  top?: number;
  txEvents?: any;
  resolve: Function;
  reject: Function;
}
const txDryRunRequests: Map<string, TxDryRunArguments[] & { timeout?: NodeJS.Timeout }> = new Map();

async function txDryRunHandler(key: string, onNode: Node): Promise<void> {
  const rs = txDryRunRequests.get(key);
  txDryRunRequests.delete(key);
  if (rs == null) throw new InternalError('Can\'t get dry-run request');

  let dryRunRes;
  try {
    dryRunRes = await onNode.protectedDryRunTxs({
      top: rs[0].top,
      txEvents: rs[0].txEvents,
      txs: rs.map((req) => ({ tx: req.tx })),
      accounts: Array.from(new Set(rs.map((req) => req.accountAddress)))
        .map((pubKey) => ({ pubKey, amount: DRY_RUN_ACCOUNT.amount })),
    });
  } catch (error) {
    rs.forEach(({ reject }) => reject(error));
    return;
  }

  const { results, txEvents } = dryRunRes;
  results.forEach(({ result, reason, ...resultPayload }, idx) => {
    const {
      resolve, reject, tx, accountAddress,
    } = rs[idx];
    if (result === 'ok') resolve({ ...resultPayload, txEvents });
    else reject(Object.assign(new DryRunError(reason as string), { tx, accountAddress }));
  });
}

/**
 * Transaction dry-run
 * @category chain
 * @param tx - transaction to execute
 * @param accountAddress - address that will be used to execute transaction
 * @param options - Options
 * @param options.top - hash of block on which to make dry-run
 * @param options.txEvents - collect and return on-chain tx events that would result from the call
 * @param options.combine - Enables combining of similar requests to a single dry-run call
 * @param options.onNode - Node to use
 */
export async function txDryRun(
  tx: Encoded.Transaction,
  accountAddress: Encoded.AccountAddress,
  {
    top, txEvents, combine, onNode,
  }:
  { top?: number; txEvents?: boolean; combine?: boolean; onNode: Node },
): Promise<{
    txEvents?: TransformNodeType<DryRunResults['txEvents']>;
  } & TransformNodeType<DryRunResult>> {
  const key = combine === true ? [top, txEvents].join() : 'immediate';
  const requests = txDryRunRequests.get(key) ?? [];
  txDryRunRequests.set(key, requests);
  return new Promise((resolve, reject) => {
    requests.push({
      tx, accountAddress, top, txEvents, resolve, reject,
    });
    if (combine !== true) {
      void txDryRunHandler(key, onNode);
      return;
    }
    requests.timeout ??= setTimeout(() => { void txDryRunHandler(key, onNode); });
  });
}

/**
 * Get contract byte code
 * @category contract
 * @param contractId - Contract address
 * @param options - Options
 * @param options.onNode - Node to use
 */
export async function getContractByteCode(
  contractId: Encoded.ContractAddress,
  { onNode }: { onNode: Node },
): Promise<TransformNodeType<ByteCode>> {
  return onNode.getContractCode(contractId);
}

/**
 * Get contract entry
 * @category contract
 * @param contractId - Contract address
 * @param options - Options
 * @param options.onNode - Node to use
 */
export async function getContract(
  contractId: Encoded.ContractAddress,
  { onNode }: { onNode: Node },
): Promise<TransformNodeType<ContractObject>> {
  return onNode.getContract(contractId);
}

/**
 * Get name entry
 * @category AENS
 * @param name - AENS name
 * @param options - Options
 * @param options.onNode - Node to use
 */
export async function getName(
  name: AensName,
  { onNode }: { onNode: Node },
): Promise<TransformNodeType<NameEntry>> {
  return onNode.getNameEntryByName(name);
}

/**
 * Resolve AENS name and return name hash
 * @category AENS
 * @param nameOrId - AENS name or address
 * @param key - in AENS pointers record
 * @param options - Options
 * @param options.verify - To ensure that name exist and have a corresponding pointer
 * // TODO: avoid that to don't trust to current api gateway
 * @param options.resolveByNode - Enables pointer resolving using node
 * @param options.onNode - Node to use
 * @returns Address or AENS name hash
 */
export async function resolveName <
  Type extends Encoding.AccountAddress | Encoding.ContractAddress,
>(
  nameOrId: AensName | Encoded.Generic<Type>,
  key: string,
  { verify = true, resolveByNode = false, onNode }:
  { verify?: boolean; resolveByNode?: boolean; onNode: Node },
): Promise<Encoded.Generic<Type | Encoding.Name>> {
  if (isNameValid(nameOrId)) {
    if (verify || resolveByNode) {
      const name = await onNode.getNameEntryByName(nameOrId);
      const pointer = name.pointers.find((p) => p.key === key);
      if (pointer == null) throw new AensPointerContextError(nameOrId, key);
      if (resolveByNode) return pointer.id as Encoded.Generic<Type>;
    }
    return produceNameId(nameOrId);
  }
  try {
    decode(nameOrId);
    return nameOrId;
  } catch (error) {
    throw new InvalidAensNameError(`Invalid name or address: ${nameOrId}`);
  }
}
