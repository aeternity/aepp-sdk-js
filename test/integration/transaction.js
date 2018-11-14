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
import { configure, url, internalUrl } from './'
import { encodeBase58Check, salt } from '../../es/utils/crypto'
import Ae from '../../es/ae/universal'

const nonce = 1
const ttl = 1
const nameTtl = 1
const clientTtl = 1
const fee = 1
const amount = 1
const senderId = 'ak_2iBPH7HUz3cSDVEUWiHg76MZJ6tZooVNBmmxcgVK6VV8KAE688'
const recipientId = 'ak_2iBPH7HUz3cSDVEUWiHg76MZJ6tZooVNBmmxcgVK6VV8KAE688'
const name = 'test123test.test'
const nameHash = `nm_${encodeBase58Check(Buffer.from(name))}`
const nameId = 'nm_2sFnPHi5ziAqhdApSpRBsYdomCahtmk3YGNZKYUTtUNpVSMccC'
const pointers = [{ key: 'account_pubkey', id: senderId }]

let _salt;
let commitmentId;

describe('Native Transaction', function () {
  configure(this)

  let clientNative
  let client

  before(async () => {
    client = await Ae({ url, internalUrl, nativeMode: false })
    clientNative = await Ae({ url, internalUrl })

    _salt = salt()
    commitmentId = await client.commitmentHash(name, _salt)
  })

  it('native build of spend tx', async () => {
    const txFromAPI = await client.spendTx({ senderId, recipientId, amount, fee, ttl, nonce, payload: 'test' })
    const nativeTx = await clientNative.spendTx({ senderId, recipientId, amount, fee, ttl, nonce, payload: 'test' })
    txFromAPI.should.be.equal(nativeTx)
  })

  it('native build of name pre-claim tx', async () => {
    const txFromAPI = await client.namePreclaimTx({ accountId: senderId, nonce, fee, ttl, commitmentId })
    const nativeTx = await clientNative.namePreclaimTx( {accountId: senderId, nonce, fee, ttl, commitmentId })
    txFromAPI.should.be.equal(nativeTx)
  })

  it('native build of claim tx', async () => {
    const txFromAPI = await client.nameClaimTx({
      accountId: senderId,
      nonce,
      name: nameHash,
      nameSalt: _salt,
      fee,
      ttl
    })
    const nativeTx = await clientNative.nameClaimTx({
      accountId: senderId,
      nonce,
      name: nameHash,
      nameSalt: _salt,
      fee,
      ttl
    })
    txFromAPI.should.be.equal(nativeTx)
  })

  it('native build of update tx', async () => {
    const nativeTx = await clientNative.nameUpdateTx({ accountId: senderId, nonce, nameId, nameTtl, pointers, clientTtl, fee, ttl })
    const txFromAPI = await client.nameUpdateTx({ accountId: senderId, nonce, nameId, nameTtl, pointers, clientTtl, fee, ttl })
    txFromAPI.should.be.equal(nativeTx)
  })

  it('native build of revoke tx', async () => {
    const txFromAPI = await client.nameRevokeTx({ accountId: senderId, nonce, nameId, fee, ttl })
    const nativeTx = await clientNative.nameRevokeTx({ accountId: senderId, nonce, nameId, fee, ttl })
    txFromAPI.should.be.equal(nativeTx)
  })

  it('native build of transfer tx', async () => {
    const txFromAPI = await client.nameTransferTx({ accountId: senderId, nonce, nameId, recipientId, fee, ttl })
    const nativeTx = await clientNative.nameTransferTx({ accountId: senderId, nonce, nameId, recipientId, fee, ttl })
    txFromAPI.should.be.equal(nativeTx)
  })
})
