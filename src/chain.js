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

import { AE_AMOUNT_FORMATS, formatAmount } from './utils/amount-formatter'
import verifyTransaction from './tx/validator'
import { pause } from './utils/other'
import { isNameValid, produceNameId, decode } from './tx/builder/helpers'
import { DRY_RUN_ACCOUNT } from './tx/builder/schema'
import {
  AensPointerContextError,
  DryRunError,
  InvalidAensNameError,
  InvalidTxError,
  RequestTimedOutError,
  TxTimedOutError,
  TxNotInChainError,
  ArgumentError,
  InternalError
} from './utils/errors'

export function _getPollInterval (
  type, { _expectedMineRate = 180000, _microBlockCycle = 3000, _maxPollInterval = 5000 }
) {
  const base = {
    block: _expectedMineRate,
    microblock: _microBlockCycle
  }[type]
  if (!base) throw new InternalError(`Unknown poll type: ${type}`)
  return Math.min(base / 3, _maxPollInterval)
}

/**
 * Submit a signed transaction for mining
 * @function sendTransaction
 * @instance
 * @abstract
 * @category async
 * @rtype (tx: String, options?: Object) => tx: Promise[Object]|txHash: Promise[String]
 * @param {String} tx - Transaction to submit
 * @param {String} [options={}] - Options to pass to the implementation
 * @param {String} [options.verify=true] - Verify transaction before broadcast.
 * @return {Object} Transaction
 */
export async function sendTransaction (
  tx, { onNode, onAccount, verify = true, waitMined = true, confirm, ...options }
) {
  if (verify) {
    const validation = await verifyTransaction(tx, onNode)
    if (validation.length) {
      const message = 'Transaction verification errors: ' +
        validation.map(v => v.message).join(', ')
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
      if (confirm) {
        return {
          ...txData,
          confirmationHeight: await waitForTxConfirm(txHash, { onNode, confirm, ...options })
        }
      }
      return txData
    }
    return { hash: txHash, rawTx: tx }
  } catch (error) {
    throw Object.assign(error, {
      rawTx: tx,
      verifyTx: () => verifyTransaction(tx, onNode)
    })
  }
}

/**
 * Wait for transaction confirmation
 * @function waitForTxConfirm
 * @instance
 * @abstract
 * @category async
 * @rtype (txHash: String, { confirm: Number | Boolean } = { confirm: 3 }) => Promise<Number>
 * @param {String} txHash - Transaction hash
 * @param {Object} [options] - options
 * @param {Number} [options.confirm=3] - Number of blocks to wait for transaction confirmation
 * @return {Promise<Number>} Current Height
 */
export async function waitForTxConfirm (txHash, { onNode, confirm = 3, ...options }) {
  confirm = confirm === true ? 3 : confirm
  const { blockHeight } = await onNode.api.getTransactionByHash(txHash)
  const height = await awaitHeight(blockHeight + confirm, { onNode, ...options })
  const { blockHeight: newBlockHeight } = await onNode.api.getTransactionByHash(txHash)
  switch (newBlockHeight) {
    case -1:
      throw new TxNotInChainError(txHash)
    case blockHeight:
      return height
    default:
      return waitForTxConfirm(txHash, options)
  }
}

/**
 * Get account by account public key
 * @function getAccount
 * @instance
 * @abstract
 * @category async
 * @rtype (address, { hash, height }) => account: Object
 * @param {String} address - Account public key
 * @param {Object} [options={}] - Options
 * @param {Number} [options.height] - Get account on specific block by block height
 * @param {String} [options.hash] - Get account on specific block by block hash
 * @return {Object} Account
 */
export async function getAccount (address, { height, hash, onNode }) {
  if (height) return onNode.api.getAccountByPubkeyAndHeight(address, height)
  if (hash) return onNode.api.getAccountByPubkeyAndHash(address, hash)
  return onNode.api.getAccountByPubkey(address)
}

/**
 * Request the balance of specified account
 * @function getBalance
 * @instance
 * @abstract
 * @category async
 * @rtype (address: String, options?: Object) => balance: Number
 * @param {String} address - The public account address to obtain the balance for
 * @param {Object} [options={}] - Options
 * @param {Number} options.height - The chain height at which to obtain the balance for (default:
 * top of chain)
 * @param {String} options.hash - The block hash on which to obtain the balance for (default: top
 * of chain)
 * @return {Object} The transaction as it was mined
 */
export async function getBalance (address, { format = AE_AMOUNT_FORMATS.AETTOS, ...options }) {
  const { balance } = await getAccount(address, options).catch(() => ({ balance: 0 }))

  return formatAmount(balance, { targetDenomination: format }).toString()
}

/**
 * Obtain current height of the chain
 * @function height
 * @instance
 * @abstract
 * @category async
 * @rtype () => height: Number
 * @return {Number} Current chain height
 */
export async function height ({ onNode }) {
  return (await onNode.api.getCurrentKeyBlockHeight()).height
}

/**
 * Wait for the chain to reach a specific height
 * @function awaitHeight
 * @instance
 * @abstract
 * @category async
 * @rtype (h: Number, options?: Object) => height: Number
 * @param {Object} [options={}] - Options
 * @param {Number} options.interval - Interval (in ms) at which to poll the chain
 * @param {Number} options.attempts - Number of polling attempts after which to fail
 * @return {Number} Current chain height
 */
export async function awaitHeight (_height, { interval, attempts = 20, onNode, ...options }) {
  interval ??= _getPollInterval('block', options)
  let currentHeight
  for (let i = 0; i < attempts; i++) {
    if (i) await pause(interval)
    currentHeight = await height({ onNode })
    if (currentHeight >= _height) return currentHeight
  }
  throw new RequestTimedOutError((attempts - 1) * interval, currentHeight, _height)
}

/**
 * Wait for a transaction to be mined
 * @function poll
 * @instance
 * @abstract
 * @category async
 * @rtype (th: String, options?: Object) => tx: Object
 * @param {Object} [options={}] - Options
 * @param {Number} options.interval - Interval (in ms) at which to poll the chain
 * @param {Number} options.blocks - Number of blocks mined after which to fail
 * @return {Object} The transaction as it was mined
 */
export async function poll (th, { blocks = 10, interval, onNode, ...options }) {
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
 * @function getCurrentGeneration
 * @instance
 * @abstract
 * @category async
 * @rtype () => generation: Object
 * @return {Object} Current Generation
 */
export async function getCurrentGeneration ({ onNode }) {
  return onNode.api.getCurrentGeneration()
}

/**
 * Get generation by hash or height
 * @function getGeneration
 * @instance
 * @abstract
 * @category async
 * @rtype (hashOrHeight) => generation: Object
 * @param {String|Number} hashOrHeight - Generation hash or height
 * @return {Object} Generation
 */
export async function getGeneration (hashOrHeight, { onNode }) {
  if (typeof hashOrHeight === 'string') return onNode.api.getGenerationByHash(hashOrHeight)
  if (typeof hashOrHeight === 'number') return onNode.api.getGenerationByHeight(hashOrHeight)
  throw new ArgumentError('hashOrHeight', 'a string or number', hashOrHeight)
}

/**
 * Get micro block transactions
 * @function getMicroBlockTransactions
 * @instance
 * @abstract
 * @category async
 * @rtype (hash) => txs: [...Object]
 * @return {Object[]} Transactions
 */
export async function getMicroBlockTransactions (hash, { onNode }) {
  return (await onNode.api.getMicroBlockTransactionsByHash(hash)).transactions
}

/**
 * Get key block
 * @function getKeyBlock
 * @instance
 * @abstract
 * @category async
 * @rtype (hashOrHeight) => keyBlock: Object
 * @return {Object} Key Block
 */
export async function getKeyBlock (hashOrHeight, { onNode }) {
  if (typeof hashOrHeight === 'string') return onNode.api.getKeyBlockByHash(hashOrHeight)
  if (typeof hashOrHeight === 'number') return onNode.api.getKeyBlockByHeight(hashOrHeight)
  throw new ArgumentError('hashOrHeight', 'a string or number', hashOrHeight)
}

/**
 * Get micro block header
 * @function getMicroBlockHeader
 * @instance
 * @abstract
 * @category async
 * @rtype (hash) => header: Object
 * @return {Object} Micro block header
 */
export async function getMicroBlockHeader (hash, { onNode }) {
  return onNode.api.getMicroBlockHeaderByHash(hash)
}

const txDryRunRequests = {}
async function txDryRunHandler (key, onNode) {
  const rs = txDryRunRequests[key]
  delete txDryRunRequests[key]

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
    const { resolve, reject, tx, options, accountAddress } = rs[idx]
    if (result === 'ok') return resolve({ ...resultPayload, txEvents })
    reject(Object.assign(
      new DryRunError(reason), { tx, accountAddress, options }
    ))
  })
}

/**
 * Transaction dry-run
 * @function txDryRun
 * @instance
 * @abstract
 * @category async
 * @rtype (tx, accountAddress, options) => result: Object
 * @param {String} tx - transaction to execute
 * @param {String} accountAddress - address that will be used to execute transaction
 * @param {String|Number} [options.top] - hash of block on which to make dry-run
 * @param {Boolean} [options.txEvents] - collect and return on-chain tx events that would result
 * from the call
 * @return {Object} Result
 */
export async function txDryRun (tx, accountAddress, { top, txEvents, combine, onNode }) {
  const key = combine ? [top, txEvents].join() : 'immediate'
  txDryRunRequests[key] ??= []
  return new Promise((resolve, reject) => {
    txDryRunRequests[key].push({ tx, accountAddress, top, txEvents, resolve, reject })
    if (!combine) {
      txDryRunHandler(key, onNode)
      return
    }
    txDryRunRequests[key].timeout ??= setTimeout(() => txDryRunHandler(key, onNode))
  })
}

export async function getContractByteCode (contractId, { onNode }) {
  return onNode.api.getContractCode(contractId)
}

export async function getContract (contractId, { onNode }) {
  return onNode.api.getContract(contractId)
}

export async function getName (name, { onNode }) {
  return onNode.api.getNameEntryByName(name)
}

/**
 * Resolve AENS name and return name hash
 * @param {String} nameOrId
 * @param {String} key in AENS pointers record
 * @param {Object} [options]
 * @param {Boolean} [options.verify] To ensure that name exist and have a corresponding pointer
 * // TODO: avoid that to don't trust to current api gateway
 * @param {Boolean} [options.resolveByNode] Enables pointer resolving using node
 * @return {String} Address or AENS name hash
 */
export async function resolveName (nameOrId, key, { verify = true, resolveByNode, onNode }) {
  if (!nameOrId || typeof nameOrId !== 'string') {
    throw new InvalidAensNameError(`Name or address should be a string: ${nameOrId}`)
  }
  try {
    decode(nameOrId)
    return nameOrId
  } catch (error) {}
  if (isNameValid(nameOrId)) {
    if (verify || resolveByNode) {
      const name = await onNode.api.getNameEntryByName(nameOrId)
      const pointer = name.pointers.find(pointer => pointer.key === key)
      if (!pointer) {
        throw new AensPointerContextError(`Name ${nameOrId} don't have pointers for ${key}`)
      }
      if (resolveByNode) return pointer.id
    }
    return produceNameId(nameOrId)
  }
  throw new InvalidAensNameError(`Invalid name or address: ${nameOrId}`)
}
