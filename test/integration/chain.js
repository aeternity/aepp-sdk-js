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
import { expect, assert } from 'chai'
import { spy } from 'sinon'
import http from 'http'
import { getSdk } from './'
import { generateKeyPair } from '../../src/utils/crypto'

describe('Node Chain', function () {
  let aeSdk, aeSdkWithoutAccount
  const { publicKey } = generateKeyPair()

  before(async function () {
    aeSdk = await getSdk()
    aeSdkWithoutAccount = await getSdk({ withoutAccount: true })
  })

  it('determines the height', async () => {
    expect(await aeSdkWithoutAccount.height()).to.be.a('number')
  })

  it('combines height queries', async () => {
    spy(http, 'request')
    const heights = await Promise.all(new Array(5).fill().map(() => aeSdk.height()))
    expect(heights).to.eql(heights.map(() => heights[0]))
    assert(http.request.calledOnce)
    http.request.restore()
  })

  it('waits for specified heights', async () => {
    const target = await aeSdkWithoutAccount.height() + 1
    await aeSdkWithoutAccount.awaitHeight(target).should.eventually.be.at.least(target)
    return aeSdkWithoutAccount.height().should.eventually.be.at.least(target)
  })

  it('Can verify transaction from broadcast error', async () => {
    const error = await aeSdk.spend(0, publicKey, { fee: 100, verify: false }).catch(e => e)
    expect(await error.verifyTx()).to.have.lengthOf(1)
  })

  it('Get pending transaction', async () => {
    const mempool = await aeSdkWithoutAccount.mempool()
    mempool.should.has.property('transactions')
  })

  it('Get current generation', async () => {
    const generation = await aeSdkWithoutAccount.getCurrentGeneration()
    generation.should.has.property('keyBlock')
  })

  it('Get key block', async () => {
    const { keyBlock } = await aeSdkWithoutAccount.getCurrentGeneration()
    const keyBlockByHash = await aeSdkWithoutAccount.getKeyBlock(keyBlock.hash)
    const keyBlockByHeight = await aeSdkWithoutAccount.getKeyBlock(keyBlock.height)
    const keyBlockError = await aeSdkWithoutAccount.getKeyBlock(false).catch(e => true)
    keyBlockByHash.should.be.an('object')
    keyBlockByHeight.should.be.an('object')
    keyBlockError.should.be.equal(true)
  })

  it('Get generation', async () => {
    const { keyBlock } = await aeSdkWithoutAccount.getCurrentGeneration()
    const genByHash = await aeSdkWithoutAccount.getGeneration(keyBlock.hash)
    const genByHeight = await aeSdkWithoutAccount.getGeneration(keyBlock.height)
    const genArgsError = await aeSdkWithoutAccount.getGeneration(true).catch(e => true)
    genByHash.should.be.an('object')
    genByHeight.should.be.an('object')
    genArgsError.should.be.equal(true)
  })

  it('polls for transactions', async () => {
    const senderId = await aeSdk.address()
    const tx = await aeSdk.spendTx({
      amount: 1,
      senderId,
      recipientId: publicKey,
      payload: '',
      ttl: Number.MAX_SAFE_INTEGER
    })
    const signed = await aeSdk.signTransaction(tx)
    const { txHash } = await aeSdk.api.postTransaction({ tx: signed })

    await aeSdk.poll(txHash).should.eventually.be.fulfilled
    return aeSdk.poll('th_xxx', { blocks: 1 }).should.eventually.be.rejected
  })

  it('Wait for transaction confirmation', async () => {
    const txData = await aeSdk.spend(1000, await aeSdk.address(), { confirm: true })
    const isConfirmed = (await aeSdk.height()) >= txData.blockHeight + 3

    isConfirmed.should.be.equal(true)

    const txData2 = await aeSdk.spend(1000, await aeSdk.address(), { confirm: 4 })
    const isConfirmed2 = (await aeSdk.height()) >= txData2.blockHeight + 4
    isConfirmed2.should.be.equal(true)
  })

  const accounts = new Array(10).fill().map(() => generateKeyPair())
  const transactions = []

  it('multiple spends from one account', async () => {
    const { nextNonce } = await aeSdk.api.getAccountNextNonce(await aeSdk.address())
    spy(http, 'request')
    const spends = await Promise.all(accounts.map((account, idx) => aeSdk.spend(
      Math.floor(Math.random() * 1000 + 1e16),
      account.publicKey,
      { nonce: nextNonce + idx, verify: false, waitMined: false }
    )))
    transactions.push(...spends.map(({ hash }) => hash))
    const accountGetCount = 1
    const txPostCount = accounts.length
    expect(http.request.args.length).to.be.equal(accountGetCount + txPostCount)
    http.request.restore()
  })

  it('multiple spends from different accounts', async () => {
    const receiver = await aeSdk.address()
    spy(http, 'request')
    const spends = await Promise.all(accounts.map(onAccount =>
      aeSdkWithoutAccount.spend(1e15, receiver, {
        nonce: 1, verify: false, onAccount, waitMined: false
      })))
    transactions.push(...spends.map(({ hash }) => hash))
    const accountGetCount = accounts.length
    const txPostCount = accounts.length
    expect(http.request.args.length).to.be.equal(accountGetCount + txPostCount)
    http.request.restore()
  })

  it('ensure transactions mined', () => Promise.all(transactions.map(hash => aeSdkWithoutAccount.poll(hash))))

  it('multiple contract dry-runs calls at one request', async () => {
    const contract = await aeSdk.getContractInstance({
      source:
        'contract Test =\n' +
        '  entrypoint foo(x : int) = x * 100'
    })
    await contract.deploy()
    const { result: { gasUsed: gasLimit } } = await contract.methods.foo(5)
    const { nextNonce } = await aeSdk.api.getAccountNextNonce(await aeSdk.address())
    spy(http, 'request')
    const numbers = new Array(32).fill().map((v, idx) => idx * 2)
    const results = (await Promise.all(
      numbers.map((v, idx) => contract.methods
        .foo(v, { nonce: nextNonce + idx, gasLimit, combine: true }))
    )).map(r => r.decodedResult)
    expect(results).to.be.eql(numbers.map(v => BigInt(v * 100)))
    expect(http.request.args.length).to.be.equal(1)
    http.request.restore()
  })
})
