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

import Account from './'
import * as Crypto from '../utils/crypto'

const sign = key => async data => Promise.resolve(Crypto.sign(data, key))
const address = pub => async () => Promise.resolve(pub)

/**
 * In-memory `Account` factory
 *
 * @param {{pub: string, priv: string}} keypair - Key pair to use
 * @return {Account}
 */
export default function MemoryAccount (keypair) {
  const { pub, priv } = keypair
  const key = Buffer.from(priv, 'hex')

  return Account({
    address: address(pub),
    sign: sign(key)
  })
}
