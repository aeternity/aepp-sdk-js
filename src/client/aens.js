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
  fee: 10,
  ttl: 1,
  // 0.15.0+
  // ttl: Number.MAX_SAFE_INTEGER,
  // clientTtl: 1
  nameTtl: 600000
}

function noWallet () {
  throw Error('Wallet not provided')
}

function salt () {
  return Math.floor(Math.random() * Math.floor(Number.MAX_SAFE_INTEGER))
}

function formatSalt (salt) {
  return Buffer.from(salt.toString(16).padStart(64, '0'), 'hex')
}

function commitmentHash (input, salt) {
  return `cm$${Crypto.encodeBase58Check(Crypto.hash(Buffer.concat([Crypto.hash(input), formatSalt(salt)])))}`
}

const transfer = (client, wallet, { defaults = {} } = {}) => nameHash => async (account, { options = {} } = {}) => {
  const opt = R.merge(defaults, options)

  const { tx } = await client.api.postNameTransfer(R.merge(opt, { 
    nameHash,
    recipientPubkey: account
  }))

  return wallet.sendTransaction(tx, { options: opt })
}

function classify (s) {
  const keys = {
    ak: 'accountPubkey',
    ok: 'oraclePubkey'
  }

  if (!s.match(/^[a-z]{2}\$.+/)) {
    throw Error('Not a valid hash')
  }

  const klass = s.substr(0, 2)
  if (klass in keys) {
    return keys[klass]
  } else {
    throw Error(`Unknown class ${klass}`)
  }
}

const update = (client, wallet, { defaults = {} } = {}) => nameHash => async (target, { options = {} } = {}) => {
  const opt = R.merge(defaults, options)

  const { tx } = await client.api.postNameUpdate(R.merge(opt, { 
    nameHash,
    account: wallet.account,
    pointers: JSON.stringify(R.fromPairs([[classify(target), target]]))
  }))

  return wallet.sendTransaction(tx, { options: opt })
}

const query = (client, { wallet, defaults = {} }) => async name => {
  const o = await client.api.getName(name)
  const { nameHash } = o
  const updateFn = R.apply(update(client, wallet, { defaults })(nameHash))
  const transferFn = R.apply(transfer(client, wallet, { defaults })(nameHash))
  
  return Object.freeze(Object.assign(o, {
    pointers: JSON.parse(o.pointers || '{}'),
    update: R.isNil(wallet) ? noWallet : async function () {
      await updateFn(arguments)
      return query(client, { wallet, defaults })(name)
    },
    transfer: R.isNil(wallet) ? noWallet : async function () {
      await transferFn(arguments)
      return query(client, { wallet, defaults })(name)
    }
  }))
}

const claim = (client, wallet, { defaults = {} } = {}) => (name, salt) => async ({ options = {} } = {}) => {
  const opt = R.merge(defaults, options)
  const { tx } = await client.api.postNameClaim(R.merge(opt, {
    account: wallet.account,
    nameSalt: salt,
    name: `nm$${Crypto.encodeBase58Check(Buffer.from(name))}`
  }))

  await wallet.sendTransaction(tx, { options: opt })

  return query(client, defaults)(name)
}

const preclaim = (client, wallet, { defaults = {} } = {}) => async (name, { options = {} } = {}) => {
  const _salt = salt()
  const hash = commitmentHash(name, _salt)
  const opt = R.merge(defaults, options)

  const { tx } = await client.api.postNamePreclaim(R.merge(opt, {
    account: wallet.account,
    commitment: hash
  }))

  await wallet.sendTransaction(tx, { options: opt })

  return Object.freeze({
    claim: claim(client, wallet, { defaults })(name, _salt),
    salt: _salt,
    commitment: hash
  })
}

function create (client, { wallet, defaults = {} } = {}) {
  const options = R.merge(DEFAULTS, defaults)

  return Object.freeze({
    query: query(client, { wallet, defaults: options }),
    preclaim: R.isNil(wallet) ? noWallet : preclaim(client, wallet, { defaults: options }),
    claim: claim(client, wallet, { defaults: options }),
    update: R.isNil(wallet) ? noWallet : update(client, wallet, { defaults: options })
  })
}

export default {
  create,
  salt,
  commitmentHash
}

export {
  query,
  preclaim
}
