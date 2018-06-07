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

import '../utils'
import Ae from '@aeternity/aepp-sdk'
import { Crypto, Wallet } from '@aeternity/aepp-sdk'

const sourceWallet = {
  priv: process.env['WALLET_PRIV'],
  pub: process.env['WALLET_PUB']
}

if (!sourceWallet.pub || !sourceWallet.priv) {
  throw Error('Environment variables WALLET_PRIV and WALLET_PUB need to be set')
}

const url = process.env.TEST_URL || 'http://localhost:3013'
const internalUrl = process.env.TEST_INTERNAL_URL || 'http://localhost:3113'

const client = Ae.create(url, { internalUrl, debug: !!process.env['DEBUG'] })
const wallets = Array(3).fill().map(() => Crypto.generateKeyPair())

let planned = 0
let charged = false

function plan (amount) {
  planned += amount
}

const TIMEOUT = 120000

function configure (mocha) {
  mocha.timeout(TIMEOUT)
}

async function waitReady (mocha) {
  configure(mocha)
  const _client = await client
  await _client.awaitHeight(10)
  if (!charged && planned > 0) {
    await Wallet.create(_client, sourceWallet).spend(planned, wallets[0].pub)
    charged = true
  }
}

export {
  wallets,
  TIMEOUT,
  url,
  internalUrl,
  waitReady,
  plan,
  client,
  configure,
  sourceWallet
}
