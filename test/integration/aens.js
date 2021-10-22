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
import { randomName } from '../utils'
import * as R from 'ramda'
import { generateKeyPair } from '../../src/utils/crypto'
import { buildContractId, classify, computeAuctionEndBlock, computeBidFee } from '../../src/tx/builder/helpers'

describe('Aens', function () {
  let sdk
  const account = generateKeyPair()
  const name = randomName(13) // 13 name length doesn't trigger auction

  before(async function () {
    sdk = await getSdk()
    await sdk.spend('1000000000000000', account.publicKey)
  })

  describe('fails on', () => {
    it('querying non-existent names', () => sdk
      .aensQuery(randomName(13)).should.eventually.be.rejected)

    it('updating names not owned by the account', async () => {
      const preclaim = await sdk.aensPreclaim(randomName(13))
      await preclaim.claim()
      const current = await sdk.address()
      const onAccount = sdk.addresses().find(acc => acc !== current)
      return sdk.aensUpdate(name, onAccount, { onAccount, blocks: 1 }).should.eventually.be.rejected
    })
  })

  it('claims names', async () => {
    const preclaim = await sdk.aensPreclaim(name)
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
    return sdk.aensQuery(name).should.eventually.be.an('object')
  })

  it('Spend using name with invalid pointers', async () => {
    const current = await sdk.address()
    const onAccount = sdk.addresses().find(acc => acc !== current)
    const { pointers } = await sdk.getName(name)
    pointers.length.should.be.equal(0)
    try {
      await sdk.spend(100, name, { onAccount })
    } catch (e) {
      e.message.should.be.equal(`Name ${name} don't have pointers for ak`)
    }
  })
  it('Call contract using AENS name', async () => {
    const identityContract = `
contract Identity =
 entrypoint getArg(x : int) = x
`
    const bytecode = await sdk.contractCompile(identityContract)
    const deployed = await bytecode.deploy([])
    const nameObject = await sdk.aensQuery(name)
    await nameObject.update([deployed.address])
    const callRes = await sdk.contractCall(identityContract, name, 'getArg', [1])
    const callResStatic = await sdk.contractCallStatic(identityContract, name, 'getArg', [1])
    callResStatic.result.returnType.should.be.equal('ok')
    callRes.hash.split('_')[0].should.be.equal('th')
  })

  it('updates names', async () => {
    const nameObject = await sdk.aensQuery(name)
    const address = await sdk.address()
    const contract = buildContractId(address, 13)
    const oracle = address.replace('ak', 'ok')
    const pointers = [address, contract, oracle]
    return nameObject.update(pointers).should.eventually.deep.include({
      pointers: pointers.map(p => R.fromPairs([['key', classify(p)], ['id', p]]))
    })
  })
  it('updates names: extend pointers', async () => {
    const nameObject = await sdk.aensQuery(name)
    const address = await sdk.address()
    const anotherContract = buildContractId(address, 12)
    const newPointers = [address, address.replace('ak', 'ok'), anotherContract]
    return nameObject.update([anotherContract], { extendPointers: true }).should.eventually.deep.include({
      pointers: newPointers.map(p => R.fromPairs([['key', classify(p)], ['id', p]]))
    })
  })
  it('Extend name ttl', async () => {
    const nameObject = await sdk.aensQuery(name)
    const extendResult = await nameObject.extendTtl(10000)
    return extendResult.should.be.deep.include({
      ttl: extendResult.blockHeight + 10000
    })
  })

  it('Spend by name', async () => {
    const current = await sdk.address()
    const onAccount = sdk.addresses().find(acc => acc !== current)
    await sdk.spend(100, name, { onAccount })
  })

  it('transfers names', async () => {
    const claim = await sdk.aensQuery(name)
    const current = await sdk.address()
    const onAccount = sdk.addresses().find(acc => acc !== current)
    await claim.transfer(onAccount)

    const claim2 = await sdk.aensQuery(name)
    return claim2.update([onAccount], { onAccount }).should.eventually.deep.include({
      pointers: [R.fromPairs([['key', 'account_pubkey'], ['id', onAccount]])]
    })
  })

  it('revoke names', async () => {
    const current = await sdk.address()
    const onAccount = sdk.addresses().find(acc => acc !== current)
    const aensName = await sdk.aensQuery(name)

    const revoke = await aensName.revoke({ onAccount })
    revoke.should.be.an('object')

    return sdk.aensQuery(name).should.be.rejectedWith(Error)
  })

  it('PreClaim name using specific account', async () => {
    const current = await sdk.address()
    const onAccount = sdk.addresses().find(acc => acc !== current)

    const preclaim = await sdk.aensPreclaim(name, { onAccount })
    preclaim.should.be.an('object')
    preclaim.tx.accountId.should.be.equal(onAccount)
  })

  describe('name auctions', function () {
    it('claims names', async () => {
      try {
        const current = await sdk.address()
        const onAccount = sdk.addresses().find(acc => acc !== current)
        const name = randomName(12)

        const preclaim = await sdk.aensPreclaim(name)
        preclaim.should.be.an('object')

        const claim = await preclaim.claim()
        claim.should.be.an('object')

        const bidFee = computeBidFee(name)
        const bid = await sdk.aensBid(name, bidFee, { onAccount })
        bid.should.be.an('object')

        const isAuctionFinished = await sdk.getName(name).catch(e => false)
        isAuctionFinished.should.be.equal(false)

        const auctionEndBlock = computeAuctionEndBlock(name, bid.blockHeight)
        console.log(`BID STARTED AT ${bid.blockHeight} WILL END AT ${auctionEndBlock}`)
      } catch (e) {
        if (e && typeof e.verifyTx === 'function') console.log(await e.verifyTx())
        throw e
      }
    })
  })
})
