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

require('@babel/polyfill')

const chai = require ('chai')
const assert = chai.assert

const AeHttpProvider = require ('../lib/providers/http/index')
const AeternityClient = require('../lib/aepp-sdk')
import * as Crypto from '../lib/utils/crypto'
import * as _ from 'ramda'

// Naive assertion
const assertIsBlock = (data) => {
  assert.ok (data)
  assert.ok (data['state_hash'])
  assert.ok(Number.isInteger(data.height))
}

const randomAeName = () => {
  let text = ''
  let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let urlLength = 10

  for (let i = 0; i < urlLength; i++) {
    text += possible.charAt (Math.floor (Math.random () * possible.length))
  }
  return `${text}.aet`
}

const [host, port] = (process.env.TEST_NODE || 'localhost:3013').split(':')

const httpProvider = new AeternityClient(new AeHttpProvider (host, port, {
  secured: false
}))

const sourceWallet = {
  priv: process.env['WALLET_PRIV'],
  pub: process.env['WALLET_PUB']
}

if (!sourceWallet.pub || !sourceWallet.priv) {
  throw Error('Environment variables WALLET_PRIV and WALLET_PUB need to be set')
}

const wallets = _.times(() => Crypto.generateKeyPair(), 3)

async function charge (receiver, amount) {
  console.log(`Charging ${receiver} with ${amount}`)
  const { tx_hash } = await httpProvider.base.spend(receiver, amount, sourceWallet)
  await httpProvider.tx.waitForTransaction(tx_hash)
}

module.exports = {
  httpProvider,
  assertIsBlock,
  randomAeName,
  wallets,
  charge,
  TIMEOUT: 120000
}
