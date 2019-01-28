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
import { buildTx, calculateFee } from './builder'
import Epoch from '../epoch'
import { TX_TYPE } from './schema'
import { buildContractId, oracleQueryId } from './helpers'

const ORACLE_VM_VERSION = 0
const CONTRACT_VM_VERSION = 1

async function spendTx ({ senderId, recipientId, amount, payload = '' }) {
  // Calculate fee, get absolute ttl (ttl + height), get account nonce
  const { fee, ttl, nonce } = await this.prepareTxParams(TX_TYPE.spend, { senderId, ...R.head(arguments) })

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

async function contractCreateTx ({ ownerId, code, vmVersion = CONTRACT_VM_VERSION, deposit, amount, gas, gasPrice, callData }) {
  // Calculate fee, get absolute ttl (ttl + height), get account nonce
  const { fee, ttl, nonce } = await this.prepareTxParams(TX_TYPE.contractCreate, { vmVersion: CONTRACT_VM_VERSION, senderId: ownerId, ...R.head(arguments) })

  // Build transaction using sdk (if nativeMode) or build on `AETERNITY NODE` side
  return this.nativeMode
    ? {
      ...buildTx(R.merge(R.head(arguments), { nonce, ttl, fee }), TX_TYPE.contractCreate),
      contractId: buildContractId(ownerId, nonce)
    }
    : this.api.postContractCreate(R.merge(R.head(arguments), { nonce, ttl, fee: parseInt(fee), gas: parseInt(gas) }))
}

async function contractCallTx ({ callerId, contractId, vmVersion, amount, gas, gasPrice, callData }) {
  // Calculate fee, get absolute ttl (ttl + height), get account nonce
  const { fee, ttl, nonce } = await this.prepareTxParams(TX_TYPE.contractCall, { senderId: callerId, ...R.head(arguments) })

  // Build transaction using sdk (if nativeMode) or build on `AETERNITY NODE` side
  const { tx } = this.nativeMode
    ? buildTx(R.merge(R.head(arguments), { nonce, ttl, fee }), TX_TYPE.contractCall)
    : await this.api.postContractCall(R.merge(R.head(arguments), {
      nonce,
      ttl,
      fee: parseInt(fee),
      gas: parseInt(gas)
    }))

  return tx
}

async function oracleRegisterTx ({ accountId, queryFormat, responseFormat, queryFee, oracleTtl, vmVersion = ORACLE_VM_VERSION }) {
  // Calculate fee, get absolute ttl (ttl + height), get account nonce
  const { fee, ttl, nonce } = await this.prepareTxParams(TX_TYPE.oracleRegister, { vmVersion: ORACLE_VM_VERSION, senderId: accountId, ...R.head(arguments) })
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
  const fee = calculateFee(f, txType, { gas, params: R.merge(R.last(arguments), { nonce, ttl }) })
  return { fee, ttl, nonce }
}

/**
 * Transaction Stamp
 *
 * This implementation of {@link module:@aeternity/aepp-sdk/es/tx--Tx} relays
 * the creation of transactions to {@link module:@aeternity/aepp-sdk/es/epoch--Epoch}.
 * This stamp provide ability to create native spend transaction,
 * all other transaction's using Epoch API.
 * As there is no built-in security between Epoch and client communication, it
 * must never be used for production but can be very useful to verify other
 * implementations.
 * @function
 * @alias module:@aeternity/aepp-sdk/es/tx/tx
 * @rtype Stamp
 * @param {Object} [options={}] - Initializer object
 * @param {Object} [options.nativeMode] - Use Native build of transaction's
 * @param {Object} [options.url] - Node url
 * @param {Object} [options.internalUrl] - Node internal url
 * @return {Object} Transaction instance
 * @example Transaction({url: 'https://sdk-testnet.aepps.com/'})
 */
const Transaction = Epoch.compose(Tx, {
  init ({ nativeMode = true }) {
    this.nativeMode = nativeMode
  },
  props: {
    nativeMode: null
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
