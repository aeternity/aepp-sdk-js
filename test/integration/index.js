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

import '../'
import Ae from '../../es/ae'
import Chain from '../../es/chain/epoch'
import Tx from '../../es/tx/epoch'
import JsTx from '../../es/tx/js'
import Account from '../../es/account/memory'
import Aens from '../../es/aens'
import Contract from '../../es/contract'
import * as Crypto from '../../es/utils/crypto'

const url = process.env.TEST_URL || 'http://localhost:3013'
const internalUrl = process.env.TEST_INTERNAL_URL || 'http://localhost:3113'
const masterAccount = Crypto.envKeypair(process.env)
const accounts = Array(3).fill().map(() => Crypto.generateKeyPair())

const BaseAe = Ae.compose(Chain, Tx, JsTx, Account, Aens, Contract, {
  deepProps: {Swagger: {defaults: {debug: !!process.env['DEBUG']}}},
  props: {url, internalUrl}
})

let planned = 0
let charged = false

function plan (amount) {
  planned += amount
}

const TIMEOUT = 180000

function configure (mocha) {
  mocha.timeout(TIMEOUT)
}

async function ready (mocha) {
  configure(mocha)

  const ae = await BaseAe({keypair: masterAccount})

  await ae.awaitHeight(10)

  if (!charged && planned > 0) {
    await ae.spend(planned, accounts[0].pub)
    charged = true
  }

  return ae
}

export {
  BaseAe,
  masterAccount,
  accounts,
  url,
  internalUrl,
  configure,
  ready,
  plan
}
