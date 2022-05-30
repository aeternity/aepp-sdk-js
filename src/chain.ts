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
 * Chain module
 * @module @aeternity/aepp-sdk/es/chain
 * @export Chain
 * @example import { Chain } from '@aeternity/aepp-sdk'
 */

import { AE_AMOUNT_FORMATS, AeAmountFormats, formatAmount } from './utils/amount-formatter'
// @ts-expect-error
import verifyTransaction from './tx/validator'
import { pause } from './utils/other'
// @ts-expect-error
import { isNameValid, produceNameId, decode } from './tx/builder/helpers'
// @ts-expect-error
import { DRY_RUN_ACCOUNT } from './tx/builder/schema'
import {
  AensPointerContextError, DryRunError, InvalidAensNameError, InvalidTxError,
  RequestTimedOutError, TxTimedOutError, TxNotInChainError, InternalError
} from './utils/errors'
import NodeApi, { TransformNodeType } from './nodeApi'
import {
  Account as AccountNode, ByteCode, ContractObject, DryRunResult, DryRunResults,
  Generation, KeyBlock, MicroBlockHeader, NameEntry, SignedTx
} from './apis/node'
import { EncodedData } from './utils/encoder'

export function _getPollInterval (
  type: 'block' | 'microblock',
  { _expectedMineRate = 180000, _microBlockCycle = 3000, _maxPollInterval = 5000 }
): number {
  const base = {
    block: _expectedMineRate,
    microblock: _microBlockCycle
  }[type]
  return Math.min(base / 3, _maxPollInterval)
}

// TODO: extract these definitions

interface Node {
  api: InstanceType<typeof NodeApi>
}

interface Account {
  address: (options: any) => Promise<EncodedData<'ak'>>
}

type AensName = `${string}.chain`

/**
 * Submit a signed transaction for mining
 * @param tx Transaction to submit
 * @param options
 * @param options.onNode Node to use
 * @param options.onAccount Account to use
 * @param options.verify Verify transaction before sending
 * @param options.waitMined Ensure that transaction get into block
 * @param options.confirm Number of micro blocks that should be mined after tx get included
 * @return Transaction details
 */
export async function sendTransaction (
  tx: EncodedData<'tx'>,
  { onNode, onAccount, verify = true, waitMined = true, confirm, ...options }:
  {
    onNode: Node
    onAccount: Account
    verify?: boolean
    waitMined?: boolean
    confirm?: boolean | number
  } & Parameters<typeof poll>[1] & Omit<Parameters<typeof waitForTxConfirm>[1], 'confirm'>
): Promise<{
    hash: EncodedData<'th'> | string
    rawTx: EncodedData<'tx'>
    confirmationHeight?: number
  } & Partial<TransformNodeType<SignedTx>>> {
  if (verify) {
    const validation = await verifyTransaction(tx, onNode)
    if (validation.length > 0) {
      const message = 'Transaction verification errors: ' +
        validation.map((v: { message: string }) => v.message).join(', ')
      throw Object.assign(new InvalidTxError(message), {
        code: 'TX_VERIFICATION_ERROR',
        validation,
        transaction: tx
      })
    }
  }

  try {
    const { txHash } = await onNode.api.postTransaction({ tx }, {
      requestOptions: {
        customHeaders: {
          __queue: `tx-${await onAccount?.address(options).catch(() => '')}`
        }
      }
    })

    if (waitMined) {
      const txData = { ...await poll(txHash, { onNode, ...options }), rawTx: tx }
      // wait for transaction confirmation
      if (confirm != null && (confirm === true || confirm > 0)) {
        const c = typeof confirm === 'boolean' ? undefined : confirm
        return {
          ...txData,
          confirmationHeight: await waitForTxConfirm(txHash, { onNode, confirm: c, ...options })
        }
      }
      return txData
    }
    return { hash: txHash, rawTx: tx }
  } catch (error) {
    throw Object.assign(error, {
      rawTx: tx,
      verifyTx: async () => await verifyTransaction(tx, onNode)
    })
  }
}

/**
 * Wait for transaction confirmation
 * @param txHash Transaction hash
 * @param options
 * @param options.confirm Number of micro blocks to wait for transaction confirmation
 * @param options.onNode Node to use
 * @return Current Height
 */
export async function waitForTxConfirm (
  txHash: EncodedData<'th'>,
  { confirm = 3, onNode, ...options }:
  { confirm?: number, onNode: Node } & Parameters<typeof awaitHeight>[1]
): Promise<number> {
  const { blockHeight } = await onNode.api.getTransactionByHash(txHash)
  const height = await awaitHeight(blockHeight + confirm, { onNode, ...options })
  const { blockHeight: newBlockHeight } = await onNode.api.getTransactionByHash(txHash)
  switch (newBlockHeight) {
    case -1:
      throw new TxNotInChainError(txHash)
    case blockHeight:
      return height
    default:
      return await waitForTxConfirm(txHash, { onNode, confirm, ...options })
  }
}

/**
 * Get account by account public key
 * @param address Account address (public key)
 * @param options
 * @param options.height Get account on specific block by block height
 * @param options.hash Get account on specific block by micro block hash or key block hash
 * @param options.onNode Node to use
 */
export async function getAccount (
  address: EncodedData<'ak'>,
  { height, hash, onNode }:
  { height?: number, hash?: EncodedData<'kh' | 'mh'>, onNode: Node }
): Promise<TransformNodeType<AccountNode>> {
  if (height != null) return await onNode.api.getAccountByPubkeyAndHeight(address, height)
  if (hash != null) return await onNode.api.getAccountByPubkeyAndHash(address, hash)
  return await onNode.api.getAccountByPubkey(address)
}

/**
 * Request the balance of specified account
 * @param address The public account address to obtain the balance for
 * @param options
 * @param options.format
 * @param options.height The chain height at which to obtain the balance for (default: top of chain)
 * @param options.hash The block hash on which to obtain the balance for (default: top of chain)
 */
export async function getBalance (
  address: EncodedData<'ak'>,
  { format = AE_AMOUNT_FORMATS.AETTOS, ...options }:
  { format: AeAmountFormats } & Parameters<typeof getAccount>[1]
): Promise<string> {
  const { balance } = await getAccount(address, options).catch(() => ({ balance: 0n }))

  return formatAmount(balance, { targetDenomination: format })
}

/**
 * Obtain current height of the chain
 * @return Current chain height
 */
export async function height ({ onNode }: { onNode: Node }): Promise<number> {
  return (await onNode.api.getCurrentKeyBlockHeight()).height
}

/**
 * Wait for the chain to reach a specific height
 * @param height Height to wait for
 * @param options
 * @param options.interval Interval (in ms) at which to poll the chain
 * @param options.attempts Number of polling attempts after which to fail
 * @param options.onNode Node to use
 * @return Current chain height
 */
export async function awaitHeight (
  height: number,
  { interval, attempts = 20, onNode, ...options }:
  { interval: number, attempts: number, onNode: Node }
  & Parameters<typeof _getPollInterval>[1]
): Promise<number> {
  interval ??= _getPollInterval('block', options)
  let currentHeight
  for (let i = 0; i < attempts; i++) {
    if (i !== 0) await pause(interval)
    currentHeight = (await onNode.api.getCurrentKeyBlockHeight()).height
    if (currentHeight >= height) return currentHeight
  }
  throw new RequestTimedOutError((attempts - 1) * interval, currentHeight, height)
}

/**
 * Wait for a transaction to be mined
 * @param th The hash of transaction to poll
 * @param options
 * @param options.interval Interval (in ms) at which to poll the chain
 * @param options.blocks Number of blocks mined after which to fail
 * @param options.onNode Node to use
 * @return The transaction as it was mined
 */
export async function poll (
  th: EncodedData<'th'>,
  { blocks = 10, interval, onNode, ...options }:
  { blocks: number, interval: number, onNode: Node } & Parameters<typeof _getPollInterval>[1]
): Promise<TransformNodeType<SignedTx>> {
  interval ??= _getPollInterval('microblock', options)
  const max = await height({ onNode }) + blocks
  do {
    const tx = await onNode.api.getTransactionByHash(th)
    if (tx.blockHeight !== -1) return tx
    await pause(interval)
  } while (await height({ onNode }) < max)
  throw new TxTimedOutError(blocks, th)
}

/**
 * Obtain current generation
 * @param options
 * @param options.onNode Node to use
 * @return Current Generation
 */
export async function getCurrentGeneration (
  { onNode }: { onNode: Node }
): Promise<TransformNodeType<Generation>> {
  return await onNode.api.getCurrentGeneration()
}

/**
 * Get generation by hash or height
 * @param hashOrHeight Generation hash or height
 * @param options
 * @param options.onNode Node to use
 * @return Generation
 */
export async function getGeneration (
  hashOrHeight: EncodedData<'kh'> | number, { onNode }: { onNode: Node }
): Promise<TransformNodeType<Generation>> {
  if (typeof hashOrHeight === 'number') return await onNode.api.getGenerationByHeight(hashOrHeight)
  return await onNode.api.getGenerationByHash(hashOrHeight)
}

/**
 * Get micro block transactions
 * @param hash
 * @param options
 * @param options.onNode Node to use
 * @return Transactions
 */
export async function getMicroBlockTransactions (
  hash: EncodedData<'mh'>, { onNode }: { onNode: Node }
): Promise<TransformNodeType<SignedTx[]>> {
  return (await onNode.api.getMicroBlockTransactionsByHash(hash)).transactions
}

/**
 * Get key block
 * @param hashOrHeight
 * @param options
 * @param options.onNode Node to use
 * @return Key Block
 */
export async function getKeyBlock (
  hashOrHeight: EncodedData<'kh'> | number, { onNode }: { onNode: Node }
): Promise<TransformNodeType<KeyBlock>> {
  if (typeof hashOrHeight === 'number') return await onNode.api.getKeyBlockByHeight(hashOrHeight)
  return await onNode.api.getKeyBlockByHash(hashOrHeight)
}

/**
 * Get micro block header
 * @param hash
 * @param options
 * @param options.onNode Node to use
 * @return Micro block header
 */
export async function getMicroBlockHeader (
  hash: EncodedData<'mh'>, { onNode }: { onNode: Node }
): Promise<TransformNodeType<MicroBlockHeader>> {
  return await onNode.api.getMicroBlockHeaderByHash(hash)
}

interface TxDryRunArguments {
  tx: EncodedData<'tx'>
  accountAddress: EncodedData<'ak'>
  top?: number
  txEvents?: any
  resolve: Function
  reject: Function
}
const txDryRunRequests: Map<string, TxDryRunArguments[] & { timeout?: NodeJS.Timeout }> = new Map()

async function txDryRunHandler (key: string, onNode: Node): Promise<void> {
  const rs = txDryRunRequests.get(key)
  txDryRunRequests.delete(key)
  if (rs == null) throw new InternalError('Can\'t get dry-run request')

  let dryRunRes
  try {
    dryRunRes = await onNode.api.protectedDryRunTxs({
      top: rs[0].top,
      txEvents: rs[0].txEvents,
      txs: rs.map(req => ({ tx: req.tx })),
      accounts: Array.from(new Set(rs.map(req => req.accountAddress)))
        .map(pubKey => ({ pubKey, amount: DRY_RUN_ACCOUNT.amount }))
    })
  } catch (error) {
    rs.forEach(({ reject }) => reject(error))
    return
  }

  const { results, txEvents } = dryRunRes
  results.forEach(({ result, reason, ...resultPayload }, idx) => {
    const { resolve, reject, tx, accountAddress } = rs[idx]
    if (result === 'ok') return resolve({ ...resultPayload, txEvents })
    reject(Object.assign(
      new DryRunError(reason as string), { tx, accountAddress }
    ))
  })
}

/**
 * Transaction dry-run
 * @param tx - transaction to execute
 * @param accountAddress - address that will be used to execute transaction
 * @param options
 * @param options.top hash of block on which to make dry-run
 * @param options.txEvents collect and return on-chain tx events that would result from the call
 * @param options.combine Enables combining of similar requests to a single dry-run call
 * @param options.onNode Node to use
 */
export async function txDryRun (
  tx: EncodedData<'tx'>,
  accountAddress: EncodedData<'ak'>,
  { top, txEvents, combine, onNode }:
  { top?: number, txEvents?: boolean, combine?: boolean, onNode: Node }
): Promise<{
    txEvents?: TransformNodeType<DryRunResults['txEvents']>
  } & TransformNodeType<DryRunResult>> {
  const key = combine === true ? [top, txEvents].join() : 'immediate'
  const requests = txDryRunRequests.get(key) ?? []
  txDryRunRequests.set(key, requests)
  return await new Promise((resolve, reject) => {
    requests.push({ tx, accountAddress, top, txEvents, resolve, reject })
    if (combine !== true) {
      void txDryRunHandler(key, onNode)
      return
    }
    requests.timeout ??= setTimeout(() => { void txDryRunHandler(key, onNode) })
  })
}

/**
 * Get contract byte code
 * @param contractId Contract address
 * @param options
 * @param options.onNode Node to use
 */
export async function getContractByteCode (
  contractId: EncodedData<'ct'>, { onNode }: { onNode: Node }
): Promise<TransformNodeType<ByteCode>> {
  return await onNode.api.getContractCode(contractId)
}

/**
 * Get contract entry
 * @param contractId Contract address
 * @param options
 * @param options.onNode Node to use
 */
export async function getContract (
  contractId: EncodedData<'ct'>, { onNode }: { onNode: Node }
): Promise<TransformNodeType<ContractObject>> {
  return await onNode.api.getContract(contractId)
}

/**
 * Get name entry
 * @param name
 * @param options
 * @param options.onNode Node to use
 */
export async function getName (
  name: AensName, { onNode }: { onNode: Node }
): Promise<TransformNodeType<NameEntry>> {
  return await onNode.api.getNameEntryByName(name)
}

/**
 * Resolve AENS name and return name hash
 * @param nameOrId
 * @param key in AENS pointers record
 * @param options
 * @param options.verify To ensure that name exist and have a corresponding pointer
 * // TODO: avoid that to don't trust to current api gateway
 * @param options.resolveByNode Enables pointer resolving using node
 * @param options.onNode Node to use
 * @return Address or AENS name hash
 */
export async function resolveName (
  nameOrId: AensName | EncodedData<'ak'>,
  key: string,
  { verify = true, resolveByNode, onNode }:
  { verify?: boolean, resolveByNode: boolean, onNode: Node }
): Promise<EncodedData<'ak' | 'nm'>> {
  try {
    decode(nameOrId)
    return nameOrId as EncodedData<'ak'>
  } catch (error) {}
  if (isNameValid(nameOrId) === true) {
    if (verify || resolveByNode) {
      const name = await onNode.api.getNameEntryByName(nameOrId)
      const pointer = name.pointers.find(pointer => pointer.key === key)
      if (pointer == null) throw new AensPointerContextError(nameOrId, key)
      if (resolveByNode) return pointer.id as EncodedData<'ak'>
    }
    return produceNameId(nameOrId)
  }
  throw new InvalidAensNameError(`Invalid name or address: ${nameOrId}`)
}
