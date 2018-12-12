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
import JsTx from './js'
import Epoch from '../epoch'
import { encode } from '../utils/crypto'

const ORACLE_VM_VERSION = 0

async function spendTx ({ senderId, recipientId, amount, fee, ttl, nonce, payload = '' }) {
  nonce = await (calculateNonce.bind(this)(senderId, nonce))
  ttl = await (calculateTtl.bind(this)(ttl))
  fee = this.calculateFee(fee, 'spendTx', { params: R.merge(R.head(arguments), { nonce, ttl }) })

  // Build transaction using sdk (if nativeMode) or build on `EPOCH` side
  const { tx } = this.nativeMode
    ? await this.spendTxNative(R.merge(R.head(arguments), { recipientId, senderId, nonce, ttl, fee }))
    : await this.api.postSpend(R.merge(R.head(arguments), { amount: parseInt(amount), recipientId, senderId, nonce, ttl, fee: parseInt(fee) }))

  return tx
}

async function namePreclaimTx ({ accountId, nonce, commitmentId, fee, ttl }) {
  nonce = await (calculateNonce.bind(this)(accountId, nonce))
  ttl = await (calculateTtl.bind(this)(ttl))
  fee = this.calculateFee(fee, 'namePreclaimTx', { params: R.merge(R.head(arguments), { nonce, ttl }) })

  const { tx } = this.nativeMode
    ? this.namePreclaimTxNative(R.merge(R.head(arguments), { nonce, ttl, fee }))
    : await this.api.postNamePreclaim(R.merge(R.head(arguments), { nonce, ttl, fee: parseInt(fee) }))

  return tx
}

async function nameClaimTx ({ accountId, nonce, name, nameSalt, fee, ttl }) {
  nonce = await (calculateNonce.bind(this)(accountId, nonce))
  ttl = await (calculateTtl.bind(this)(ttl))
  fee = this.calculateFee(fee, 'nameClaimTx', { params: R.merge(R.head(arguments), { nonce, ttl }) })

  const { tx } = this.nativeMode
    ? this.nameClaimTxNative(R.merge(R.head(arguments), { nonce, ttl, fee }))
    : await this.api.postNameClaim(R.merge(R.head(arguments), { nonce, ttl, fee: parseInt(fee) }))

  return tx
}

async function nameTransferTx ({ accountId, nonce, nameId, recipientId, fee, ttl }) {
  nonce = await (calculateNonce.bind(this)(accountId, nonce))
  ttl = await (calculateTtl.bind(this)(ttl))
  fee = this.calculateFee(fee, 'nameTransferTx', { params: R.merge(R.head(arguments), { nonce, ttl }) })

  const { tx } = this.nativeMode
    ? this.nameTransferTxNative(R.merge(R.head(arguments), { recipientId, nonce, ttl, fee }))
    : await this.api.postNameTransfer(R.merge(R.head(arguments), { recipientId, nonce, ttl, fee: parseInt(fee) }))

  return tx
}

async function nameUpdateTx ({ accountId, nonce, nameId, nameTtl, pointers, clientTtl, fee, ttl }) {
  nonce = await (calculateNonce.bind(this)(accountId, nonce))
  ttl = await (calculateTtl.bind(this)(ttl))
  fee = this.calculateFee(fee, 'nameUpdateTx', { params: R.merge(R.head(arguments), { nonce, ttl }) })

  const { tx } = this.nativeMode
    ? this.nameUpdateTxNative(R.merge(R.head(arguments), { nonce, ttl, fee }))
    : await this.api.postNameUpdate(R.merge(R.head(arguments), { nonce, ttl, fee: parseInt(fee) }))

  return tx
}

async function nameRevokeTx ({ accountId, nonce, nameId, fee, ttl }) {
  nonce = await (calculateNonce.bind(this)(accountId, nonce))
  ttl = await (calculateTtl.bind(this)(ttl))
  fee = this.calculateFee(fee, 'nameRevokeTx', { params: R.merge(R.head(arguments), { nonce, ttl }) })

  const { tx } = this.nativeMode
    ? this.nameRevokeTxNative(R.merge(R.head(arguments), { nonce, ttl, fee }))
    : await this.api.postNameRevoke(R.merge(R.head(arguments), { nonce, ttl, fee: parseInt(fee) }))

  return tx
}

async function contractCreateTx ({ ownerId, nonce, code, vmVersion, deposit, amount, gas, gasPrice, fee, ttl, callData }) {
  nonce = await (calculateNonce.bind(this)(ownerId, nonce))
  ttl = await (calculateTtl.bind(this)(ttl))
  fee = this.calculateFee(fee, 'contractCreateTx', { gas, params: R.merge(R.head(arguments), { nonce, ttl }) })

  return this.nativeMode
    ? this.contractCreateTxNative(R.merge(R.head(arguments), { nonce, ttl, fee }))
    : this.api.postContractCreate(R.merge(R.head(arguments), { nonce, ttl, fee: parseInt(fee), gas: parseInt(gas) }))
}

async function contractCallTx ({ callerId, nonce, contractId, vmVersion, fee, ttl, amount, gas, gasPrice, callData }) {
  nonce = await (calculateNonce.bind(this)(callerId, nonce))
  ttl = await (calculateTtl.bind(this)(ttl))
  fee = this.calculateFee(fee, 'contractCallTx', { gas, params: R.merge(R.head(arguments), { nonce, ttl }) })

  const { tx } = this.nativeMode
    ? await this.contractCallTxNative(R.merge(R.head(arguments), { nonce, ttl, fee }))
    : await this.api.postContractCall(R.merge(R.head(arguments), { nonce, ttl, fee: parseInt(fee), gas: parseInt(gas) }))

  return tx
}

async function contractCallComputeTx ({ callerId, nonce, contractId, vmVersion, fee, ttl, amount, gas, gasPrice, fn, args, call }) {
  nonce = await (calculateNonce.bind(this)(callerId, nonce))
  ttl = await (calculateTtl.bind(this)(ttl))
  fee = this.calculateFee(fee, 'contractCallComputeTx', gas)

  // If we pass `call` make a type-checked call and ignore `fn` and `args` params
  const callOpt = call ? { call } : { 'function': fn, 'arguments': args }

  return (await this.api.postContractCallCompute({ callerId, contractId, vmVersion, fee: parseInt(fee), amount, gas, gasPrice, nonce, ttl, ...callOpt })).tx
}

async function oracleRegisterTx ({ accountId, queryFormat, responseFormat, queryFee, oracleTtl, fee, ttl, nonce, vmVersion = ORACLE_VM_VERSION }) {
  nonce = await (calculateNonce.bind(this)(accountId, nonce))
  ttl = await (calculateTtl.bind(this)(ttl))
  fee = this.calculateFee(fee, 'oracleRegisterTx')

  const { tx } = this.nativeMode
    ? await this.oracleRegisterTxNative({ accountId, queryFee, vmVersion, fee, oracleTtl, nonce, ttl, queryFormat, responseFormat })
    : await this.api.postOracleRegister({ accountId, queryFee, vmVersion, fee: parseInt(fee), oracleTtl, nonce, ttl, queryFormat, responseFormat })

  return tx
}

async function oracleExtendTx ({ oracleId, callerId, fee, oracleTtl, nonce, ttl }) {
  nonce = await (calculateNonce.bind(this)(callerId, nonce))
  ttl = await (calculateTtl.bind(this)(ttl))
  fee = this.calculateFee(fee, 'oracleExtendTx')

  const { tx } = this.nativeMode
    ? await this.oracleExtendTxNative({ oracleId, fee, oracleTtl, nonce, ttl })
    : await this.api.postOracleExtend({ oracleId, fee: parseInt(fee), oracleTtl, nonce, ttl })

  return tx
}

async function oraclePostQueryTx ({ oracleId, responseTtl, query, queryTtl, fee, queryFee, ttl, nonce, senderId }) {
  nonce = await (calculateNonce.bind(this)(senderId, nonce))
  ttl = await (calculateTtl.bind(this)(ttl))
  fee = this.calculateFee(fee, 'oraclePostQueryTx')

  const { tx } = this.nativeMode
    ? await this.oraclePostQueryTxNative({ oracleId, responseTtl, query, queryTtl, fee, queryFee, ttl, nonce, senderId })
    : await this.api.postOracleQuery({ oracleId, responseTtl, query, queryTtl, fee: parseInt(fee), queryFee, ttl, nonce, senderId })

  return { tx, queryId: this.oracleQueryId(senderId, nonce, oracleId) }
}

async function oracleRespondTx ({ oracleId, callerId, responseTtl, queryId, response, fee, ttl, nonce }) {
  nonce = await (calculateNonce.bind(this)(callerId, nonce))
  ttl = await (calculateTtl.bind(this)(ttl))
  fee = this.calculateFee(fee, 'oracleRespondTx')

  const { tx } = this.nativeMode
    ? await this.oracleRespondQueryTxNative({ oracleId, responseTtl, queryId, response, fee, ttl, nonce })
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
 * Select specific account
 * @instance
 * @rtype (fee, txtype, gas = 0) => String
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
    'nameRevokeTx': BASE_GAS,
  }

  function getGasBySize (size) {
    return GAS_PER_BYTE * (size + FEE_BYTE_SIZE)
  }

  if (!fee) {
    if (!params) return this.fee

    const txWithOutFee = this[`${txType}Native`](params, false).tx.filter(e => e !== undefined)
    const txSize = encode(txWithOutFee).length
    // console.log('-----------------------------------------')
    // console.log('------------' + txType + '-----------------------')
    // console.log(params)
    // console.log(txSize)
    // console.log(TX_FEE_FORMULA[txType] ? TX_FEE_FORMULA[txType] + getGasBySize(txSize) : this.fee)
    // console.log('///-----------------------------------------/////')

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
const Transaction = Epoch.compose(Tx, JsTx, {
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
    contractCallComputeTx,
    calculateFee,
    oracleRegisterTx,
    oracleExtendTx,
    oraclePostQueryTx,
    oracleRespondTx
  }
})

export default Transaction
