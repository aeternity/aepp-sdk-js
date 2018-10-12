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

import JsTx from './js'
import Epoch from '../epoch'

import { salt } from '../utils/crypto'


const createSalt = salt

async function spendTx ({ senderId, recipientId, amount, fee, ttl, nonce, payload }) {
  nonce = await (calculateNonce.bind(this)(senderId, nonce))
  ttl = await (calculateTtl.bind(this)(ttl))

  // Build transaction using sdk (if nativeMode) or build on `EPOCH` side
  const { tx } = this.nativeMode ?
    await this.spendTxNative(R.merge(R.head(arguments), { recipientId, nonce, ttl })) :
    await this.api.postSpend(R.merge(R.head(arguments), { recipientId, nonce, ttl }))

  return tx
}

async function namePreclaimTx ({ accountId, nonce, commitmentId, fee, ttl }) {
  nonce = await (calculateNonce.bind(this)(accountId, nonce))
  ttl = await (calculateTtl.bind(this)(ttl))
  return (await this.api.postNamePreclaim(R.merge(R.head(arguments), { nonce, ttl }))).tx
}

async function nameClaimTx ({ accountId, nonce, name, nameSalt, fee, ttl }) {
  nonce = await (calculateNonce.bind(this)(accountId, nonce))
  ttl = await (calculateTtl.bind(this)(ttl))
  return (await this.api.postNameClaim(R.merge(R.head(arguments), { nonce, ttl }))).tx
}

async function nameTransferTx ({ accountId, nonce, nameId, recipientId, fee, ttl }) {
  nonce = await (calculateNonce.bind(this)(accountId, nonce))
  ttl = await (calculateTtl.bind(this)(ttl))
  return (await this.api.postNameTransfer(R.merge(R.head(arguments), { recipientId, nonce, ttl }))).tx
}

async function nameUpdateTx ({ accountId, nonce, nameId, nameTtl, pointers, clientTtl, fee, ttl }) {
  nonce = await (calculateNonce.bind(this)(accountId, nonce))
  ttl = await (calculateTtl.bind(this)(ttl))
  return (await this.api.postNameUpdate(R.merge(R.head(arguments), { nonce, ttl }))).tx
}

async function nameRevokeTx ({ accountId, nonce, nameId, fee, ttl }) {
  nonce = await (calculateNonce.bind(this)(accountId, nonce))
  ttl = await (calculateTtl.bind(this)(ttl))
  return (await this.api.postNameRevoke(R.merge(R.head(arguments), { nonce, ttl }))).tx
}

async function contractCreateTx ({ ownerId, nonce, code, vmVersion, deposit, amount, gas, gasPrice, fee, ttl, callData }) {
  nonce = await (calculateNonce.bind(this)(ownerId, nonce))
  ttl = await (calculateTtl.bind(this)(ttl))
  return this.api.postContractCreate(R.merge(R.head(arguments), { nonce, ttl }))
}

async function contractCallTx ({ callerId, nonce, contractId, vmVersion, fee, ttl, amount, gas, gasPrice, callData }) {
  nonce = await (calculateNonce.bind(this)(callerId, nonce))
  ttl = await (calculateTtl.bind(this)(ttl))
  return (await this.api.postContractCall(R.merge(R.head(arguments), { nonce, ttl }))).tx
}

async function commitmentHash (name, salt = createSalt()) {
  return (await this.api.getCommitmentHash(name, salt)).commitmentId
}

/**
 * Compute the absolute ttl by adding the ttl to the current height of the chain
 *
 * @param {number} relativeTtl
 * @return {number} Absolute Ttl
 */
async function calculateTtl (relativeTtl) {
  if (relativeTtl <= 0) throw new Error('ttl must be greather than 0')

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
 * Transaction Stamp
 *
 * This implementation of {@link module:@aeternity/aepp-sdk/es/tx--Tx} relays
 * the creation of transactions to {@link module:@aeternity/aepp-sdk/es/epoch--Epoch}.
 * As there is no built-in security between Epoch and client communication, it
 * must never be used for production but can be very useful to verify other
 * implementations.
 * @function
 * @alias module:@aeternity/aepp-sdk/es/tx/tx
 * @rtype Stamp
 * @param {Object} [options={}] - Initializer object
 * @return {Object} Transaction instance
 * @example Transaction({url: 'https://sdk-testnet.aepps.com/'})
 */
const Transaction = Epoch.compose(JsTx, {
  init({ nativeMode = true }) {
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
    commitmentHash
  }
})

export default Transaction
