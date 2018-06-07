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
import * as Crypto from '../utils/crypto'

const DEFAULTS = {
  ttl: Number.MAX_SAFE_INTEGER,
  fee: 1,
  waitMined: true
}

const sign = key => data => {
  return Crypto.sign(data, key)
}

const sendTransaction = (client, key, defaults) => async (tx, options = {}) => {
  const { waitMined } = R.merge(defaults, options)

  if (tx.match(/^tx\$.+$/)) {
    const binaryTx = Crypto.decodeBase58Check(tx.split('$')[1])
    const signature = sign(key)(binaryTx)
    const { txHash } = await client.api.postTx({ tx: Crypto.encodeTx(Crypto.prepareTx(signature, binaryTx)) })
    return waitMined ? client.poll(txHash) : txHash
  } else {
    throw Error(`Not a valid transaction hash: ${tx}`)
  }
}

const balance = (client, address) => async ({ height, hash } = {}) => {
  return (await client.api.getAccountBalance(address, { height, hash })).balance
}

const spend = (client, key, address, defaults) => async (amount, receiver, options = {}) => {
  const opts = R.mergeAll([defaults, options, {
    amount,
    sender: address,
    recipientPubkey: receiver,
    payload: ''
  }])

  const { tx } = await client.api.postSpend(opts)
  return sendTransaction(client, key)(tx, R.pick(['waitMined'], opts))
}

function create (client, keypair, defaults = {}) {
  const { pub, priv } = keypair
  const key = Buffer.from(priv, 'hex')
  const options = R.merge(DEFAULTS, defaults)

  return Object.freeze({
    account: pub,
    balance: balance(client, pub),
    sign: sign(key),
    sendTransaction: sendTransaction(client, key, options),
    spend: spend(client, key, pub, options)
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
