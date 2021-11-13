/*
 * ISC License (ISC)
 * Copyright (c) 2021 aeternity developers
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
import BigNumber from 'bignumber.js'
import { getSdk, BaseAe } from './'
import { Crypto, MemoryAccount } from '../../src'

describe('Paying for transaction of another account', function () {
  let sdk

  before(async function () {
    sdk = await getSdk()
  })

  it('pays for spend transaction', async () => {
    const sender = MemoryAccount({ keypair: Crypto.generateKeyPair() })
    const receiver = MemoryAccount({ keypair: Crypto.generateKeyPair() })
    await sdk.spend(1e4, await sender.address())
    const spendTx = await sdk.spendTx({
      senderId: await sender.address(),
      recipientId: await receiver.address(),
      amount: 1e4
    })
    const signedSpendTx = await sdk.signTransaction(spendTx, { onAccount: sender, innerTx: true })
    const payerBalanceBefore = await sdk.balance(await sdk.address())
    const {
      fee: outerFee, tx: { tx: { fee: innerFee } }
    } = (await sdk.payForTransaction(signedSpendTx)).tx
    expect(await sdk.getBalance(await sdk.address())).to.equal(
      new BigNumber(payerBalanceBefore).minus(outerFee).minus(innerFee).toFixed()
    )
    expect(await sdk.getBalance(await sender.address())).to.equal('0')
    expect(await sdk.getBalance(await receiver.address())).to.equal('10000')
  })

  const contractSource = `
    contract Test =
      record state = { value: int }
      entrypoint init(x: int): state = { value = x }
      entrypoint getValue(): int = state.value
      stateful entrypoint setValue(x: int) = put(state{ value = x })`
  let contractAddress
  let unPayingSdk
  let payingContract

  it('pays for contract deployment', async () => {
    unPayingSdk = await BaseAe({
      withoutGenesisAccount: true,
      accounts: [MemoryAccount({ keypair: Crypto.generateKeyPair() })]
    }, {
      deepProps: { Ae: { defaults: { waitMined: false, innerTx: true } } }
    })
    const contract = await unPayingSdk.getContractInstance({ source: contractSource })
    const { rawTx: contractDeployTx, address } = await contract.deploy([42])
    contractAddress = address
    await sdk.payForTransaction(contractDeployTx)
    payingContract = await unPayingSdk.getContractInstance({ source: contractSource, contractAddress })
    expect((await payingContract.methods.getValue()).decodedResult).to.be.equal(42n)
  })

  it('pays for contract call', async () => {
    const contract = await unPayingSdk.getContractInstance({ source: contractSource, contractAddress })
    const { rawTx: contractCallTx } = await contract.methods.setValue(43)
    await sdk.payForTransaction(contractCallTx)
    expect((await payingContract.methods.getValue()).decodedResult).to.be.equal(43n)
  })
})
