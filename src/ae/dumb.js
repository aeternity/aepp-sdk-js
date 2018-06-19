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
import Ae from './'
import EpochTx from '../tx/epoch'
import JsTx from '../tx/js'
import Account from '../account/memory'
import Epoch from '../chain/epoch'

/**
 * Dumb `Ae` factory
 *
 * @param {string} url
 * @param {string} keypair
 * @param {{ debug: boolean, defaults: Object }} [options={}]
 * @return {Ae}
 */
export default async function dumbAe (url, keypair, { debug, defaults } = {}) {
  const epoch = await Epoch(url, { debug, defaults })
  const tx = R.mergeAll([{}, EpochTx(epoch), JsTx()])
  return Ae({ tx, account: Account(keypair), chain: epoch, defaults })
}
