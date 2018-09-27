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
 * Epoch Tx module
 * @module @aeternity/aepp-sdk/es/tx/epoch
 * @export EpochTx
 * @example import EpochTx from '@aeternity/aepp-sdk/es/tx/epoch'
 */

import Tx from './'
import Epoch from '../epoch'
import * as R from 'ramda'
import { salt } from '../utils/crypto'

const createSalt = salt

async function spendTx ({ senderId, recipientId, amount, fee, ttl, nonce, payload }) {
  nonce = await (calculateNonce.bind(this)(senderId))
  return (await this.api.postSpend(R.merge(R.head(arguments), {recipientId, nonce}))).tx
}

async function namePreclaimTx ({ accountId, nonce, commitmentId, fee, ttl }) {
  nonce = await (calculateNonce.bind(this)(accountId))
  return (await this.api.postNamePreclaim(R.merge(R.head(arguments), {nonce}))).tx
}

async function nameClaimTx ({ accountId, nonce, name, nameSalt, fee, ttl }) {
  nonce = await (calculateNonce.bind(this)(accountId))
  return (await this.api.postNameClaim(R.merge(R.head(arguments), {nonce}))).tx
}

async function nameTransferTx ({ accountId, nonce, nameId, recipientId, fee, ttl }) {
  nonce = await (calculateNonce.bind(this)(accountId))
  return (await this.api.postNameTransfer(R.merge(R.head(arguments), {recipientId, nonce}))).tx
}

async function nameUpdateTx ({ accountId, nonce, nameId, nameTtl, pointers, clientTtl, fee, ttl }) {
  nonce = await (calculateNonce.bind(this)(accountId))
  return (await this.api.postNameUpdate(R.merge(R.head(arguments), {nonce}))).tx
}

async function nameRevokeTx ({ accountId, nonce, nameId, fee, ttl }) {
  nonce = await (calculateNonce.bind(this)(accountId))
  return (await this.api.postNameRevoke(R.merge(R.head(arguments), {nonce}))).tx
}

async function contractCreateTx ({ ownerId, nonce, code, vmVersion, deposit, amount, gas, gasPrice, fee, ttl, callData }) {
  nonce = await (calculateNonce.bind(this)(ownerId))
  return this.api.postContractCreate(R.merge(R.head(arguments), {nonce}))
}

async function contractCallTx ({ callerId, nonce, contractId, vmVersion, fee, ttl, amount, gas, gasPrice, callData }) {
  nonce = await (calculateNonce.bind(this)(callerId))
  return (await this.api.postContractCall(R.merge(R.head(arguments), {nonce}))).tx
}

async function commitmentHash (name, salt = createSalt()) {
  return (await this.api.getCommitmentHash(name, salt)).commitmentId
}

async function calculateNonce(accountId) {
  return +(await this.api.getAccountByPubkey(accountId)).nonce + 1
}

/**
 * Epoch-based Tx Stamp
 *
 * This implementation of {@link module:@aeternity/aepp-sdk/es/tx--Tx} relays
 * the creation of transactions to {@link module:@aeternity/aepp-sdk/es/epoch--Epoch}.
 * As there is no built-in security between Epoch and client communication, it
 * must never be used for production but can be very useful to verify other
 * implementations.
 * @function
 * @alias module:@aeternity/aepp-sdk/es/tx/epoch
 * @rtype Stamp
 * @param {Object} [options={}] - Initializer object
 * @return {Object} Tx instance
 * @example EpochTx({url: 'https://sdk-testnet.aepps.com/'})
 */
const EpochTx = Epoch.compose(Tx, {
  methods: {
    spendTx,
    namePreclaimTx,
    nameClaimTx,
    nameTransferTx,
    nameUpdateTx,
    nameRevokeTx,
    contractCreateTx,
    contractCallTx,
    commitmentHash,
  }
})

export default EpochTx
