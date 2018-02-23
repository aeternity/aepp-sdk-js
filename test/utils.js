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

let httpProvider1 = new AeternityClient(new AeHttpProvider ('localhost', 3013, {
  internalPort: 3113,
  secured: false
}))
let httpProvider2 = new AeternityClient(new AeHttpProvider ('localhost', 3023, {
  internalPort: 3123,
  secured: false
}))
let httpProvider3 = new AeternityClient(new AeHttpProvider ('localhost', 3033, {
  internalPort: 3133,
  secured: false
}))

let privateKey = '56b61283ec0ea87f891347f95895f9e1f339cd8854d649043c9b32b908cda646'


module.exports = {
  httpProvider1,
  httpProvider2,
  httpProvider3,
  assertIsBlock,
  randomAeName,
  privateKey,
  TIMEOUT: 120000
}
