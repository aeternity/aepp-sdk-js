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
import MemoryAccount from '../../src/account/memory'

const authContractSource = `contract BlindAuth =
  stateful entrypoint authorize(r: int) : bool =
    // r is a random number only used to make tx hashes unique
    switch(Auth.tx_hash)
      None          => abort("Not in Auth context")
      Some(tx_hash) => true
`
describe('Generalized Account', function () {
  let aeSdk
  const gaAccount = generateKeyPair()

  before(async function () {
    aeSdk = await getSdk()
    await aeSdk.spend('100000000000000000000', gaAccount.publicKey)
    aeSdk.removeAccount(aeSdk.selectedAddress)
    await aeSdk.addAccount(MemoryAccount({ keypair: gaAccount }), { select: true })
  })

  it('Make account GA', async () => {
    await aeSdk.createGeneralizedAccount('authorize', authContractSource)
    const isGa = await aeSdk.isGA(gaAccount.publicKey)
    isGa.should.be.equal(true)
  })

  it('Fail on make GA on already GA', async () => {
    await aeSdk.createGeneralizedAccount('authorize', authContractSource)
      .should.be.rejectedWith(`Account ${gaAccount.publicKey} is already GA`)
  })

  it('Init MemoryAccount for GA and Spend using GA', async () => {
    aeSdk.removeAccount(gaAccount.publicKey)
    await aeSdk.addAccount(MemoryAccount({ gaId: gaAccount.publicKey }), { select: true })
    const { publicKey } = generateKeyPair()

    const r = () => Math.floor(Math.random() * 20).toString()
    const authContract = await aeSdk.getContractInstance({ source: authContractSource })
    const callData = authContract.calldata.encode('BlindAuth', 'authorize', [r()])
    await aeSdk.spend(10000, publicKey, { authData: { callData } })
    await aeSdk.spend(10000, publicKey, { authData: { source: authContractSource, args: [r()] } })
    const balanceAfter = await aeSdk.balance(publicKey)
    balanceAfter.should.be.equal('20000')
  })
})
