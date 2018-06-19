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

import { describe, it, before } from 'mocha'
import { configure, ready, masterAccount, accounts } from './'

describe('Epoch chain client', function () {
  configure(this)

  let client

  before(async function () {
    client = (await ready(this)).chain
  })

  it('determines the height', async () => {
    return client.height().should.eventually.be.a('number')
  })

  it('waits for specified heights', async () => {
    const target = await client.height() + 2
    await client.awaitHeight(target, { attempts: 120 }).should.eventually.be.at.least(target)
    return client.height().should.eventually.be.at.least(target)
  })

  it('polls for transactions', async () => {
    const sender = await masterAccount.address()
    const receiver = await accounts[0].address()
    const { tx } = await client.api.postSpend({
      fee: 1,
      amount: 1,
      sender,
      recipientPubkey: receiver,
      payload: '',
      ttl: Number.MAX_SAFE_INTEGER
    })
    const signed = await masterAccount.signTransaction(tx)
    const { txHash } = await client.api.postTx({ tx: signed })

    await client.poll(txHash).should.eventually.be.fulfilled
    return client.poll('th$xxx', { blocks: 1 }).should.eventually.be.rejected
  })
})
