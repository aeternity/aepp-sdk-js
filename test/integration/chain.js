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
import { getSdk } from './'
import { generateKeyPair } from '../../src/utils/crypto'

describe('Node Chain', function () {
  let client
  const { publicKey } = generateKeyPair()

  before(async function () {
    client = await getSdk()
  })

  it('determines the height', async () => {
    return client.height().should.eventually.be.a('number')
  })

  it('Compresses height queries', async () => {
    const origFun = client.api.getCurrentKeyBlockHeight
    try {
      var calls = 0
      client.api.getCurrentKeyBlockHeight = () => {
        calls += 1
        return origFun()
      }
      const H1P = client.height()
      const H2P = client.height()
      const H3P = client.height()
      const H1 = await H1P
      const H2 = await H2P
      const H3 = await H3P
      H1.should.be.equal(H2)
      H1.should.be.equal(H3)
      calls.should.be.equal(1)
    } finally {
      client.api.getCurrentKeyBlockHeight = origFun
    }
  })

  it('waits for specified heights', async () => {
    const target = await client.height() + 1
    await client.awaitHeight(target, { interval: 200, attempts: 100 }).should.eventually.be.at.least(target)
    return client.height().should.eventually.be.at.least(target)
  })
  it('Can verify transaction from broadcast error', async () => {
    try {
      await client.spend(0, publicKey, { fee: 100, verify: false })
    } catch (e) {
      const validation = await e.verifyTx()
      validation.should.has.property('validation')
    }
  })
  it('Get top block', async () => {
    const top = await client.topBlock()
    top.should.has.property('hash')
    top.should.has.property('height')
  })
  it('Get pending transaction', async () => {
    const mempool = await client.mempool()
    mempool.should.has.property('transactions')
  })
  it('Get current generation', async () => {
    const generation = await client.getCurrentGeneration()
    generation.should.has.property('keyBlock')
  })
  it('Get key block', async () => {
    const { keyBlock } = await client.getCurrentGeneration()
    const keyBlockByHash = await client.getKeyBlock(keyBlock.hash)
    const keyBlockByHeight = await client.getKeyBlock(keyBlock.height)
    const keyBlockError = await client.getKeyBlock(false).catch(e => true)
    keyBlockByHash.should.be.an('object')
    keyBlockByHeight.should.be.an('object')
    keyBlockError.should.be.equal(true)
  })
  it('Get generation', async () => {
    const { keyBlock } = await client.getCurrentGeneration()
    const genByHash = await client.getGeneration(keyBlock.hash)
    const genByHeight = await client.getGeneration(keyBlock.height)
    const genArgsError = await client.getGeneration(true).catch(e => true)
    genByHash.should.be.an('object')
    genByHeight.should.be.an('object')
    genArgsError.should.be.equal(true)
  })
  it('polls for transactions', async () => {
    const sender = await client.address()
    const receiver = publicKey
    const tx = await client.spendTx({
      amount: 1,
      senderId: sender,
      recipientId: receiver,
      payload: '',
      ttl: Number.MAX_SAFE_INTEGER
    })
    const signed = await client.signTransaction(tx)
    const { txHash } = await client.api.postTransaction({ tx: signed })

    await client.poll(txHash, { interval: 50, attempts: 1200 }).should.eventually.be.fulfilled
    return client.poll('th_xxx', { blocks: 1, interval: 50, attempts: 1200 }).should.eventually.be.rejected
  })

  it('Wait for transaction confirmation', async () => {
    const txData = await client.spend(1000, await client.address(), { confirm: true, interval: 400, attempts: 50 })
    const isConfirmed = (await client.height()) >= txData.blockHeight + 3

    isConfirmed.should.be.equal(true)

    const txData2 = await client.spend(1000, await client.address(), { confirm: 4, interval: 400, attempts: 50 })
    const isConfirmed2 = (await client.height()) >= txData2.blockHeight + 4
    isConfirmed2.should.be.equal(true)
  })
})
