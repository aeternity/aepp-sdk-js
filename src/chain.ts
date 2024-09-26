import { AE_AMOUNT_FORMATS, formatAmount } from './utils/amount-formatter';
import { isAccountNotFoundError, pause } from './utils/other';
import { unwrapProxy } from './utils/wrap-proxy';
import { isNameValid, produceNameId } from './tx/builder/helpers';
import { AensName, DRY_RUN_ACCOUNT } from './tx/builder/constants';
import {
  AensPointerContextError, DryRunError, InvalidAensNameError,
  TxTimedOutError, TxNotInChainError, InternalError,
} from './utils/errors';
import Node from './Node';
import { DryRunResult, DryRunResults, SignedTx } from './apis/node';
import {
  decode, encode, Encoded, Encoding,
} from './utils/encoder';

/**
 * @category chain
 * @param type - Type
 * @param options - Options
 */
export async function _getPollInterval(
  type: 'key-block' | 'micro-block',
  { _expectedMineRate, _microBlockCycle, onNode }:
  { _expectedMineRate?: number; _microBlockCycle?: number; onNode: Node },
): Promise<number> {
  const getVal = async (
    t: string,
    val: number | undefined,
    devModeDef: number,
    def: number,
  ): Promise<number | null> => {
    if (t !== type) return null;
    if (val != null) return val;
    return await onNode?.getNetworkId() === 'ae_dev' ? devModeDef : def;
  };

  const base = await getVal('key-block', _expectedMineRate, 0, 180000)
    ?? await getVal('micro-block', _microBlockCycle, 0, 3000)
    ?? (() => { throw new InternalError(`Unknown type: ${type}`); })();
  return Math.floor(base / 3);
}

const heightCache: WeakMap<Node, { time: number; height: number }> = new WeakMap();

/**
 * Obtain current height of the chain
 * @category chain
 * @param options - Options
 * @param options.cached - Get height from the cache. The lag behind the actual height shouldn't
 * be more than 1 block. Use if needed to reduce requests count, and approximate value can be used.
 * For example, for timeout check in transaction status polling.
 * @returns Current chain height
 */
export async function getHeight(
  { cached = false, ...options }: {
    onNode: Node;
    cached?: boolean;
  } & Parameters<typeof _getPollInterval>[1],
): Promise<number> {
  const onNode = unwrapProxy(options.onNode);
  if (cached) {
    const cache = heightCache.get(onNode);
    if (cache != null && cache.time > Date.now() - await _getPollInterval('key-block', options)) {
      return cache.height;
    }
  }
  const { height } = await onNode.getCurrentKeyBlockHeight();
  heightCache.set(onNode, { height, time: Date.now() });
  return height;
}

/**
 * Return transaction details if it is mined, fail otherwise.
 * If the transaction has ttl specified then would wait till it leaves the mempool.
 * Otherwise would fail if a specified amount of blocks were mined.
 * @category chain
 * @param th - The hash of transaction to poll
 * @param options - Options
 * @param options.interval - Interval (in ms) at which to poll the chain
 * @param options.blocks - Number of blocks mined after which to fail if transaction ttl is not set
 * @param options.onNode - Node to use
 * @returns The transaction as it was mined
 */
export async function poll(
  th: Encoded.TxHash,
  {
    blocks = 5, interval, ...options
  }:
  { blocks?: number; interval?: number; onNode: Node } & Parameters<typeof _getPollInterval>[1],
): ReturnType<Node['getTransactionByHash']> {
  interval ??= await _getPollInterval('micro-block', options);
  let max;
  do {
    const tx = await options.onNode.getTransactionByHash(th);
    if (tx.blockHeight !== -1) return tx;
    if (max == null) {
      max = tx.tx.ttl !== 0 ? -1
        : await getHeight({ ...options, cached: true }) + blocks;
    }
    await pause(interval);
  } while (max === -1 ? true : await getHeight({ ...options, cached: true }) < max);
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
  { interval, ...options }:
  { interval?: number; onNode: Node } & Parameters<typeof _getPollInterval>[1],
): Promise<number> {
  interval ??= Math.min(await _getPollInterval('key-block', options), 5000);
  let currentHeight;
  do {
    if (currentHeight != null) await pause(interval);
    currentHeight = await getHeight(options);
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
): ReturnType<Node['getAccountByPubkey']> {
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
  address: Encoded.AccountAddress | Encoded.ContractAddress | Encoded.OracleAddress,
  { format = AE_AMOUNT_FORMATS.AETTOS, ...options }:
  { format?: AE_AMOUNT_FORMATS } & Parameters<typeof getAccount>[1],
): Promise<string> {
  const addr = address.startsWith('ok_')
    ? encode(decode(address), Encoding.AccountAddress)
    : address as Encoded.AccountAddress | Encoded.ContractAddress;

  const { balance } = await getAccount(addr, options).catch((error) => {
    if (!isAccountNotFoundError(error)) throw error;
    return { balance: 0n };
  });

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
): ReturnType<Node['getCurrentGeneration']> {
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
): ReturnType<Node['getGenerationByHash']> {
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
): Promise<SignedTx[]> {
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
): ReturnType<Node['getKeyBlockByHash']> {
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
): ReturnType<Node['getMicroBlockHeaderByHash']> {
  return onNode.getMicroBlockHeaderByHash(hash);
}

interface TxDryRunArguments {
  tx: Encoded.Transaction;
  accountAddress: Encoded.AccountAddress;
  top?: number | Encoded.KeyBlockHash | Encoded.MicroBlockHash;
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
    const top = typeof rs[0].top === 'number'
      ? (await getKeyBlock(rs[0].top, { onNode })).hash : rs[0].top;
    dryRunRes = await onNode.protectedDryRunTxs({
      top,
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
  { top?: TxDryRunArguments['top']; txEvents?: boolean; combine?: boolean; onNode: Node },
): Promise<{ txEvents?: DryRunResults['txEvents'] } & DryRunResult> {
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
): ReturnType<Node['getContractCode']> {
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
): ReturnType<Node['getContract']> {
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
): ReturnType<Node['getNameEntryByName']> {
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
