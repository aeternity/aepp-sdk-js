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

import * as R from 'ramda'
import { salt } from '../utils/crypto'

const spend = client => async ({ sender, recipient, amount, fee, ttl, nonce, payload }) => {
  return (await client.api.postSpend(R.merge(R.head(arguments), { recipientPubkey: recipient }))).tx
}

const namePreclaim = client => async ({ account, nonce, commitment, fee, ttl }) => {
  return (await client.api.postNamePreclaim(R.head(arguments))).tx
}

const nameClaim = client => async ({ account, nonce, name, nameSalt, fee, ttl }) => {
  return (await client.api.postNameClaim(R.head(arguments))).tx
}

const nameTransfer = client => async ({ account, nonce, nameHash, recipientAccount, fee, ttl }) => {
  return (await client.api.postNameTransfer(R.merge(R.head(arguments), { recipientPubkey: recipientAccount }))).tx
}

const nameUpdate = client => async ({ account, nonce, nameHash, nameTtl, pointers, clientTtl, fee, ttl }) => {
  return (await client.api.postNameUpdate(R.head(arguments))).tx
}

const nameRevoke = client => async ({ account, nonce, nameHash, fee, ttl }) => {
  return (await client.api.postNameRevoke(R.head(arguments))).tx
}

const contractCreate = client => async ({ owner, nonce, code, vmVersion, deposit, amount, gas, gasPrice, fee, ttl, callData }) => {
  return (await client.api.postContractCreate(R.head(arguments))).tx
}

const contractCall = client => async ({ caller, nonce, contract, vmVersion, fee, ttl, amount, gas, gasPrice, callData }) => {
  return (await client.api.postContractCall(R.head(arguments))).tx
}

const commitmentHash = client => async name => {
  return (await client.api.getCommitmentHash(name, salt())).commitment
}

/**
 * Epoch transaction proxy factory
 *
 * @param {Object} client - `Epoch` client
 * @return {Tx}
 */
export default function epochTx (client) {
  return Object.freeze({
    spend: spend(client),
    namePreclaim: namePreclaim(client),
    nameClaim: nameClaim(client),
    nameTransfer: nameTransfer(client),
    nameUpdate: nameUpdate(client),
    nameRevoke: nameRevoke(client),
    contractCreate: contractCreate(client),
    contractCall: contractCall(client),
    commitmentHash: commitmentHash(client)
  })
}
