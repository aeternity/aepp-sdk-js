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

import Account from '../account'
import * as Crypto from '../utils/crypto'

const secrets = new WeakMap()

async function sign (data) {
  return Promise.resolve(Crypto.sign(data, secrets.get(this).priv))
}

async function address () {
  return Promise.resolve(secrets.get(this).pub)
}

function setKeypair (keypair) {
  secrets.set(this, {
    priv: Buffer.from(keypair.priv, 'hex'),
    pub: keypair.pub
  })
}

/**
 * In-memory `Account` factory
 * @function
 * @rtype Stamp
 * @param {Object} keypair - Key pair to use
 * @param {String} keypair.pub - Public key
 * @param {String} keypair.priv - Private key
 * @return {Account}
 */
const MemoryAccount = Account.compose({
  init ({keypair}) {
    if (keypair !== undefined) {
      this.setKeypair(keypair)
    }
  },
  methods: {sign, address, setKeypair}
})

export default MemoryAccount
