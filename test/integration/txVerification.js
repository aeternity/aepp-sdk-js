/* eslint-disable */
import { before, describe } from 'mocha'
import { configure, ready } from '.'
import { generateKeyPair } from '../../es/utils/crypto'
import { BASE_VERIFICATION_SCHEMA, SIGNATURE_VERIFICATION_SCHEMA } from '../../es/tx/builder/schema'

const WARNINGS = [...SIGNATURE_VERIFICATION_SCHEMA, ...BASE_VERIFICATION_SCHEMA].reduce((acc, [msg, v, error]) => error.type === 'warning' ? [...acc, error.key]: acc, [])
const ERRORS = [...BASE_VERIFICATION_SCHEMA, ...SIGNATURE_VERIFICATION_SCHEMA,].reduce((acc, [msg, v, error]) => error.type === 'error' ? [...acc, error.key]: acc, [])

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


    const {warning} = { ...(await client.unpackAndVerify(spendTx)).validation, ...(await client.unpackAndVerify(signedTx)).validation }

    JSON.stringify(WARNINGS).should.be.equals(JSON.stringify(Object.keys(warning)))
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


    const {error} = { ...(await client.unpackAndVerify(spendTx)).validation, ...(await client.unpackAndVerify(signedTx)).validation }

    JSON.stringify(ERRORS).should.be.equals(JSON.stringify(Object.keys(error)))
  })
})
