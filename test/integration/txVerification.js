import { before, describe, it } from 'mocha'
import { expect } from 'chai'
import { getSdk } from '.'
import { generateKeyPair } from '../../src/utils/crypto'
import MemoryAccount from '../../src/account/memory'
import verifyTransaction from '../../src/tx/validator'
import { ArgumentError } from '../../src/utils/errors'

describe('Verify Transaction', function () {
  let aeSdk, node

  before(async () => {
    aeSdk = await getSdk()
    node = aeSdk.selectedNode.instance
    await aeSdk.spend(1234, 'ak_LAqgfAAjAbpt4hhyrAfHyVg9xfVQWsk1kaHaii6fYXt6AJAGe')
  })

  it('validates params in buildRawTx', async () => {
    return expect(aeSdk.spendTx({})).to.be.rejectedWith(ArgumentError, 'value should be a number, got undefined instead')
    // TODO: should be /^Transaction build error./ instead
  })

  it('returns errors', async () => {
    const spendTx = await aeSdk.spendTx({
      senderId: await aeSdk.address(),
      recipientId: await aeSdk.address(),
      amount: 1e30,
      fee: '1000',
      nonce: '1',
      ttl: 2,
      absoluteTtl: true
    })
    const signedTx = await aeSdk.signTransaction(
      spendTx,
      { onAccount: MemoryAccount({ keypair: generateKeyPair() }) }
    )
    const errors = await verifyTransaction(signedTx, node)
    expect(errors.map(({ key }) => key)).to.be.eql([
      'InvalidSignature', 'InsufficientFee', 'ExpiredTTL', 'InsufficientBalance', 'NonceAlreadyUsed'
    ])
  })

  it('returns NonceHigh error', async () => {
    const spendTx = await aeSdk.spendTx({
      senderId: await aeSdk.address(),
      recipientId: await aeSdk.address(),
      amount: 100,
      nonce: 100
    })
    const errors = await verifyTransaction(spendTx, node)
    expect(errors.map(({ key }) => key)).to.be.eql(['NonceHigh'])
  })

  it('verifies transactions before broadcasting', async () => {
    const spendTx = await aeSdk.spendTx({
      senderId: await aeSdk.address(),
      recipientId: await aeSdk.address(),
      amount: 1,
      ttl: 2,
      absoluteTtl: true
    })
    const error = await aeSdk.send(spendTx).catch(e => e)
    expect(error.validation).to.have.lengthOf(1)
  })

  it('verifies vmVersion/abiVersion for contract transactions', async () => {
    // Contract create transaction with wrong abi/vm version (vm: 3, abi: 0)
    const contractCreateTx = 'tx_+QSaKgGhASLDuRmSBJZv91HE219uqXb2L0adh+bilzBWUi93m5blArkD+PkD9UYCoI2tdssfNdXZOclcaOwkTNB2S/SXIVsLDi7KUoxJ3Jki+QL7+QEqoGjyZ2M4/1CIOaukd0nv+ovofvKE8gf7PZmYcBzVOIfFhG1haW64wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACg//////////////////////////////////////////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAALhAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPkBy6C5yVbyizFJqfWYeqUF89obIgnMVzkjQAYrtsG9n5+Z6oRpbml0uGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//////////////////////////////////////////+5AUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAP//////////////////////////////////////////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP//////////////////////////////////////////7jMYgAAZGIAAISRgICAUX+5yVbyizFJqfWYeqUF89obIgnMVzkjQAYrtsG9n5+Z6hRiAADAV1CAUX9o8mdjOP9QiDmrpHdJ7/qL6H7yhPIH+z2ZmHAc1TiHxRRiAACvV1BgARlRAFtgABlZYCABkIFSYCCQA2ADgVKQWWAAUVlSYABSYADzW2AAgFJgAPNbWVlgIAGQgVJgIJADYAAZWWAgAZCBUmAgkANgA4FSgVKQVltgIAFRUVlQgJFQUICQUJBWW1BQgpFQUGIAAIxWhTIuMS4wgwMAAIcF9clYKwgAAAAAgxgX+IQ7msoAuGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAILnJVvKLMUmp9Zh6pQXz2hsiCcxXOSNABiu2wb2fn5nqAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABkansY'
    const errors = await verifyTransaction(contractCreateTx, node)
    expect(errors.map(({ key }) => key)).to.include('VmAndAbiVersionMismatch')
  })

  it('verifies gasPrice for contract transactions', async () => {
    const contractCreateTx = 'tx_+QSWKgGhASLDuRmSBJZv91HE219uqXb2L0adh+bilzBWUi93m5blArkD+PkD9UYCoI2tdssfNdXZOclcaOwkTNB2S/SXIVsLDi7KUoxJ3Jki+QL7+QEqoGjyZ2M4/1CIOaukd0nv+ovofvKE8gf7PZmYcBzVOIfFhG1haW64wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACg//////////////////////////////////////////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAALhAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPkBy6C5yVbyizFJqfWYeqUF89obIgnMVzkjQAYrtsG9n5+Z6oRpbml0uGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//////////////////////////////////////////+5AUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAP//////////////////////////////////////////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP//////////////////////////////////////////7jMYgAAZGIAAISRgICAUX+5yVbyizFJqfWYeqUF89obIgnMVzkjQAYrtsG9n5+Z6hRiAADAV1CAUX9o8mdjOP9QiDmrpHdJ7/qL6H7yhPIH+z2ZmHAc1TiHxRRiAACvV1BgARlRAFtgABlZYCABkIFSYCCQA2ADgVKQWWAAUVlSYABSYADzW2AAgFJgAPNbWVlgIAGQgVJgIJADYAAZWWAgAZCBUmAgkANgA4FSgVKQVltgIAFRUVlQgJFQUICQUJBWW1BQgpFQUGIAAIxWhTIuMS4wgzMAMIcF9clYKwgAAAAAgxgX+Hu4YAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAguclW8osxSan1mHqlBfPaGyIJzFc5I0AGK7bBvZ+fmeoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA9CJM4='
    const errors = await verifyTransaction(contractCreateTx, node)
    expect(errors.map(({ key }) => key)).to.include('MinGasPrice')
  })

  it('verifies channel create tx', async () => {
    const channelCreate = 'tx_+IgyAqEBA36iFX3O+BMXMZJbffeT423KLpEuFsISUTsGu8Sb10eJBWvHXi1jEAAAoQGTnVZ1Jow5NGyBOg3NAf+ie3mV8qDj/wBwyKBHFNdhT4kFa8deLWMQAAAAAQCGECcSfcAAwMCgGAbROhx5lfoSkXsM5MQLw+EAWei3pcUGj/zWSO8RGkAKfIRASg=='
    const errors = await verifyTransaction(channelCreate, node)
    expect(errors).to.have.lengthOf(2)
  })

  it('verifies nameFee for nameClaim transaction', async () => {
    const tx = 'tx_+KILAfhCuEAtbc38n/FH8jZHO0DkEkiLZZm8ypEzZEhbjyHtaoEYkENOE9tD+Xp6smFMou9X521oI4gkFBQGwSQaQk6Z7XMNuFr4WCACoQHkWpoidhJW2EZEega88I1P9Ktw1DFBUWwrzkr5jC5zUAORc29tZUF1Y3Rpb24uY2hhaW6HDwTrMteR15AJQ0VVyE5TcqKSstgfbGV6hg9HjghAAAAGpIPS'
    const errors = await verifyTransaction(tx, node)
    expect(errors.map(({ key }) => key)).to.include('InsufficientBalance')
  })

  it('verifies contractId for contractCall transaction', async () => {
    const contractCall = 'tx_+GIrAaEBSzqoqjLLKO9NzXLgIBsTC+sNe5ronuTV/lr8IBJNlAECoQV/aqb9TshuuhhzeovvJCD/WmSOnqF8RCu4eY8hXYg/DgOGpYctWWAAAACCE4iEO5rKAIgrEYB4IJIbCmfzF0w='
    const errors = await verifyTransaction(contractCall, node)
    expect(errors.map(({ key }) => key)).to.include('ContractNotFound')
  })
})
