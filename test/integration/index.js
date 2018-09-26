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
import Ae from '../../es/ae/cli'
import * as Crypto from '../../es/utils/crypto'

const url = process.env.TEST_URL || 'http://localhost:3013'
const internalUrl = process.env.TEST_INTERNAL_URL || 'http://localhost:3113'
const account = Crypto.generateKeyPair()
// Array(3).fill().map(() => Crypto.generateKeyPair())

const BaseAe = Ae.compose({
  deepProps: { Swagger: { defaults: { debug: !!process.env['DEBUG'] } } },
  props: { url, internalUrl, process }
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

  const ae = await BaseAe()
  await ae.awaitHeight(10)

  if (!charged && planned > 0) {
    console.log(`Charging new wallet ${account.pub} with ${planned}`)
    await ae.spend(planned, account.pub)
    charged = true
  }

  const client = await BaseAe()
  client.setKeypair(account)
  return client
}

export {
  BaseAe,
  url,
  internalUrl,
  configure,
  ready,
  plan
}
