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
 * Wallet functionality--key management, spending tokens
 */

import * as R from 'ramda'
import * as Crypto from '../utils/crypto'

const DEFAULTS = {
  ttl: Number.MAX_SAFE_INTEGER,
  fee: 1,
  waitMined: true
}

/**
 * Sign data using key.
 * @param key
 * @param data
 * @return signed data
 */
const sign = key => data => {
  return Crypto.sign(data, key)
}

/**
 * Send a transaction to the blockchain
 * @param client - the client object for communication with the blockchain
 * @param key - public key of account the transaction belongs to
 * @return the transaction hash
 */
const sendTransaction = (client, key, { defaults = {} } = {}) => async (tx, { options = {} } = {}) => {
  const opt = R.merge(defaults, options)

  if (tx.match(/^tx\$.+$/)) {
    const binaryTx = Crypto.decodeBase58Check(tx.split('$')[1])
    const signature = sign(key)(binaryTx)
    const { txHash } = await client.api.postTx({ tx: Crypto.encodeTx(Crypto.prepareTx(signature, binaryTx)) })
    return opt.waitMined ? client.poll(txHash, opt) : txHash
  } else {
    throw Error(`Not a valid transaction hash: ${tx}`)
  }
}

/**
 * Get balance for account
 * @param client
 * @param address - the public key of this account
 * @return balance of the account.
 */
const balance = (client, address) => async ({ height, hash } = {}) => {
  return (await client.api.getAccountBalance(address, { height, hash })).balance
}

/**
 * Send tokens to another account
 * @param client
 * @param key - the public key of this account
 * @param options
 * @return the transaction hash
 */
const spend = (client, key, address, { defaults = {} } = {}) => async (amount, receiver, { options = {} } = {}) => {
  const opt = R.merge(defaults, options)
  const { tx } = await client.api.postSpend(R.merge(opt, {
    amount,
    sender: address,
    recipientPubkey: receiver,
    payload: ''
  }))

  return sendTransaction(client, key)(tx, { options: opt })
}

/**
 * Create a new wallet object
 * @param client
 * @param keypair
 * @return the new wallet object
 */
function create (client, keypair, { defaults = {} } = {}) {
  const { pub, priv } = keypair
  const key = Buffer.from(priv, 'hex')
  const options = R.merge(DEFAULTS, defaults)

  return Object.freeze({
    account: pub,
    balance: balance(client, pub),
    sign: sign(key),
    sendTransaction: sendTransaction(client, key, { defaults: options }),
    spend: spend(client, key, pub, { defaults: options })
  })
}

const internal = {
  sign,
  sendTransaction,
  balance,
  spend
}

export default {
  create
}

export {
  internal
}
