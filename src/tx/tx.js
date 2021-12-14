/*
 * ISC License (ISC)
 * Copyright (c) 2018 aeternity developers
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
 * Transaction module
 * @module @aeternity/aepp-sdk/es/tx/tx
 * @export Transaction
 * @example import { Transaction } from '@aeternity/aepp-sdk'
 */

import ChainNode from '../chain/node'
import Tx from './'
import { buildTx, calculateFee, unpackTx } from './builder'
import { ABI_VERSIONS, MIN_GAS_PRICE, PROTOCOL_VM_ABI, TX_TYPE, TX_TTL } from './builder/schema'
import { buildContractId } from './builder/helpers'
import { TxObject } from './tx-object'
import {
  IllegalArgumentError,
  UnsupportedABIversionError,
  UnsupportedVMversionError,
  UnsupportedProtocolError,
  UnknownTxError
} from '../utils/errors'

async function spendTx ({ senderId, recipientId, amount, payload = '' }) {
  // Calculate fee, get absolute ttl (ttl + height), get account nonce
  const { fee, ttl, nonce } = await this.prepareTxParams(
    TX_TYPE.spend, { senderId, ...arguments[0], payload }
  )
  // Build transaction using sdk (if nativeMode) or build on `AETERNITY NODE` side
  const { tx } = this.nativeMode
    ? {
        tx: TxObject({
          params: {
            ...arguments[0],
            recipientId,
            senderId,
            nonce,
            ttl,
            payload
          },
          type: TX_TYPE.spend
        }).encodedTx
      }
    : await this.api.postSpend({
      ...arguments[0],
      amount: parseInt(amount),
      recipientId,
      senderId,
      nonce,
      ttl,
      fee: parseInt(fee),
      payload
    })

  return tx
}

async function namePreclaimTx ({ accountId, commitmentId }) {
  // Calculate fee, get absolute ttl (ttl + height), get account nonce
  const { fee, ttl, nonce } = await this.prepareTxParams(
    TX_TYPE.namePreClaim, { senderId: accountId, ...arguments[0] }
  )

  // Build transaction using sdk (if nativeMode) or build on `AETERNITY NODE` side
  const { tx } = this.nativeMode
    ? {
        tx: TxObject({
          params: { ...arguments[0], nonce, ttl, fee },
          type: TX_TYPE.namePreClaim
        }).encodedTx
      }
    : await this.api.postNamePreclaim({ ...arguments[0], nonce, ttl, fee: parseInt(fee) })

  return tx
}

async function nameClaimTx ({ accountId, name, nameSalt, vsn = 2 }) {
  // Calculate fee, get absolute ttl (ttl + height), get account nonce
  const { fee, ttl, nonce } = await this.prepareTxParams(
    TX_TYPE.nameClaim, { senderId: accountId, ...arguments[0], vsn }
  )

  // Build transaction using sdk (if nativeMode) or build on `AETERNITY NODE` side
  const { tx } = this.nativeMode
    ? {
        tx: TxObject({
          params: { ...arguments[0], nonce, ttl, fee, vsn },
          type: TX_TYPE.nameClaim
        }).encodedTx
      }
    : await this.api.postNameClaim({ ...arguments[0], nonce, ttl, fee: parseInt(fee) })

  return tx
}

async function nameTransferTx ({ accountId, nameId, recipientId }) {
  // Calculate fee, get absolute ttl (ttl + height), get account nonce
  const { fee, ttl, nonce } = await this.prepareTxParams(
    TX_TYPE.nameTransfer, { senderId: accountId, ...arguments[0] }
  )

  // Build transaction using sdk (if nativeMode) or build on `AETERNITY NODE` side
  const { tx } = this.nativeMode
    ? {
        tx: TxObject({
          params: { ...arguments[0], recipientId, nonce, ttl, fee },
          type: TX_TYPE.nameTransfer
        }).encodedTx
      }
    : await this.api.postNameTransfer({
      ...arguments[0], recipientId, nonce, ttl, fee: parseInt(fee)
    })

  return tx
}

async function nameUpdateTx ({ accountId, nameId, nameTtl, pointers, clientTtl }) {
  // Calculate fee, get absolute ttl (ttl + height), get account nonce
  const { fee, ttl, nonce } = await this.prepareTxParams(
    TX_TYPE.nameUpdate, { senderId: accountId, ...arguments[0] }
  )

  // Build transaction using sdk (if nativeMode) or build on `AETERNITY NODE` side
  const { tx } = this.nativeMode
    ? {
        tx: TxObject({
          params: { ...arguments[0], nonce, ttl, fee },
          type: TX_TYPE.nameUpdate
        }).encodedTx
      }
    : await this.api.postNameUpdate({ ...arguments[0], nonce, ttl, fee: parseInt(fee) })

  return tx
}

async function nameRevokeTx ({ accountId, nameId }) {
  // Calculate fee, get absolute ttl (ttl + height), get account nonce
  const { fee, ttl, nonce } = await this.prepareTxParams(
    TX_TYPE.nameRevoke, { senderId: accountId, ...arguments[0] }
  )

  // Build transaction using sdk (if nativeMode) or build on `AETERNITY NODE` side
  const { tx } = this.nativeMode
    ? {
        tx: TxObject({
          params: { ...arguments[0], nonce, ttl, fee },
          type: TX_TYPE.nameRevoke
        }).encodedTx
      }
    : await this.api.postNameRevoke({ ...arguments[0], nonce, ttl, fee: parseInt(fee) })

  return tx
}

async function contractCreateTx ({
  ownerId, code, vmVersion, abiVersion, deposit, amount, gas, gasPrice = MIN_GAS_PRICE, callData
}) {
  // Get VM_ABI version
  const ctVersion = this.getVmVersion(TX_TYPE.contractCreate, arguments[0])
  // Calculate fee, get absolute ttl (ttl + height), get account nonce
  const { fee, ttl, nonce } = await this.prepareTxParams(
    TX_TYPE.contractCreate, { senderId: ownerId, ...arguments[0], ctVersion, gasPrice }
  )
  // Build transaction using sdk (if nativeMode) or build on `AETERNITY NODE` side
  return this.nativeMode
    ? {
        tx: TxObject({
          params: { ...arguments[0], nonce, ttl, fee, ctVersion, gasPrice },
          type: TX_TYPE.contractCreate
        }).encodedTx,
        contractId: buildContractId(ownerId, nonce)
      }
    : this.api.postContractCreate({
      ...arguments[0],
      nonce,
      ttl,
      fee: parseInt(fee),
      gas: parseInt(gas),
      gasPrice,
      vmVersion: ctVersion.vmVersion,
      abiVersion: ctVersion.abiVersion
    })
}

async function contractCallTx ({
  callerId, contractId, abiVersion, amount, gas, gasPrice = MIN_GAS_PRICE, callData
}) {
  const ctVersion = this.getVmVersion(TX_TYPE.contractCall, arguments[0])
  // Calculate fee, get absolute ttl (ttl + height), get account nonce
  const { fee, ttl, nonce } = await this.prepareTxParams(
    TX_TYPE.contractCall,
    { senderId: callerId, ...arguments[0], gasPrice, abiVersion: ctVersion.abiVersion }
  )

  // Build transaction using sdk (if nativeMode) or build on `AETERNITY NODE` side
  const { tx } = this.nativeMode
    ? {
        tx: TxObject({
          params: { ...arguments[0], nonce, ttl, fee, abiVersion: ctVersion.abiVersion, gasPrice },
          type: TX_TYPE.contractCall
        }).encodedTx
      }
    : await this.api.postContractCall({
      ...arguments[0],
      nonce,
      ttl,
      fee: parseInt(fee),
      gas: parseInt(gas),
      gasPrice,
      abiVersion: ctVersion.abiVersion
    })

  return tx
}

async function oracleRegisterTx ({
  accountId, queryFormat, responseFormat, queryFee, oracleTtl, abiVersion = ABI_VERSIONS.NO_ABI
}) {
  // const { abiVersion: abi } = this.getVmVersion(TX_TYPE.oracleRegister, arguments[0])
  // Calculate fee, get absolute ttl (ttl + height), get account nonce
  const { fee, ttl, nonce } = await this.prepareTxParams(
    TX_TYPE.oracleRegister, { senderId: accountId, ...arguments[0], abiVersion }
  )
  // Build transaction using sdk (if nativeMode) or build on `AETERNITY NODE` side
  const { tx } = this.nativeMode
    ? {
        tx: TxObject({
          params: {
            accountId,
            queryFee,
            abiVersion,
            fee,
            oracleTtl,
            nonce,
            ttl,
            queryFormat,
            responseFormat
          },
          type: TX_TYPE.oracleRegister
        }).encodedTx
      }
    : await this.api.postOracleRegister({
      accountId,
      queryFee,
      abiVersion,
      fee: parseInt(fee),
      oracleTtl,
      nonce,
      ttl,
      queryFormat,
      responseFormat
    })

  return tx
}

async function oracleExtendTx ({ oracleId, callerId, oracleTtl }) {
  // Calculate fee, get absolute ttl (ttl + height), get account nonce
  const { fee, ttl, nonce } = await this.prepareTxParams(
    TX_TYPE.oracleExtend, { senderId: callerId, ...arguments[0] }
  )

  // Build transaction using sdk (if nativeMode) or build on `AETERNITY NODE` side
  const { tx } = this.nativeMode
    ? {
        tx: TxObject({
          params: { oracleId, fee, oracleTtl, nonce, ttl },
          type: TX_TYPE.oracleExtend
        }).encodedTx
      }
    : await this.api.postOracleExtend({ oracleId, fee: parseInt(fee), oracleTtl, nonce, ttl })

  return tx
}

async function oraclePostQueryTx ({ oracleId, responseTtl, query, queryTtl, queryFee, senderId }) {
  // Calculate fee, get absolute ttl (ttl + height), get account nonce
  const { fee, ttl, nonce } = await this.prepareTxParams(
    TX_TYPE.oracleQuery, { senderId, ...arguments[0] }
  )

  // Build transaction using sdk (if nativeMode) or build on `AETERNITY NODE` side
  const { tx } = this.nativeMode
    ? {
        tx: TxObject({
          params: { oracleId, responseTtl, query, queryTtl, fee, queryFee, ttl, nonce, senderId },
          type: TX_TYPE.oracleQuery
        }).encodedTx
      }
    : await this.api.postOracleQuery({
      oracleId,
      responseTtl,
      query,
      queryTtl,
      fee: parseInt(fee),
      queryFee,
      ttl,
      nonce,
      senderId
    })

  return tx
}

async function oracleRespondTx ({ oracleId, callerId, responseTtl, queryId, response }) {
  // Calculate fee, get absolute ttl (ttl + height), get account nonce
  const { fee, ttl, nonce } = await this.prepareTxParams(
    TX_TYPE.oracleResponse, { senderId: callerId, ...arguments[0] }
  )

  // Build transaction using sdk (if nativeMode) or build on `AETERNITY NODE` side
  const { tx } = this.nativeMode
    ? {
        tx: TxObject({
          params: { oracleId, responseTtl, queryId, response, fee, ttl, nonce },
          type: TX_TYPE.oracleResponse
        }).encodedTx
      }
    : await this.api.postOracleRespond({
      oracleId, responseTtl, queryId, response, fee: parseInt(fee), ttl, nonce
    })
  return tx
}

async function channelCloseSoloTx ({ channelId, fromId, payload, poi }) {
  // Calculate fee, get absolute ttl (ttl + height), get account nonce
  const { fee, ttl, nonce } = await this.prepareTxParams(
    TX_TYPE.channelCloseSolo, { senderId: fromId, ...arguments[0], payload }
  )

  // Build transaction using sdk (if nativeMode) or build on `AETERNITY NODE` side
  const { tx } = this.nativeMode
    ? buildTx({
      ...arguments[0],
      channelId,
      fromId,
      payload,
      poi,
      ttl,
      fee,
      nonce
    }, TX_TYPE.channelCloseSolo)
    : await this.api.postChannelCloseSolo({
      ...arguments[0],
      channelId,
      fromId,
      payload,
      poi,
      ttl,
      fee: parseInt(fee),
      nonce
    })

  return tx
}

async function channelSlashTx ({ channelId, fromId, payload, poi }) {
  // Calculate fee, get absolute ttl (ttl + height), get account nonce
  const { fee, ttl, nonce } = await this.prepareTxParams(
    TX_TYPE.channelSlash, { senderId: fromId, ...arguments[0], payload }
  )

  // Build transaction using sdk (if nativeMode) or build on `AETERNITY NODE` side
  const { tx } = this.nativeMode
    ? buildTx({
      ...arguments[0],
      channelId,
      fromId,
      payload,
      poi,
      ttl,
      fee,
      nonce
    }, TX_TYPE.channelSlash)
    : await this.api.postChannelSlash({
      ...arguments[0],
      channelId,
      fromId,
      payload,
      poi,
      ttl,
      fee: parseInt(fee),
      nonce
    })

  return tx
}

async function channelSettleTx ({ channelId, fromId, initiatorAmountFinal, responderAmountFinal }) {
  // Calculate fee, get absolute ttl (ttl + height), get account nonce
  const { fee, ttl, nonce } = await this.prepareTxParams(
    TX_TYPE.channelSettle, { senderId: fromId, ...arguments[0] }
  )

  // Build transaction using sdk (if nativeMode) or build on `AETERNITY NODE` side
  const { tx } = this.nativeMode
    ? buildTx({
      ...arguments[0],
      channelId,
      fromId,
      initiatorAmountFinal,
      responderAmountFinal,
      ttl,
      fee,
      nonce
    }, TX_TYPE.channelSettle)
    : await this.api.postChannelSettle({
      ...arguments[0],
      channelId,
      fromId,
      initiatorAmountFinal: parseInt(initiatorAmountFinal),
      responderAmountFinal: parseInt(responderAmountFinal),
      ttl,
      fee: parseInt(fee),
      nonce
    })

  return tx
}

async function channelSnapshotSoloTx ({ channelId, fromId, payload }) {
  // Calculate fee, get absolute ttl (ttl + height), get account nonce
  const { fee, ttl, nonce } = await this.prepareTxParams(
    TX_TYPE.channelSnapshotSolo, { senderId: fromId, ...arguments[0], payload }
  )

  // Build transaction using sdk (if nativeMode) or build on `AETERNITY NODE` side
  const { tx } = this.nativeMode
    ? buildTx({
      ...arguments[0],
      channelId,
      fromId,
      payload,
      ttl,
      fee,
      nonce
    }, TX_TYPE.channelSnapshotSolo)
    : await this.api.postChannelSnapshotSolo({
      ...arguments[0],
      channelId,
      fromId,
      payload,
      ttl,
      fee: parseInt(fee),
      nonce
    })

  return tx
}

async function gaAttachTx ({
  ownerId, code, vmVersion, abiVersion, authFun, gas, gasPrice = MIN_GAS_PRICE, callData
}) {
  // Get VM_ABI version
  const ctVersion = this.getVmVersion(TX_TYPE.contractCreate, arguments[0])
  // Calculate fee, get absolute ttl (ttl + height), get account nonce
  const { fee, ttl, nonce } = await this.prepareTxParams(
    TX_TYPE.gaAttach, { senderId: ownerId, ...arguments[0], ctVersion, gasPrice }
  )
  // Build transaction using sdk (if nativeMode) or build on `AETERNITY NODE` side
  return {
    tx: TxObject({
      params: { ...arguments[0], nonce, ttl, fee, ctVersion, gasPrice },
      type: TX_TYPE.gaAttach
    }).encodedTx,
    contractId: buildContractId(ownerId, nonce)
  }
}

async function payingForTx ({ tx, payerId, ...args }) {
  const params = { tx: unpackTx(tx), payerId }
  const { fee, nonce } = await this.prepareTxParams(TX_TYPE.payingFor, {
    ...params, ...args, senderId: payerId
  })
  return buildTx({ ...params, ...args, fee, nonce }, TX_TYPE.payingFor).tx
}

/**
 * Validated vm/abi version or get default based on transaction type and NODE version
 *
 * @param {string} txType Type of transaction
 * @param {object} vmAbi Object with vm and abi version fields
 * @return {object} Object with vm/abi version ({ vmVersion: number, abiVersion: number })
 */
function getVmVersion (txType, { vmVersion, abiVersion } = {}) {
  const { consensusProtocolVersion } = this.getNodeInfo()
  const supportedProtocol = PROTOCOL_VM_ABI[consensusProtocolVersion]
  if (!supportedProtocol) throw new UnsupportedProtocolError('Not supported consensus protocol version')
  const protocolForTX = supportedProtocol[txType]
  if (!protocolForTX) throw new UnknownTxError('Not supported tx type')

  abiVersion = abiVersion || protocolForTX.abiVersion[0]
  vmVersion = vmVersion || protocolForTX.vmVersion[0]
  if (!protocolForTX.vmVersion.includes(vmVersion)) {
    throw new UnsupportedVMversionError(`VM VERSION ${vmVersion} do not support by this node. Supported: [${protocolForTX.vmVersion}]`)
  }
  if (!protocolForTX.abiVersion.includes(abiVersion)) {
    throw new UnsupportedABIversionError(`ABI VERSION ${abiVersion} do not support by this node. Supported: [${protocolForTX.abiVersion}]`)
  }

  return { vmVersion, abiVersion }
}

/**
 * Compute the absolute ttl by adding the ttl to the current height of the chain
 *
 * @param {number} ttl
 * @param {boolean} relative ttl is absolute or relative(default: true(relative))
 * @return {number} Absolute Ttl
 */
async function calculateTtl (ttl = TX_TTL, relative = true) {
  if (ttl === 0) return 0
  if (ttl < 0) throw new IllegalArgumentError('ttl must be greater than 0')

  if (relative) {
    const { height } = await this.api.getCurrentKeyBlock()
    return +(height) + ttl
  }
  return ttl
}

/**
 * Get the next nonce to be used for a transaction for an account
 *
 * @param {string} accountId
 * @param {number} nonce
 * @return {number} Next Nonce
 */
async function getAccountNonce (accountId, nonce) {
  if (nonce) return nonce
  const { nonce: accountNonce } = await this.api.getAccountByPubkey(accountId)
    .catch(() => ({ nonce: 0 }))
  return accountNonce + 1
}

/**
 * Calculate fee, get absolute ttl (ttl + height), get account nonce
 *
 * @param {String} txType Type of transaction
 * @param {Object} params Object which contains all tx data
 * @return {Object} { ttl, nonce, fee } Object with account nonce, absolute ttl and transaction fee
 */
async function prepareTxParams (
  txType,
  { senderId, nonce: n, ttl: t, fee: f, gas, absoluteTtl, vsn, strategy }
) {
  n = n || (
    await this.api.getAccountNextNonce(senderId, { strategy }).catch(e => ({ nextNonce: 1 }))
  ).nextNonce
  const ttl = await calculateTtl.call(this, t, !absoluteTtl)
  const fee = calculateFee(
    f,
    txType,
    { showWarning: this.showWarning, gas, params: { ...arguments[1], nonce: n, ttl }, vsn }
  )
  return { fee, ttl, nonce: n }
}

/**
 * Transaction Stamp
 *
 * This is implementation of [Tx](api/tx.md) relays
 * the creation of transactions to {@link module:@aeternity/aepp-sdk/es/Node}.
 * This stamp provide ability to create native transaction's,
 * or transaction's using Node API.
 * As there is no built-in security between Node and client communication,
 * creating transaction using {@link module:@aeternity/aepp-sdk/es/Node} API
 * must never be used for production but can be very useful to verify other
 * implementations.
 * @function
 * @alias module:@aeternity/aepp-sdk/es/tx/tx
 * @rtype Stamp
 * @param {Object} [options={}] - Initializer object
 * @param {Boolean} [options.nativeMode=true] options.nativeMode - Use Native build of transaction's
 * @param {String} options.url - Node url
 * @param {String} options.internalUrl - Node internal url
 * @return {Object} Transaction instance
 * @example Transaction({url: 'https://testnet.aeternity.io/'})
 */
const Transaction = ChainNode.compose(Tx, {
  init ({ nativeMode = true, showWarning = false }) {
    this.nativeMode = nativeMode
    this.showWarning = showWarning
  },
  props: {
    nativeMode: true,
    showWarning: false
  },
  methods: {
    spendTx,
    namePreclaimTx,
    nameClaimTx,
    nameTransferTx,
    nameUpdateTx,
    nameRevokeTx,
    contractCreateTx,
    contractCallTx,
    prepareTxParams,
    oracleRegisterTx,
    oracleExtendTx,
    oraclePostQueryTx,
    oracleRespondTx,
    channelCloseSoloTx,
    channelSlashTx,
    channelSettleTx,
    channelSnapshotSoloTx,
    gaAttachTx,
    payingForTx,
    getAccountNonce,
    getVmVersion
  }
})

export default Transaction
