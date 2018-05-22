/*
 * ISC License (ISC)
 * Copyright 2018 aeternity developers
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

import { AeternityClient, Crypto } from '../src'
import { assert } from 'chai'
const AeHttpProvider = AeternityClient.providers.HttpProvider

// Naive assertion
const assertIsBlock = (data) => {
  assert.ok(data)
  assert.ok(data['state_hash'])
  assert.ok(Number.isInteger(data.height))
}

const randomAeName = () => {
  let text = ''
  let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let urlLength = 10

  for (let i = 0; i < urlLength; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  }
  return `${text}.aet`
}

const [host, port] = (process.env.TEST_NODE || 'localhost:3013').split(':')
const url = process.env.TEST_URL || 'http://localhost:3013'
const internalUrl = process.env.TEST_INTERNAL_URL || 'http://localhost:3113'

const httpProvider = new AeternityClient(new AeHttpProvider(host, port, {
  secured: false
}))

const sourceWallet = {
  priv: process.env['WALLET_PRIV'],
  pub: process.env['WALLET_PUB']
}

if (!sourceWallet.pub || !sourceWallet.priv) {
  throw Error('Environment variables WALLET_PRIV and WALLET_PUB need to be set')
}

const wallets = Array(3).fill().map(() => Crypto.generateKeyPair())

let planned = 0
let charged = false

function plan (amount) {
  planned += amount
}

async function charge (receiver, amount) {
  console.log(`Charging ${receiver} with ${amount}`)
  const { tx_hash } = await httpProvider.base.spend(receiver, amount, sourceWallet)
  await httpProvider.tx.waitForTransaction(tx_hash)
}

const TIMEOUT = 180000

async function waitReady () {
  await httpProvider.provider.ready
  await httpProvider.base.waitForBlock(10, 1000)
  if (!charged) {
    await charge(wallets[0].pub, planned)
    charged = true
  }
}

export {
  httpProvider,
  assertIsBlock,
  randomAeName,
  wallets,
  charge,
  TIMEOUT,
  url,
  internalUrl,
  waitReady,
  plan
}
