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
import * as TxBuilder from './js'
import * as TxBuilderNew from './tx_builder'
import Epoch from '../epoch'
import { encode } from '../utils/crypto'
import { TX_TYPE } from './schema'

const ORACLE_VM_VERSION = 0

async function spendTx ({ senderId, recipientId, amount, payload = '' }) {
  // Calculate fee, get absolute ttl (ttl + height), get account nonce
  const { fee, ttl, nonce } = await this.prepareTxParams('spendTx', { senderId, ...R.head(arguments) })

  // Build transaction using sdk (if nativeMode) or build on `EPOCH` side
  const { tx } = this.nativeMode
    ? TxBuilderNew.buildTx(R.merge(R.head(arguments), {
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
  const { fee, ttl, nonce } = await this.prepareTxParams('namePreclaimTx', { senderId: accountId, ...R.head(arguments) })

  // Build transaction using sdk (if nativeMode) or build on `EPOCH` side
  const { tx } = this.nativeMode
    ? TxBuilderNew.buildTx(R.merge(R.head(arguments), { nonce, ttl, fee }), TX_TYPE.namePreClaim)
    : await this.api.postNamePreclaim(R.merge(R.head(arguments), { nonce, ttl, fee: parseInt(fee) }))

  return tx
}

async function nameClaimTx ({ accountId, name, nameSalt }) {
  // Calculate fee, get absolute ttl (ttl + height), get account nonce
  const { fee, ttl, nonce } = await this.prepareTxParams('nameClaimTx', { senderId: accountId, ...R.head(arguments) })

  // Build transaction using sdk (if nativeMode) or build on `EPOCH` side
  const { tx } = this.nativeMode
    ? TxBuilderNew.buildTx(R.merge(R.head(arguments), { nonce, ttl, fee }), TX_TYPE.nameClaim)
    : await this.api.postNameClaim(R.merge(R.head(arguments), { nonce, ttl, fee: parseInt(fee) }))

  return tx
}

async function nameTransferTx ({ accountId, nameId, recipientId }) {
  // Calculate fee, get absolute ttl (ttl + height), get account nonce
  const { fee, ttl, nonce } = await this.prepareTxParams('nameTransferTx', { senderId: accountId, ...R.head(arguments) })

  // Build transaction using sdk (if nativeMode) or build on `EPOCH` side
  const { tx } = this.nativeMode
    ? TxBuilderNew.buildTx(R.merge(R.head(arguments), { recipientId, nonce, ttl, fee }), TX_TYPE.nameTransfer)
    : await this.api.postNameTransfer(R.merge(R.head(arguments), { recipientId, nonce, ttl, fee: parseInt(fee) }))

  return tx
}

async function nameUpdateTx ({ accountId, nameId, nameTtl, pointers, clientTtl }) {
  // Calculate fee, get absolute ttl (ttl + height), get account nonce
  const { fee, ttl, nonce } = await this.prepareTxParams('nameUpdateTx', { senderId: accountId, ...R.head(arguments) })

  // Build transaction using sdk (if nativeMode) or build on `EPOCH` side
  const { tx } = this.nativeMode
    ? TxBuilderNew.buildTx(R.merge(R.head(arguments), { nonce, ttl, fee }), TX_TYPE.nameUpdate)
    : await this.api.postNameUpdate(R.merge(R.head(arguments), { nonce, ttl, fee: parseInt(fee) }))

  return tx
}

async function nameRevokeTx ({ accountId, nameId }) {
  // Calculate fee, get absolute ttl (ttl + height), get account nonce
  const { fee, ttl, nonce } = await this.prepareTxParams('nameRevokeTx', { senderId: accountId, ...R.head(arguments) })

  // Build transaction using sdk (if nativeMode) or build on `EPOCH` side
  const { tx } = this.nativeMode
    ? TxBuilderNew.buildTx(R.merge(R.head(arguments), { nonce, ttl, fee }), TX_TYPE.nameRevoke)
    : await this.api.postNameRevoke(R.merge(R.head(arguments), { nonce, ttl, fee: parseInt(fee) }))

  return tx
}

async function contractCreateTx ({ ownerId, code, vmVersion, deposit, amount, gas, gasPrice, callData }) {
  // Calculate fee, get absolute ttl (ttl + height), get account nonce
  const { fee, ttl, nonce } = await this.prepareTxParams('contractCreateTx', { senderId: ownerId, ...R.head(arguments) })

  // Build transaction using sdk (if nativeMode) or build on `EPOCH` side
  return this.nativeMode
    ? {
      ...TxBuilderNew.buildTx(R.merge(R.head(arguments), { nonce, ttl, fee }), TX_TYPE.contractCreate),
      contractId: TxBuilderNew.buildContractId(ownerId, nonce)
    }
    : this.api.postContractCreate(R.merge(R.head(arguments), { nonce, ttl, fee: parseInt(fee), gas: parseInt(gas) }))
}

async function contractCallTx ({ callerId, contractId, vmVersion, amount, gas, gasPrice, callData }) {
  // Calculate fee, get absolute ttl (ttl + height), get account nonce
  const { fee, ttl, nonce } = await this.prepareTxParams('contractCallTx', { senderId: callerId, ...R.head(arguments) })

  // Build transaction using sdk (if nativeMode) or build on `EPOCH` side
  const { tx } = this.nativeMode
    ? TxBuilderNew.buildTx(R.merge(R.head(arguments), { nonce, ttl, fee }), TX_TYPE.contractCall)
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
  const { fee, ttl, nonce } = await this.prepareTxParams('oracleRegisterTx', { senderId: accountId, ...R.head(arguments) })

  // Build transaction using sdk (if nativeMode) or build on `EPOCH` side
  const { tx } = this.nativeMode
    ? TxBuilder.oracleRegisterTxNative({
      accountId,
      queryFee,
      vmVersion,
      fee,
      oracleTtl,
      nonce,
      ttl,
      queryFormat,
      responseFormat
    })
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
  const { fee, ttl, nonce } = await this.prepareTxParams('oracleExtendTx', { senderId: callerId, ...R.head(arguments) })

  // Build transaction using sdk (if nativeMode) or build on `EPOCH` side
  const { tx } = this.nativeMode
    ? TxBuilder.oracleExtendTxNative({ oracleId, fee, oracleTtl, nonce, ttl })
    : await this.api.postOracleExtend({ oracleId, fee: parseInt(fee), oracleTtl, nonce, ttl })

  return tx
}

async function oraclePostQueryTx ({ oracleId, responseTtl, query, queryTtl, queryFee, senderId }) {
  // Calculate fee, get absolute ttl (ttl + height), get account nonce
  const { fee, ttl, nonce } = await this.prepareTxParams('oraclePostQueryTx', { senderId, ...R.head(arguments) })

  // Build transaction using sdk (if nativeMode) or build on `EPOCH` side
  const { tx } = this.nativeMode
    ? TxBuilder.oraclePostQueryTxNative({ oracleId, responseTtl, query, queryTtl, fee, queryFee, ttl, nonce, senderId })
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

  return { tx, queryId: TxBuilder.oracleQueryId(senderId, nonce, oracleId) }
}

async function oracleRespondTx ({ oracleId, callerId, responseTtl, queryId, response }) {
  // Calculate fee, get absolute ttl (ttl + height), get account nonce
  const { fee, ttl, nonce } = await this.prepareTxParams('oracleRespondQueryTx', { senderId: callerId, ...R.head(arguments) })

  // Build transaction using sdk (if nativeMode) or build on `EPOCH` side
  const { tx } = this.nativeMode
    ? TxBuilder.oracleRespondQueryTxNative({ oracleId, responseTtl, queryId, response, fee, ttl, nonce })
    : await this.api.postOracleRespond({ oracleId, responseTtl, queryId, response, fee: parseInt(fee), ttl, nonce })
  return tx
}

/**
 * Compute the absolute ttl by adding the ttl to the current height of the chain
 *
 * @param {number} relativeTtl
 * @return {number} Absolute Ttl
 */
async function calculateTtl (relativeTtl = 0) {
  if (relativeTtl < 0) throw new Error('ttl must be greater than 0')
  if (relativeTtl === 0) return 0

  const { height } = await this.api.getCurrentKeyBlock()
  return +(height) + relativeTtl
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
    return +(await this.api.getAccountByPubkey(accountId)).nonce + 1
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
async function prepareTxParams (txType, { senderId, nonce: n, ttl: t, fee: f, gas }) {
  const nonce = await (calculateNonce.bind(this)(senderId, n))
  const ttl = await (calculateTtl.bind(this)(t))
  const fee = this.calculateFee(f, txType, { gas, params: R.merge(R.last(arguments), { nonce, ttl }) })
  return { fee, ttl, nonce }
}

/**
 * Calculate fee
 * @instance
 * @rtype (fee, txType, gas = 0) => String
 * @param {String|Number} fee - fee
 * @param {String} txType - Transaction type
 * @param {Options} options - Options object
 * @param {String|Number} options.gas - Gas amount
 * @param {Object} options.params - Tx params
 * @return {String}
 * @example calculateFee(null, 'spendtx')
 */
function calculateFee (fee, txType, { gas = 0, params } = {}) {
  const BASE_GAS = 15000
  const GAS_PER_BYTE = 20
  const FEE_BYTE_SIZE = 8

  // MAP WITH FEE CALCULATION https://github.com/aeternity/protocol/blob/epoch-v1.0.0-rc6/consensus/consensus.md#gas
  const TX_FEE_FORMULA = {
    'spendTx': BASE_GAS,
    'contractCreateTx': 5 * BASE_GAS + gas,
    'contractCallTx': 30 * BASE_GAS + gas,
    'nameTransferTx': BASE_GAS,
    'nameUpdateTx': BASE_GAS,
    'nameClaimTx': BASE_GAS,
    'namePreclaimTx': BASE_GAS,
    'nameRevokeTx': BASE_GAS
  }

  function getGasBySize (size) {
    return GAS_PER_BYTE * (size + FEE_BYTE_SIZE)
  }

  if (!fee) {
    // TODO remove that after implement oracle fee calculation
    if (!params) return this.fee

    const txWithOutFee = TxBuilder[`${txType}Native`](params, false).tx.filter(e => e !== undefined)
    const txSize = encode(txWithOutFee).length

    return TX_FEE_FORMULA[txType] ? TX_FEE_FORMULA[txType] + getGasBySize(txSize) : this.fee
  }
  return fee
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
    fee: 20000,
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
    calculateFee,
    prepareTxParams,
    oracleRegisterTx,
    oracleExtendTx,
    oraclePostQueryTx,
    oracleRespondTx
  }
})

export default Transaction
