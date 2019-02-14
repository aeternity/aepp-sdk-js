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

import Tx from './'
import Node from '../node'

import { buildTx, calculateFee } from './builder'
import { TX_TYPE } from './builder/schema'
import { buildContractId, oracleQueryId } from './builder/helpers'

const ORACLE_VM_VERSION = 0
const CONTRACT_VM_VERSION = 1
// TODO This values using as default for minerva node
const CONTRACT_MINERVA_VM_ABI = 196609
const CONTRACT_MINERVA_VM = 3
const CONTRACT_MINERVA_ABI = 1

async function spendTx ({ senderId, recipientId, amount, payload = '' }) {
  // Calculate fee, get absolute ttl (ttl + height), get account nonce
  const { fee, ttl, nonce } = await this.prepareTxParams(TX_TYPE.spend, { senderId, ...R.head(arguments), payload })

  // Build transaction using sdk (if nativeMode) or build on `AETERNITY NODE` side
  const { tx } = this.nativeMode
    ? buildTx(R.merge(R.head(arguments), {
      recipientId,
      senderId,
      nonce,
      ttl,
      fee,
      payload
    }), TX_TYPE.spend)
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
    ? buildTx(R.merge(R.head(arguments), { nonce, ttl, fee }), TX_TYPE.namePreClaim)
    : await this.api.postNamePreclaim(R.merge(R.head(arguments), { nonce, ttl, fee: parseInt(fee) }))

  return tx
}

async function nameClaimTx ({ accountId, name, nameSalt }) {
  // Calculate fee, get absolute ttl (ttl + height), get account nonce
  const { fee, ttl, nonce } = await this.prepareTxParams(TX_TYPE.nameClaim, { senderId: accountId, ...R.head(arguments) })

  // Build transaction using sdk (if nativeMode) or build on `AETERNITY NODE` side
  const { tx } = this.nativeMode
    ? buildTx(R.merge(R.head(arguments), { nonce, ttl, fee }), TX_TYPE.nameClaim)
    : await this.api.postNameClaim(R.merge(R.head(arguments), { nonce, ttl, fee: parseInt(fee) }))

  return tx
}

async function nameTransferTx ({ accountId, nameId, recipientId }) {
  // Calculate fee, get absolute ttl (ttl + height), get account nonce
  const { fee, ttl, nonce } = await this.prepareTxParams(TX_TYPE.nameTransfer, { senderId: accountId, ...R.head(arguments) })

  // Build transaction using sdk (if nativeMode) or build on `AETERNITY NODE` side
  const { tx } = this.nativeMode
    ? buildTx(R.merge(R.head(arguments), { recipientId, nonce, ttl, fee }), TX_TYPE.nameTransfer)
    : await this.api.postNameTransfer(R.merge(R.head(arguments), { recipientId, nonce, ttl, fee: parseInt(fee) }))

  return tx
}

async function nameUpdateTx ({ accountId, nameId, nameTtl, pointers, clientTtl }) {
  // Calculate fee, get absolute ttl (ttl + height), get account nonce
  const { fee, ttl, nonce } = await this.prepareTxParams(TX_TYPE.nameUpdate, { senderId: accountId, ...R.head(arguments) })

  // Build transaction using sdk (if nativeMode) or build on `AETERNITY NODE` side
  const { tx } = this.nativeMode
    ? buildTx(R.merge(R.head(arguments), { nonce, ttl, fee }), TX_TYPE.nameUpdate)
    : await this.api.postNameUpdate(R.merge(R.head(arguments), { nonce, ttl, fee: parseInt(fee) }))

  return tx
}

async function nameRevokeTx ({ accountId, nameId }) {
  // Calculate fee, get absolute ttl (ttl + height), get account nonce
  const { fee, ttl, nonce } = await this.prepareTxParams(TX_TYPE.nameRevoke, { senderId: accountId, ...R.head(arguments) })

  // Build transaction using sdk (if nativeMode) or build on `AETERNITY NODE` side
  const { tx } = this.nativeMode
    ? buildTx(R.merge(R.head(arguments), { nonce, ttl, fee }), TX_TYPE.nameRevoke)
    : await this.api.postNameRevoke(R.merge(R.head(arguments), { nonce, ttl, fee: parseInt(fee) }))

  return tx
}

// TODO move this to tx-builder
// Get VM_ABI version for minerva
function getContractVmVersion () {
  return this.version.split('-')[0] === '2.0.0'
    ? { splitedVmAbi: CONTRACT_MINERVA_VM_ABI, contractVmVersion: CONTRACT_MINERVA_VM }
    : { splitedVmAbi: CONTRACT_VM_VERSION, contractVmVersion: CONTRACT_VM_VERSION }
}
async function contractCreateTx ({ ownerId, code, vmVersion, abiVersion, deposit, amount, gas, gasPrice, callData }) {
  // TODO move this to tx-builder
  // Get VM_ABI version for minerva
  const { splitedVmAbi, contractVmVersion } = getContractVmVersion.bind(this)()
  // Calculate fee, get absolute ttl (ttl + height), get account nonce
  const { fee, ttl, nonce } = await this.prepareTxParams(TX_TYPE.contractCreate, { vmVersion: splitedVmAbi, senderId: ownerId, ...R.head(arguments) })

  // Build transaction using sdk (if nativeMode) or build on `AETERNITY NODE` side
  return this.nativeMode
    ? {
      ...buildTx(R.merge(R.head(arguments), { nonce, ttl, fee, vmVersion: splitedVmAbi }), TX_TYPE.contractCreate),
      contractId: buildContractId(ownerId, nonce)
    }
    : this.api.postContractCreate(R.merge(R.head(arguments), { nonce, ttl, fee: parseInt(fee), gas: parseInt(gas), vmVersion: contractVmVersion, abiVersion: CONTRACT_MINERVA_ABI }))
}

async function contractCallTx ({ callerId, contractId, vmVersion = CONTRACT_VM_VERSION, amount, gas, gasPrice, callData }) {
  // Calculate fee, get absolute ttl (ttl + height), get account nonce
  const { fee, ttl, nonce } = await this.prepareTxParams(TX_TYPE.contractCall, { vmVersion, senderId: callerId, ...R.head(arguments) })

  // Build transaction using sdk (if nativeMode) or build on `AETERNITY NODE` side
  const { tx } = this.nativeMode
    ? buildTx(R.merge(R.head(arguments), { nonce, ttl, fee, vmVersion }), TX_TYPE.contractCall)
    : await this.api.postContractCall(R.merge(R.head(arguments), {
      nonce,
      ttl,
      fee: parseInt(fee),
      gas: parseInt(gas),
      vmVersion
    }))

  return tx
}

async function oracleRegisterTx ({ accountId, queryFormat, responseFormat, queryFee, oracleTtl, vmVersion = ORACLE_VM_VERSION }) {
  // Calculate fee, get absolute ttl (ttl + height), get account nonce
  const { fee, ttl, nonce } = await this.prepareTxParams(TX_TYPE.oracleRegister, { vmVersion, senderId: accountId, ...R.head(arguments) })
  // Build transaction using sdk (if nativeMode) or build on `AETERNITY NODE` side
  const { tx } = this.nativeMode
    ? buildTx({
      accountId,
      queryFee,
      vmVersion,
      fee,
      oracleTtl,
      nonce,
      ttl,
      queryFormat,
      responseFormat
    }, TX_TYPE.oracleRegister)
    : await this.api.postOracleRegister({
      accountId,
      queryFee,
      vmVersion,
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
    ? buildTx({ oracleId, fee, oracleTtl, nonce, ttl }, TX_TYPE.oracleExtend)
    : await this.api.postOracleExtend({ oracleId, fee: parseInt(fee), oracleTtl, nonce, ttl })

  return tx
}

async function oraclePostQueryTx ({ oracleId, responseTtl, query, queryTtl, queryFee, senderId }) {
  // Calculate fee, get absolute ttl (ttl + height), get account nonce
  const { fee, ttl, nonce } = await this.prepareTxParams(TX_TYPE.oracleQuery, { senderId, ...R.head(arguments) })

  // Build transaction using sdk (if nativeMode) or build on `AETERNITY NODE` side
  const { tx } = this.nativeMode
    ? buildTx({ oracleId, responseTtl, query, queryTtl, fee, queryFee, ttl, nonce, senderId }, TX_TYPE.oracleQuery)
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

  return { tx, queryId: oracleQueryId(senderId, nonce, oracleId) }
}

async function oracleRespondTx ({ oracleId, callerId, responseTtl, queryId, response }) {
  // Calculate fee, get absolute ttl (ttl + height), get account nonce
  const { fee, ttl, nonce } = await this.prepareTxParams(TX_TYPE.oracleResponse, { senderId: callerId, ...R.head(arguments) })

  // Build transaction using sdk (if nativeMode) or build on `AETERNITY NODE` side
  const { tx } = this.nativeMode
    ? buildTx({ oracleId, responseTtl, queryId, response, fee, ttl, nonce }, TX_TYPE.oracleResponse)
    : await this.api.postOracleRespond({ oracleId, responseTtl, queryId, response, fee: parseInt(fee), ttl, nonce })
  return tx
}

/**
 * Compute the absolute ttl by adding the ttl to the current height of the chain
 *
 * @param {number} ttl
 * @param {boolean} relative ttl is absolute or relative(default: true(relative))
 * @return {number} Absolute Ttl
 */
async function calculateTtl (ttl = 0, relative = true) {
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
async function calculateNonce (accountId, nonce) {
  if (!nonce) {
    try {
      return +(await this.api.getAccountByPubkey(accountId)).nonce + 1
    } catch (e) {
      return 0
    }
  }
  return nonce
}

/**
 * Calculate fee, get absolute ttl (ttl + height), get account nonce
 *
 * @param {String} txType Type of transaction
 * @param {Object} params Object which contains all tx data
 * @return {Object} { ttl, nonce, fee } Object with account nonce, absolute ttl and transaction fee
 */
async function prepareTxParams (txType, { senderId, nonce: n, ttl: t, fee: f, gas, absoluteTtl }) {
  const nonce = await (calculateNonce.bind(this)(senderId, n))
  const ttl = await (calculateTtl.bind(this)(t, !absoluteTtl))
  const fee = calculateFee(f, txType, { showWarning: this.showWarning, gas, params: R.merge(R.last(arguments), { nonce, ttl }) })
  return { fee, ttl, nonce }
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
 * @example Transaction({url: 'https://sdk-testnet.aepps.com/'})
 */
const Transaction = Node.compose(Tx, {
  init ({ nativeMode = true, showWarning = false }) {
    this.nativeMode = nativeMode
    this.showWarning = showWarning
  },
  props: {
    nativeMode: null,
    showWarning: null
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
    oracleRespondTx
  }
})

export default Transaction
