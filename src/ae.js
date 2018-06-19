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

import * as R from 'ramda'

const DEFAULTS = {
  ttl: Number.MAX_SAFE_INTEGER,
  fee: 1,
  payload: ''
}

const send = ae => async (tx, options) => {
  const opt = R.mergeAll([DEFAULTS, ae.defaults, options])
  const signed = await ae.account.signTransaction(tx)
  return ae.chain.sendTransaction(signed, opt)
}

const spend = ae => async (amount, recipient, options = {}) => {
  const opt = R.mergeAll([DEFAULTS, ae.defaults, options])
  const sender = await ae.account.address()
  const spendTx = await ae.tx.spend(R.merge({ sender, recipient, amount }, opt))
  return ae.send(spendTx, opt)
}

const balance = ae => async () => ae.account.balance()

/**
 * @typedef {Object} Ae
 * @property {Tx} tx
 * @property {Account} account
 * @property {Chain} chain
 * @property {function (tx: string, options: Record): Promise<string>} send - Sign and send a transaction off to the chain
 */

/**
 * `Ae` factory
 *
 * @param {{ tx: Tx, account: Account, chain: Chain, defaults: ?Object }} spec
 * @return {Ae}
 */
export default function ae ({ tx, account, chain, defaults = {} }) {
  const o = {
    tx,
    account,
    chain,
    defaults
  }

  return Object.freeze(Object.assign(o, {
    send: send(o),
    spend: spend(o),
    balance: balance(o)
  }))
}
