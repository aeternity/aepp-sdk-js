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
import Tx from '../tx'
import Chain from '../chain'
import Account from '../account'
import * as R from 'ramda'

async function send (tx, options) {
  const opt = R.merge(this.Ae.defaults, options)
  const signed = await this.signTransaction(tx, await this.address())
  return this.sendTransaction(signed, opt)
}

async function spend (amount, recipient, options = {}) {
  const opt = R.merge(this.Ae.defaults, options)
  const spendTx = await this.spendTx(R.merge(opt, {sender: await this.address(), recipient, amount}))
  return this.send(spendTx, opt)
}

const Ae = stampit(Tx, Account, Chain, {
  methods: {send, spend},
  deepProperties: {Ae: {defaults: {
    ttl: Number.MAX_SAFE_INTEGER,
    fee: 1,
    payload: ''
  }}}
})

export default Ae
