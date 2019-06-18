/* eslint-disable */
import { before, describe } from 'mocha'
import { configure, ready } from '.'
import { generateKeyPair } from '../../es/utils/crypto'
import { BASE_VERIFICATION_SCHEMA, SIGNATURE_VERIFICATION_SCHEMA } from '../../es/tx/builder/schema'

const WARNINGS = [...SIGNATURE_VERIFICATION_SCHEMA, ...BASE_VERIFICATION_SCHEMA].reduce((acc, [msg, v, error]) => error.type === 'warning' ? [...acc, error.txKey] : acc, [])
const ERRORS = [...BASE_VERIFICATION_SCHEMA, ...SIGNATURE_VERIFICATION_SCHEMA,].reduce((acc, [msg, v, error]) => error.type === 'error' ? [...acc, error.txKey] : acc, [])
const channelCreate = 'tx_+NkLAfhCuECIIeWttRUiZ32uriBdmM1t+dCg90KuG2ABxOiuXqzpAul6uTWvsyfx3EFJDah6trudrityh+6XSX3mkPEimhgGuJH4jzIBoQELtO15J/l7UeG8teE0DRIzWyorEsi8UiHWPEvLOdQeYYgbwW1nTsgAAKEB6bv2BOYRtUYKOzmZ6Xcbb2BBfXPOfFUZ4S9+EnoSJcqIG8FtZ07IAACIAWNFeF2KAAAKAIYSMJzlQADAoDBrIcoop8JfZ4HOD9p3nDTiNthj7jjl+ArdHwEMUrvQgitwOr/v3Q=='

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

    const { validation } = await client.unpackAndVerify(spendTx)
    const warning = validation
      .filter(({ type }) => type === 'warning')
      .map(({ txKey }) => txKey)

    JSON.stringify(WARNINGS).should.be.equals(JSON.stringify(warning))
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

    const { validation } = await client.unpackAndVerify(signedTx)
    const error = validation
      .filter(({ type, txKey }) => type === 'error') // exclude contract vm/abi, has separated test for it
      .map(({ txKey }) => txKey)

    JSON.stringify(ERRORS.filter(e => e !== 'gasPrice' && e !== 'ctVersion')).should.be.equals(JSON.stringify(error))
  })
  it('verify transaction before broadcast', async () => {
    client = await ready(this)
    const spendTx = await client.spendTx({
      senderId: await client.address(),
      recipientId: await client.address(),
      amount: 1,
      ttl: 2,
      absoluteTtl: true
    })

    try {
      await client.send(spendTx, { verify: true })
    } catch ({ errorData }) {
      const atLeastOneError = !!errorData.validation.length
      atLeastOneError.should.be.equal(true)
    }
  })
  it('Verify vmVersion/abiVersion for contract transactions', async () => {
    // Contract create transaction with wrong abi/vm version (vm: 3, abi: 0)
    const contractCreateTx = 'tx_+QSaKgGhASLDuRmSBJZv91HE219uqXb2L0adh+bilzBWUi93m5blArkD+PkD9UYCoI2tdssfNdXZOclcaOwkTNB2S/SXIVsLDi7KUoxJ3Jki+QL7+QEqoGjyZ2M4/1CIOaukd0nv+ovofvKE8gf7PZmYcBzVOIfFhG1haW64wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACg//////////////////////////////////////////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAALhAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPkBy6C5yVbyizFJqfWYeqUF89obIgnMVzkjQAYrtsG9n5+Z6oRpbml0uGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//////////////////////////////////////////+5AUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAP//////////////////////////////////////////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP//////////////////////////////////////////7jMYgAAZGIAAISRgICAUX+5yVbyizFJqfWYeqUF89obIgnMVzkjQAYrtsG9n5+Z6hRiAADAV1CAUX9o8mdjOP9QiDmrpHdJ7/qL6H7yhPIH+z2ZmHAc1TiHxRRiAACvV1BgARlRAFtgABlZYCABkIFSYCCQA2ADgVKQWWAAUVlSYABSYADzW2AAgFJgAPNbWVlgIAGQgVJgIJADYAAZWWAgAZCBUmAgkANgA4FSgVKQVltgIAFRUVlQgJFQUICQUJBWW1BQgpFQUGIAAIxWhTIuMS4wgwMAAIcF9clYKwgAAAAAgxgX+IQ7msoAuGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAILnJVvKLMUmp9Zh6pQXz2hsiCcxXOSNABiu2wb2fn5nqAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABkansY'
    const { validation } = await client.unpackAndVerify(contractCreateTx)
    const vmAbiError = validation.find(el => el.txKey === 'ctVersion')
    vmAbiError.msg.split(',')[0].should.be.equal('Wrong abi/vm version')
  })
  it('Verify channel create tx', async () => {
    const res = await client.unpackAndVerify(channelCreate)
    Array.isArray(res.validation).should.be.equal(true)
  })
})
