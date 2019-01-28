/* eslint-disable */
import { before, describe } from 'mocha'
import { configure, ready } from '.'
import { generateKeyPair } from '../../es/utils/crypto'

describe('Verify TransACTION', function () {
  configure(this)
  let client

  before(async () => {
    // console.log(unpackTx('tx_+E0MAaEBzqet5HDJ+Z2dTkAIgKhvHUm7REti8Rqeu2S7z+tz/vOhAWnI9oKhE3auHUzf8n0pGmDsYLFjzEbpqmzaGuQFAAQThLLQYegAH5oDmv4='))
    client = await ready(this)
    await client.spend(1234, 'ak_LAqgfAAjAbpt4hhyrAfHyVg9xfVQWsk1kaHaii6fYXt6AJAGe')
  })
  it('checkWarnings', async () => {
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
    console.log(warning)
    Object.keys(warning).length.should.be.equals(3)
  })
  it('checkErrors', async () => {
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
