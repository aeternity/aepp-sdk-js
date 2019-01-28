/* eslint-disable */
import { before, describe } from 'mocha'
import { configure, ready } from '.'
import { generateKeyPair } from '../../es/utils/crypto'

describe('Verify Transaction', function () {
  configure(this)
  let client

  before(async () => {
    client = await ready(this)
    await client.spend(1234, 'ak_LAqgfAAjAbpt4hhyrAfHyVg9xfVQWsk1kaHaii6fYXt6AJAGe')
  })
  it('validate params', async () => {
    return client.spendTx({}).should.be.rejectedWith({
      code: 'TX_BUILD_VALIDATION_ERROR',
      msg: 'Validation error'
    })
  })
  it('check warnings', async () => {
    const spendTx = await client.spendTx({
      senderId: await client.address(),
      recipientId: await client.address(),
      amount: '1242894753985394725983479583427598237459328752353245345',
      nonce: '100',
      ttl: 2,
      absoluteTtl: true
    })

    // Sign using another account
    const signedTx = await client.signTransaction(spendTx)


    const {warning} = { ...(await client.unpackAndVerify(spendTx)), ...(await client.unpackAndVerify(signedTx)) }
    Object.keys(warning).length.should.be.equals(3)
  })
  it('check errors', async () => {
    const spendTx = await client.spendTx({
      senderId: await client.address(),
      recipientId: await client.address(),
      amount: 1,
      fee: '1000',
      nonce: '1',
      ttl: 2,
      absoluteTtl: true
    })

    client.setKeypair(generateKeyPair())
    // Sign using another account
    const signedTx = await client.signTransaction(spendTx)


    const {error} = { ...(await client.unpackAndVerify(spendTx)), ...(await client.unpackAndVerify(signedTx)) }
    Object.keys(error).length.should.be.equals(4)
  })
})
