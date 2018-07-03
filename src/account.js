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

import stampit from '@stamp/it'
import {required} from '@stamp/required'
import * as Crypto from './utils/crypto'

/**
 * Sign encoded transaction
 * @param {string} tx - Transaction to sign
 * @return {Promise<string>} Signed transaction
 */
async function signTransaction (tx) {
  if (tx.match(/^tx\$.+$/)) {
    const binaryTx = Crypto.decodeBase58Check(tx.split('$')[1])
    const sig = await this.sign(binaryTx)
    return Crypto.encodeTx(Crypto.prepareTx(sig, binaryTx))
  } else {
    throw Error(`Not a valid transaction hash: ${tx}`)
  }
}

/**
 * @typedef {Object} Account
 * @property {function (data: string): Promise<string>} sign - Calculate binary signature of data
 * @property {function (): Promise<string>} address - Return public key
 * @property {function (tx: string): Promise<string>} signTransaction - Sign encoded transaction
 */

const Account = stampit({methods: {signTransaction}}, required({methods: {
  sign: required,
  address: required
}}))

export default Account
