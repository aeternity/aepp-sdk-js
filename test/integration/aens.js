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
import { expect } from 'chai'
import { getSdk } from './'
import { randomName } from '../utils'
import { generateKeyPair } from '../../src/utils/crypto'
import { buildContractId, computeAuctionEndBlock, computeBidFee } from '../../src/tx/builder/helpers'
import { AensPointerContextError } from '../../src/utils/errors'

describe('Aens', function () {
  let sdk
  const account = generateKeyPair()
  const name = randomName(13) // 13 name length doesn't trigger auction

  before(async function () {
    sdk = await getSdk()
    await sdk.spend('1000000000000000', account.publicKey)
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

  it('throws error on querying non-existent name', () => sdk
    .aensQuery(randomName(13)).should.eventually.be.rejected)

  it('Spend using name with invalid pointers', async () => {
    const current = await sdk.address()
    const onAccount = sdk.addresses().find(acc => acc !== current)
    const { pointers } = await sdk.getName(name)
    pointers.length.should.be.equal(0)
    await expect(sdk.spend(100, name, { onAccount }))
      .to.be.rejectedWith(AensPointerContextError, `Name ${name} don't have pointers for account_pubkey`)
  })

  it('Call contract using AENS name', async () => {
    const source =
      'contract Identity =' +
      '  entrypoint getArg(x : int) = x'
    const contract = await sdk.getContractInstance({ source })
    await contract.deploy([])
    const nameObject = await sdk.aensQuery(name)
    await nameObject.update({ contract_pubkey: contract.deployInfo.address })

    const contractByName = await sdk.getContractInstance({ source, contractAddress: name })
    expect((await contractByName.methods.getArg(42)).decodedResult).to.be.equal(42n)
  })

  const address = generateKeyPair().publicKey
  const pointers = {
    myKey: address,
    account_pubkey: address,
    oracle_pubkey: address.replace('ak', 'ok'),
    channel: address.replace('ak', 'ch'),
    contract_pubkey: buildContractId(address, 13)
  }
  const pointersNode = Object.entries(pointers).map(([key, id]) => ({ key, id }))

  it('updates', async () => {
    const nameObject = await sdk.aensQuery(name)
    expect(await nameObject.update(pointers)).to.deep.include({ pointers: pointersNode })
  })

  it('throws error on updating names not owned by the account', async () => {
    const preclaim = await sdk.aensPreclaim(randomName(13))
    await preclaim.claim()
    const current = await sdk.address()
    const onAccount = sdk.addresses().find(acc => acc !== current)
    return sdk.aensUpdate(name, onAccount, { onAccount, blocks: 1 }).should.eventually.be.rejected
  })

  it('updates extending pointers', async () => {
    const nameObject = await sdk.aensQuery(name)
    const anotherContract = buildContractId(address, 12)
    expect(await nameObject.update({ contract_pubkey: anotherContract }, { extendPointers: true }))
      .to.deep.include({
        pointers: [
          ...pointersNode.filter(pointer => pointer.key !== 'contract_pubkey'),
          { key: 'contract_pubkey', id: anotherContract }
        ]
      })
  })

  it('throws error on setting 33 pointers', async () => {
    const nameObject = await sdk.aensQuery(name)
    const pointers = Object.fromEntries(
      new Array(33).fill().map((v, i) => [`pointer-${i}`, address])
    )
    expect(nameObject.update(pointers))
      .to.be.rejectedWith('Expected 32 pointers or less, got 33 instead')
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
    expect(await claim2.update({ account_pubkey: onAccount }, { onAccount })).to.deep.include({
      pointers: [{ key: 'account_pubkey', id: onAccount }]
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
    })
  })
})
