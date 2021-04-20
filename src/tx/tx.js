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
 * @example import Transaction from '@aeternity/aepp-sdk/es/tx/tx'
 */

import * as R from 'ramda'

import ChainNode from '../chain/node'
import Tx from './'

import { buildTx, calculateFee } from './builder'
import { ABI_VERSIONS, MIN_GAS_PRICE, PROTOCOL_VM_ABI, TX_TYPE, VM_TYPE, TX_TTL } from './builder/schema'
import { buildContractId } from './builder/helpers'
import { TxObject } from './tx-object'

async function spendTx ({ senderId, recipientId, amount, payload = '' }) {
  // Calculate fee, get absolute ttl (ttl + height), get account nonce
  const { fee, ttl, nonce } = await this.prepareTxParams(TX_TYPE.spend, { senderId, ...R.head(arguments), payload })
  // Build transaction using sdk (if nativeMode) or build on `AETERNITY NODE` side
  const { tx } = this.nativeMode
    ? {
      tx: TxObject({
        params: R.merge(R.head(arguments), {
          recipientId,
          senderId,
          nonce,
          ttl,
          payload
        }),
        type: TX_TYPE.spend
      }).encodedTx
    }
    : await this.api.postSpend(R.merge(R.head(arguments), {
      amount: parseInt(amount),
      recipientId,
      senderId,
      nonce,
      ttl,
      fee: parseInt(fee),
      payload
    }))

  return tx
}

async function namePreclaimTx ({ accountId, commitmentId }) {
  // Calculate fee, get absolute ttl (ttl + height), get account nonce
  const { fee, ttl, nonce } = await this.prepareTxParams(TX_TYPE.namePreClaim, { senderId: accountId, ...R.head(arguments) })

  // Build transaction using sdk (if nativeMode) or build on `AETERNITY NODE` side
  const { tx } = this.nativeMode
    ? {
      tx: TxObject({
        params: R.merge(R.head(arguments), { nonce, ttl, fee }),
        type: TX_TYPE.namePreClaim
      }).encodedTx
    }
    : await this.api.postNamePreclaim(R.merge(R.head(arguments), { nonce, ttl, fee: parseInt(fee) }))

  return tx
}

async function nameClaimTx ({ accountId, name, nameSalt, vsn = 2 }) {
  // Calculate fee, get absolute ttl (ttl + height), get account nonce
  const { fee, ttl, nonce } = await this.prepareTxParams(TX_TYPE.nameClaim, { senderId: accountId, ...R.head(arguments), vsn })

  // Build transaction using sdk (if nativeMode) or build on `AETERNITY NODE` side
  const { tx } = this.nativeMode
    ? {
      tx: TxObject({
        params: R.merge(R.head(arguments), { nonce, ttl, fee, vsn }),
        type: TX_TYPE.nameClaim
      }).encodedTx
    }
    : await this.api.postNameClaim(R.merge(R.head(arguments), { nonce, ttl, fee: parseInt(fee) }))

  return tx
}

async function nameTransferTx ({ accountId, nameId, recipientId }) {
  // Calculate fee, get absolute ttl (ttl + height), get account nonce
  const { fee, ttl, nonce } = await this.prepareTxParams(TX_TYPE.nameTransfer, { senderId: accountId, ...R.head(arguments) })

  // Build transaction using sdk (if nativeMode) or build on `AETERNITY NODE` side
  const { tx } = this.nativeMode
    ? {
      tx: TxObject({
        params: R.merge(R.head(arguments), { recipientId, nonce, ttl, fee }),
        type: TX_TYPE.nameTransfer
      }).encodedTx
    }
    : await this.api.postNameTransfer(R.merge(R.head(arguments), { recipientId, nonce, ttl, fee: parseInt(fee) }))

  return tx
}

async function nameUpdateTx ({ accountId, nameId, nameTtl, pointers, clientTtl }) {
  // Calculate fee, get absolute ttl (ttl + height), get account nonce
  const { fee, ttl, nonce } = await this.prepareTxParams(TX_TYPE.nameUpdate, { senderId: accountId, ...R.head(arguments) })

  // Build transaction using sdk (if nativeMode) or build on `AETERNITY NODE` side
  const { tx } = this.nativeMode
    ? {
      tx: TxObject({
        params: R.merge(R.head(arguments), { nonce, ttl, fee }),
        type: TX_TYPE.nameUpdate
      }).encodedTx
    }
    : await this.api.postNameUpdate(R.merge(R.head(arguments), { nonce, ttl, fee: parseInt(fee) }))

  return tx
}

async function nameRevokeTx ({ accountId, nameId }) {
  // Calculate fee, get absolute ttl (ttl + height), get account nonce
  const { fee, ttl, nonce } = await this.prepareTxParams(TX_TYPE.nameRevoke, { senderId: accountId, ...R.head(arguments) })

  // Build transaction using sdk (if nativeMode) or build on `AETERNITY NODE` side
  const { tx } = this.nativeMode
    ? {
      tx: TxObject({
        params: R.merge(R.head(arguments), { nonce, ttl, fee }),
        type: TX_TYPE.nameRevoke
      }).encodedTx
    }
    : await this.api.postNameRevoke(R.merge(R.head(arguments), { nonce, ttl, fee: parseInt(fee) }))

  return tx
}

async function contractCreateTx ({ ownerId, code, vmVersion, abiVersion, deposit, amount, gas, gasPrice = MIN_GAS_PRICE, callData, backend }) {
  // Get VM_ABI version
  const ctVersion = this.getVmVersion(TX_TYPE.contractCreate, R.head(arguments))
  // Calculate fee, get absolute ttl (ttl + height), get account nonce
  const { fee, ttl, nonce } = await this.prepareTxParams(TX_TYPE.contractCreate, { senderId: ownerId, ...R.head(arguments), ctVersion, gasPrice })
  // Build transaction using sdk (if nativeMode) or build on `AETERNITY NODE` side
  return this.nativeMode
    ? {
      ...{
        tx: TxObject({
          params: R.merge(R.head(arguments), { nonce, ttl, fee, ctVersion, gasPrice }),
          type: TX_TYPE.contractCreate
        }).encodedTx
      },
      contractId: buildContractId(ownerId, nonce)
    }
    : this.api.postContractCreate(R.merge(R.head(arguments), { nonce, ttl, fee: parseInt(fee), gas: parseInt(gas), gasPrice, vmVersion: ctVersion.vmVersion, abiVersion: ctVersion.abiVersion }))
}

async function contractCallTx ({ callerId, contractId, abiVersion, amount, gas, gasPrice = MIN_GAS_PRICE, callData, backend }) {
  const ctVersion = this.getVmVersion(TX_TYPE.contractCall, R.head(arguments))
  // Calculate fee, get absolute ttl (ttl + height), get account nonce
  const { fee, ttl, nonce } = await this.prepareTxParams(TX_TYPE.contractCall, { senderId: callerId, ...R.head(arguments), gasPrice, abiVersion: ctVersion.abiVersion })

  // Build transaction using sdk (if nativeMode) or build on `AETERNITY NODE` side
  const { tx } = this.nativeMode
    ? {
      tx: TxObject({
        params: R.merge(R.head(arguments), { nonce, ttl, fee, abiVersion: ctVersion.abiVersion, gasPrice }),
        type: TX_TYPE.contractCall
      }).encodedTx
    }
    : await this.api.postContractCall(R.merge(R.head(arguments), {
      nonce,
      ttl,
      fee: parseInt(fee),
      gas: parseInt(gas),
      gasPrice,
      abiVersion: ctVersion.abiVersion
    }))

  return tx
}

async function oracleRegisterTx ({ accountId, queryFormat, responseFormat, queryFee, oracleTtl, abiVersion = ABI_VERSIONS.NO_ABI }) {
  // const { abiVersion: abi } = this.getVmVersion(TX_TYPE.oracleRegister, R.head(arguments))
  // Calculate fee, get absolute ttl (ttl + height), get account nonce
  const { fee, ttl, nonce } = await this.prepareTxParams(TX_TYPE.oracleRegister, { senderId: accountId, ...R.head(arguments), abiVersion })
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
  const { fee, ttl, nonce } = await this.prepareTxParams(TX_TYPE.oracleExtend, { senderId: callerId, ...R.head(arguments) })

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
  const { fee, ttl, nonce } = await this.prepareTxParams(TX_TYPE.oracleQuery, { senderId, ...R.head(arguments) })

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
  const { fee, ttl, nonce } = await this.prepareTxParams(TX_TYPE.oracleResponse, { senderId: callerId, ...R.head(arguments) })

  // Build transaction using sdk (if nativeMode) or build on `AETERNITY NODE` side
  const { tx } = this.nativeMode
    ? {
      tx: TxObject({
        params: { oracleId, responseTtl, queryId, response, fee, ttl, nonce },
        type: TX_TYPE.oracleResponse
      }).encodedTx
    }
    : await this.api.postOracleRespond({ oracleId, responseTtl, queryId, response, fee: parseInt(fee), ttl, nonce })
  return tx
}

async function channelCloseSoloTx ({ channelId, fromId, payload, poi }) {
  // Calculate fee, get absolute ttl (ttl + height), get account nonce
  const { fee, ttl, nonce } = await this.prepareTxParams(TX_TYPE.channelCloseSolo, { senderId: fromId, ...R.head(arguments), payload })

  // Build transaction using sdk (if nativeMode) or build on `AETERNITY NODE` side
  const { tx } = this.nativeMode
    ? buildTx(R.merge(R.head(arguments), {
      channelId,
      fromId,
      payload,
      poi,
      ttl,
      fee,
      nonce
    }), TX_TYPE.channelCloseSolo)
    : await this.api.postChannelCloseSolo(R.merge(R.head(arguments), {
      channelId,
      fromId,
      payload,
      poi,
      ttl,
      fee: parseInt(fee),
      nonce
    }))

  return tx
}

async function channelSlashTx ({ channelId, fromId, payload, poi }) {
  // Calculate fee, get absolute ttl (ttl + height), get account nonce
  const { fee, ttl, nonce } = await this.prepareTxParams(TX_TYPE.channelSlash, { senderId: fromId, ...R.head(arguments), payload })

  // Build transaction using sdk (if nativeMode) or build on `AETERNITY NODE` side
  const { tx } = this.nativeMode
    ? buildTx(R.merge(R.head(arguments), {
      channelId,
      fromId,
      payload,
      poi,
      ttl,
      fee,
      nonce
    }), TX_TYPE.channelSlash)
    : await this.api.postChannelSlash(R.merge(R.head(arguments), {
      channelId,
      fromId,
      payload,
      poi,
      ttl,
      fee: parseInt(fee),
      nonce
    }))

  return tx
}

async function channelSettleTx ({ channelId, fromId, initiatorAmountFinal, responderAmountFinal }) {
  // Calculate fee, get absolute ttl (ttl + height), get account nonce
  const { fee, ttl, nonce } = await this.prepareTxParams(TX_TYPE.channelSettle, { senderId: fromId, ...R.head(arguments) })

  // Build transaction using sdk (if nativeMode) or build on `AETERNITY NODE` side
  const { tx } = this.nativeMode
    ? buildTx(R.merge(R.head(arguments), {
      channelId,
      fromId,
      initiatorAmountFinal,
      responderAmountFinal,
      ttl,
      fee,
      nonce
    }), TX_TYPE.channelSettle)
    : await this.api.postChannelSettle(R.merge(R.head(arguments), {
      channelId,
      fromId,
      initiatorAmountFinal: parseInt(initiatorAmountFinal),
      responderAmountFinal: parseInt(responderAmountFinal),
      ttl,
      fee: parseInt(fee),
      nonce
    }))

  return tx
}

async function channelSnapshotSoloTx ({ channelId, fromId, payload }) {
  // Calculate fee, get absolute ttl (ttl + height), get account nonce
  const { fee, ttl, nonce } = await this.prepareTxParams(TX_TYPE.channelSnapshotSolo, { senderId: fromId, ...R.head(arguments), payload })

  // Build transaction using sdk (if nativeMode) or build on `AETERNITY NODE` side
  const { tx } = this.nativeMode
    ? buildTx(R.merge(R.head(arguments), {
      channelId,
      fromId,
      payload,
      ttl,
      fee,
      nonce
    }), TX_TYPE.channelSnapshotSolo)
    : await this.api.postChannelSnapshotSolo(R.merge(R.head(arguments), {
      channelId,
      fromId,
      payload,
      ttl,
      fee: parseInt(fee),
      nonce
    }))

  return tx
}

async function gaAttachTx ({ ownerId, code, vmVersion, abiVersion, authFun, gas, gasPrice = MIN_GAS_PRICE, callData, backend }) {
  // Get VM_ABI version
  const ctVersion = this.getVmVersion(TX_TYPE.contractCreate, R.head(arguments))
  // Calculate fee, get absolute ttl (ttl + height), get account nonce
  const { fee, ttl, nonce } = await this.prepareTxParams(TX_TYPE.gaAttach, { senderId: ownerId, ...R.head(arguments), ctVersion, gasPrice })
  // Build transaction using sdk (if nativeMode) or build on `AETERNITY NODE` side
  return {
    ...{ tx: TxObject({ params: R.merge(R.head(arguments), { nonce, ttl, fee, ctVersion, gasPrice }), type: TX_TYPE.gaAttach }).encodedTx },
    contractId: buildContractId(ownerId, nonce)
  }
}

/**
 * Validated vm/abi version or get default based on transaction type and NODE version
 *
 * @param {string} txType Type of transaction
 * @param {object} vmAbi Object with vm and abi version fields
 * @return {object} Object with vm/abi version ({ vmVersion: number, abiVersion: number, backend: string })
 */
function getVmVersion (txType, { vmVersion, abiVersion, backend } = {}) {
  const { consensusProtocolVersion } = this.getNodeInfo()
  const supportedProtocol = PROTOCOL_VM_ABI[consensusProtocolVersion]
  if (!supportedProtocol) throw new Error('Not supported consensus protocol version')
  const protocolForTX = supportedProtocol[txType]
  if (!protocolForTX) throw new Error('Not supported tx type')

  const ctVersion = {
    abiVersion: abiVersion !== undefined ? abiVersion : backend === VM_TYPE.AEVM ? protocolForTX.abiVersion[1] : backend === VM_TYPE.FATE ? protocolForTX.abiVersion[0] : protocolForTX.abiVersion[0],
    vmVersion: vmVersion !== undefined ? vmVersion : backend === VM_TYPE.AEVM ? protocolForTX.vmVersion[1] : backend === VM_TYPE.FATE ? protocolForTX.vmVersion[0] : protocolForTX.vmVersion[0]
  }
  if (protocolForTX.vmVersion.length && !R.contains(ctVersion.vmVersion, protocolForTX.vmVersion)) throw new Error(`VM VERSION ${ctVersion.vmVersion} do not support by this node. Supported: [${protocolForTX.vmVersion}]`)
  if (protocolForTX.abiVersion.length && !R.contains(ctVersion.abiVersion, protocolForTX.abiVersion)) throw new Error(`ABI VERSION ${ctVersion.abiVersion} do not support by this node. Supported: [${protocolForTX.abiVersion}]`)

  return ctVersion
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
  if (ttl < 0) throw new Error('ttl must be greater than 0')

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
  const { nonce: accountNonce } = await this.api.getAccountByPubkey(accountId).catch(() => ({ nonce: 0 }))
  return accountNonce + 1
}

/**
 * Calculate fee, get absolute ttl (ttl + height), get account nonce
 *
 * @param {String} txType Type of transaction
 * @param {Object} params Object which contains all tx data
 * @return {Object} { ttl, nonce, fee } Object with account nonce, absolute ttl and transaction fee
 */
async function prepareTxParams (txType, { senderId, nonce: n, ttl: t, fee: f, gas, absoluteTtl, vsn }) {
  const account = await this.getAccount(senderId).catch(e => ({ nonce: 0 }))
  // Is GA account
  if (account.contractId) {
    n = 0
  } else {
    n = n || (account.nonce + 1)
  }
  const ttl = await calculateTtl.call(this, t, !absoluteTtl)
  const fee = calculateFee(f, txType, { showWarning: this.showWarning, gas, params: R.merge(R.last(arguments), { nonce: n, ttl }), vsn })
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
    getAccountNonce,
    getVmVersion
  }
})

export default Transaction
