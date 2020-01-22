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
import { configure, plan, ready } from './'
import * as R from 'ramda'
import { generateKeyPair } from '../../es/utils/crypto'
import { buildContractId, classify, computeAuctionEndBlock, computeBidFee } from '../../es/tx/builder/helpers'

function randomName (length, namespace = '.chain') {
  return randomString(length) + namespace
}

function randomString (len, charSet) {
  charSet = charSet || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let randomString = ''
  for (let i = 0; i < len; i++) {
    const randomPoz = Math.floor(Math.random() * charSet.length)
    randomString += charSet.substring(randomPoz, randomPoz + 1)
  }
  return randomString
}

plan('99000000000000000000000000')

describe('Aens', function () {
  configure(this)

  let aens
  let nameAuctionsSupported
  const account = generateKeyPair()
  let name
  let name2

  before(async function () {
    aens = await ready(this)
    await aens.spend('1000000000000000', account.publicKey)
    const { version } = aens.getNodeInfo()
    const [majorVersion] = version.split('.')
    nameAuctionsSupported = +majorVersion === 5 && version !== '5.0.0-rc.1'
    name = randomName(13, nameAuctionsSupported ? '.chain' : '.test') // 13 name length doesn't trigger auction
    name2 = randomName(13, nameAuctionsSupported ? '.chain' : '.test')
  })

  const lima = fn => async () => nameAuctionsSupported ? fn() : undefined

  describe('fails on', () => {
    it('querying non-existent names', async () => {
      return aens.aensQuery(name2).should.eventually.be.rejected
    })

    it('updating names not owned by the account', async () => {
      const preclaim = await aens.aensPreclaim(name2)
      await preclaim.claim()
      const current = await aens.address()
      const onAccount = aens.addresses().find(acc => acc !== current)
      return aens.aensUpdate(name, onAccount, { onAccount, blocks: 1 }).should.eventually.be.rejected
    })
  })

  it('claims names', async () => {
    const preclaim = await aens.aensPreclaim(name)
    preclaim.should.be.an('object')
    const claimed = await preclaim.claim()
    claimed.should.be.an('object')
    claimed.id.should.be.a('string')
    claimed.ttl.should.be.an('number')
  })

  it('queries names', async () => {
    // For some reason the node will return 404 when name is queried
    // just right after claim tx has been mined so we wait 0.5s
    await new Promise(resolve => setTimeout(resolve, 500))
    return aens.aensQuery(name).should.eventually.be.an('object')
  })

  it('Spend using name with invalid pointers', async () => {
    const current = await aens.address()
    const onAccount = aens.addresses().find(acc => acc !== current)
    const { pointers } = await aens.getName(name)
    pointers.length.should.be.equal(0)
    try {
      await aens.spend(100, name, { onAccount, verify: true })
    } catch (e) {
      e.message.should.be.equal(`Name ${name} do not have pointers for account`)
    }
  })

  it('updates names', async () => {
    const nameObject = await aens.aensQuery(name)
    const address = await aens.address()
    const contract = buildContractId(address, 13)
    const oracle = address.replace('ak', 'ok')
    const pointers = [address, contract, oracle]
    return nameObject.update(pointers).should.eventually.deep.include({
      pointers: pointers.map(p => R.fromPairs([['key', classify(p)], ['id', p]]))
    })
  })
  it('updates names: extend pointers', async () => {
    const nameObject = await aens.aensQuery(name)
    const address = await aens.address()
    const anotherContract = buildContractId(address, 12)
    const newPointers = [address, address.replace('ak', 'ok'), anotherContract]
    return nameObject.update([anotherContract], { extendPointers: true }).should.eventually.deep.include({
      pointers: newPointers.map(p => R.fromPairs([['key', classify(p)], ['id', p]]))
    })
  })
  it('Extend name ttl', async () => {
    const nameObject = await aens.aensQuery(name)
    const extendResult = await nameObject.extendTtl(10000)
    return extendResult.should.be.deep.include({
      ttl: extendResult.blockHeight + 10000
    })
  })

  it('Spend by name', async () => {
    const current = await aens.address()
    const onAccount = aens.addresses().find(acc => acc !== current)
    await aens.spend(100, name, { onAccount, verify: true })
  })

  it('transfers names', async () => {
    const claim = await aens.aensQuery(name)
    const current = await aens.address()
    const onAccount = aens.addresses().find(acc => acc !== current)
    await claim.transfer(onAccount)

    const claim2 = await aens.aensQuery(name)
    return claim2.update([onAccount], { onAccount }).should.eventually.deep.include({
      pointers: [R.fromPairs([['key', 'account_pubkey'], ['id', onAccount]])]
    })
  })

  it('revoke names', async () => {
    const current = await aens.address()
    const onAccount = aens.addresses().find(acc => acc !== current)
    const aensName = await aens.aensQuery(name)

    const revoke = await aensName.revoke({ onAccount })
    revoke.should.be.an('object')

    return aens.aensQuery(name).should.be.rejectedWith(Error)
  })

  it('PreClaim name using specific account', async () => {
    const current = await aens.address()
    const onAccount = aens.addresses().find(acc => acc !== current)

    const preclaim = await aens.aensPreclaim(name, { onAccount })
    preclaim.should.be.an('object')
    preclaim.tx.accountId.should.be.equal(onAccount)
  })

  describe('name auctions', function () {
    it('claims names', lima(async () => {
      try {
        const current = await aens.address()
        const onAccount = aens.addresses().find(acc => acc !== current)
        const name = randomName(12, '.chain')

        const preclaim = await aens.aensPreclaim(name)
        preclaim.should.be.an('object')

        const claim = await preclaim.claim()
        claim.should.be.an('object')

        const bidFee = computeBidFee(name)
        const bid = await aens.aensBid(name, bidFee, { onAccount })
        bid.should.be.an('object')

        const isAuctionFinished = await aens.getName(name).catch(e => false)
        isAuctionFinished.should.be.equal(false)

        const auctionEndBlock = computeAuctionEndBlock(name, bid.blockHeight)
        console.log(`BID STARTED AT ${bid.blockHeight} WILL END AT ${auctionEndBlock}`)
      } catch (e) {
        if (e && typeof e.verifyTx === 'function') console.log(await e.verifyTx())
        throw e
      }
    }))
  })
})
