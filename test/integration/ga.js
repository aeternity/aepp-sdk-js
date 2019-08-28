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
import { configure, ready } from './'
import { generateKeyPair } from '../../es/utils/crypto'
import MemoryAccount from '../../es/account/memory'

const authContract = `contract BlindAuth =
    record state = { owner : address }
    entrypoint init(owner' : address) = { owner = owner' }
    stateful entrypoint authorize(r: int) : bool =
        // r is a random number only used to make tx hashes unique
        switch(Auth.tx_hash)
            None          => abort("Not in Auth context")
            Some(tx_hash) => true
`
// Todo Enable GA
describe.skip('Generalize Account', function () {
  configure(this)

  let client
  const gaAccount = generateKeyPair()

  before(async function () {
    client = await ready(this)
    await client.spend('100000000000000000000', gaAccount.publicKey)
    await client.addAccount(await MemoryAccount({ keypair: gaAccount }))
  })

  it('Make account GA', async () => {
    await client.createGeneralizeAccount('authorize', authContract, [gaAccount.publicKey], { onAccount: gaAccount.publicKey })
    const isGa = await client.isGA(gaAccount.publicKey)
    isGa.should.be.equal(true)
  })
  it('Fail on make GA on already GA account', async () => {
    try {
      await client.createGeneralizeAccount('authorize', authContract, [gaAccount.publicKey], { onAccount: gaAccount.publicKey })
    } catch (e) {
      e.message.should.be.equal(`Account ${gaAccount.publicKey} is already GA`)
    }
  })
  it('Spend Using Meta Tx', async () => {
    const r = Math.floor(Math.random() * 20)
    const r2 = Math.floor(Math.random() * 20)
    const callData = await client.contractEncodeCall(authContract, 'authorize', [`${r}`])

    const { publicKey } = generateKeyPair()
    await client.spend(10000, publicKey, { authData: { callData }, onAccount: gaAccount.publicKey })
    await client.spend(10000, publicKey, { authData: { source: authContract, args: [`${r2}`] }, onAccount: gaAccount.publicKey })
    const balanceAfter = await client.balance(publicKey)
    balanceAfter.should.be.equal(`20000`)
  })
})
