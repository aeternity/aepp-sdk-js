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
import { ready } from './index'

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

// Contract test data
const code = 'cb_Dmwce5QeGDTaXBnQKcZmHYte3DLx2kPCbZVvgCMRy3jcc64YVLnrinrfoirN58XxyibrJv4Ju9qY1bXPf3PCF5opkeGwr4ezCsJBc81NXNTm5v3bMfbWKa1pcYcCJBn7tsCgT9ZWUJrc7kGN46bhVNS42TUWpm3WHFBxVRsLeJKqVsc4qFafnZ57pNwYYpYeLENG9QVmE3FaNENhHs6pLuTFVegrDZfyPbZ9y7HSEyDhELo56moQm5gqAS5sCNG1qbDYd4a3UGiZgtDhYLVgrTRvCubmBJEQeWeFUviPLjuqU4NkSqnRQF8kxQMT5Cf42JguLM7umQu665NLzUSLqJoNaa2dBiLg1ubmaXy2UcJLxCuAbwUHkbgAjD2qBmyhWgPzmwnqptu6R764kYbjfyVoF2FvwaSmsJ6wAVjhsMLsk2EoAwWiyfpN412NU3q69Rrk2NgAg15VshWnH6tpSSMyd5ihMuoSWKNeHhmdoq4VdbiaUVVKbMWP99w7eAXYs7xYftcZ1Qmf5RyvPMNaVxzVF1T84uNbe2pToGJQrStHtEb7Crz8zHdyzQC8yZsSnBEY5jnFVJicBiLYGgyM25swCzVsh6BsJrjhWHjGyJ3Ei6Qq98ZX5Rry6qbYEqGPAEjEo2yyPj4DSggEhpp7bjhnk2rgjeZdQthNWKBNTppTNsJYVuNcrE95523fnQUP3zSGCrEJCzEuFs7qZxGgbcdY14ibwPdMmjv3R5iZP7wm7BR2GvGGE4fDYhcMLCecT6Z97f5zXu8j1Z4s1XFiRtLSHmkW1esm787kHoXMpaMCmbGzjNpUKhkSEsKwozRT2vSiuqjHQdiANpNucbBQMn2qz9yKyQGWqiDe9yTrJGoW8a7JajDUdy6KEi9jdHd8oA4s75tL6GB8maAecMHt47h7K9ZhtxFdFjSjR3qpy6UV9T6Henbm2DgCvUtqF9FG8YEDDnxs5d7Yb43jK6VYiA15Ggxd1iRMauWN9ckXctGVrdBfDga22WuJHK5WoahKodNs8rwouGjGQSa9eb5mWyrNRdfNdboYqa1J3bmj6LUhY92dvTMuUMQ8pF83bropWAfanFtnJorDkEiyzq6HcWkNiZk4LAECL8TtbKsQEU3VmgCpXuQSA7K6tudCpJt2iyekXb2kYX8Kvp1m1frrThgvVkBU4mBk5LZzJoj3KGgYn7zkLFG7kBPM64SjSotFCyzQHQkbRkfC6noPgZhdUeXBNsboRJGintac8ZC4CYC5PjW2E6YnQxjdmz1wf3DZh8LSJDfmKgHP8johYd45FVouAiAiLXmJtwgkxFuNjv21i6uQLqupvAaHbPB1cezUubBr49tqFo1NzeDwjV5tQc1RcYdr6PZBZcvYsXcuMdWH8Rhq4udRCWAibQzduUbx8CVWhetHMBLVRUmUZmgwcjotrTACe2M8ACKddGf9XMjL4JXjK4YzNzsaAngUjfWcDuFcX5xUJrXdAr3TR9YpkyfDHzoV3B5mSgN1gjFd4wowVZWTVEh3kuYw1YDKpm'
const create_callData = 'cb_1111111111111111111111111111111Ku45JH6TECRXvrTEB2CJEWX1JDnpka1miFLNSeAqFxfV8cLGugsx3e3oDfXhKpp11WngHCwPrVASdgbKphcEz3cGXnc1sH'
const call_callData = 'cb_11111111111111111111111111111112gRjTdsrTQXzZz62s7h7y8uKnzwGCdH9Sf336S27gMUWCQ7jkepZyWyUhTGuseoqsFTShSTkKJcCmoW9uZhdU9BahVSaQW1FYg6XhFctuLKdtunbukKBDQnHc2QGdT5BpSa3xRVwcHE2Er7Lna4k8NTUv19Ehk8p5B5BkZrLThBNaZFeTX1Y6Z'
let contractId
const vmVersion = 1
const deposit = 4
const gasPrice =  1
const gas =  1600000 - 21000 // MAX GAS

let _salt;
let commitmentId;

describe('Native Transaction', function () {
  configure(this)

  let clientNative
  let client

  before(async () => {
    client = await ready(this)
    clientNative = await ready(this, true)

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

  it.only('native build of contract create tx', async () => {
    const txFromAPI = await client.contractCreateTx({ ownerId: senderId, code, vmVersion, deposit, amount, gas, gasPrice, fee, ttl, callData: create_callData  })
    const nativeTx = await clientNative.contractCreateTx({ ownerId: senderId, code, vmVersion, deposit, amount, gas, gasPrice, fee, ttl, callData: create_callData })
    // deploy contract
    await client.send(txFromAPI.tx)
    contractId = txFromAPI.contractId

    txFromAPI.tx.should.be.equal(nativeTx.tx)
    txFromAPI.contractId.should.be.equal(nativeTx.contractId)
  })

  it.only('native build of contract call tx', async () => {
    const txFromAPI = await client.contractCallTx({ callerId: senderId, contractId, vmVersion, amount, gas, gasPrice, fee, ttl, callData: call_callData, nonce: 5 })
    const nativeTx = await clientNative.contractCallTx({ callerId: senderId, contractId, vmVersion, amount, gas, gasPrice, fee, ttl, callData: call_callData, nonce: 5 })
    txFromAPI.should.be.equal(nativeTx)
  })
})
