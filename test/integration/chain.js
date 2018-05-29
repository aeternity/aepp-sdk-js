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

import Ae from '@aeternity/aepp-sdk'
import { Crypto } from '@aeternity/aepp-sdk'
import * as utils from './utils'

describe('chain', function () {
  utils.configure(this)

  let client

  before(async function () {
    client = await utils.client
  })

  it('determines the height', async () => {
    await client.height().should.eventually.be.a('number')
  })

  it('waits for specified heights', async () => {
    const target = await client.height() + 2
    await client.awaitHeight(target, { attempts: 120 }).should.eventually.be.at.least(target)
    await client.height().should.eventually.be.at.least(target)
  })

  it('polls for transactions', async () => {
    const { pub, priv } = utils.sourceWallet
    const key = Buffer.from(priv, 'hex')
    const { tx } = await client.api.postSpend({
      fee: 1,
      amount: 1,
      sender: pub,
      recipientPubkey: utils.wallets[0].pub,
      payload: ''
    })
    const binaryTx = Crypto.decodeBase58Check(tx.split('$')[1])
    const { txHash } = await client.api.postTx({ tx: Crypto.encodeTx(Crypto.prepareTx(Crypto.sign(binaryTx, key), binaryTx)) })

    await client.poll(txHash).should.eventually.be.fulfilled
    await client.poll('th$xxx', { blocks: 1 }).should.eventually.be.rejected
  })
})
