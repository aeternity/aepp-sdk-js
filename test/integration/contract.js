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
import { configure, plan, ready } from './'

const identityContract = `
contract Identity =
  type state = ()
  function main(x : int) = x
`

const stateContract = `
contract StateContract =
  record state = { value: string }
  public function init(value) : state = { value = value }
  public function retrieve() = state.value
`

const identityContractByteCode = 'cb_8TfnaSmi7HKCLz4oeoMuyPzGoWbCWMGHKcokE815juzWq8L15xENS435GHB1sYMLkBMee5n9xVUKokfsDqqhdhekX6dFn2Xi7uQ9wGaQ5F92osUnPbfJhKpsjEKSdc44CucTJciKAGUBoZDqtPma6GbtnyC2y1scMJHV3rjvtz3qjCeSiryd8LiKZpdkhKa6V6x51rv9b57CLFLSTiLJQFPAfSwJmTgavoJJJRBmcfVYMDqfwA7gQwiQSM3481YbpZMXqQQCvaufVGDDNT9khvn8wTR1ynsmceNh1vY4H8isUQ6njou4X1mhPHoaMWiw61kHWGkanasbv7NpYrT2P6FZFqbRfm5jPzocrspSaWacXPfDp8XXv9LGoQ4wsZPWjdu26e5kHohnuCRxWb9csGjpfVB3ZXUG65XEiEDYXzvkFW4Z8DVx9S3zpU57fuWRpdphbrt4LxfzWqmLSNUpcSwjpZX8Q4jiNj6N6bU23FddzsLgHapAss3i4KYD184XXAze4KUSqyT1818UfEJB8M7LeYzcZetoFvfVN8aPHdSsLiuEUJu1zXyzTmSEGrP5d1p26AV7b'

plan(1000000000)

describe('Contract', function () {
  configure(this)

  let contract
  let bytecode
  let deployed

  before(async function () {
    contract = await ready(this)
  })

  describe.only('precompiled bytecode', () => {
    it('can be invoked', async () => {
      const result = await contract.contractCallStatic(identityContractByteCode, 'sophia', 'main', { args: '42' })
      return result.decode('int').should.eventually.become({
        type: 'word',
        value: 42
      })
    })

    it('can be deployed', async () => {
      return contract.contractDeploy(identityContractByteCode, 'sophia').should.eventually.have.property('address')
    })
  })

  it('compiles Sophia code', async () => {
    bytecode = await contract.contractCompile(identityContract)
    return bytecode.should.have.property('bytecode')
  })

  it('invokes function against compiled code', async () => {
    const result = await bytecode.call('main', { args: '42' })
    return result.decode('int').should.eventually.become({
      type: 'word',
      value: 42
    })
  })

  it('deploys compiled contracts', async () => {
    deployed = await bytecode.deploy()
    return deployed.should.have.property('address')
  })

  it('calls deployed contracts', async () => {
    const result = await deployed.call('main', { args: '42' })
    return result.decode('int').should.eventually.become({
      type: 'word',
      value: 42
    })
  })

  it('initializes contract state', async () => {
    const data = `"Hello World!"`
    return contract.contractCompile(stateContract)
      .then(bytecode => bytecode.deploy({ initState: data }))
      .then(deployed => deployed.call('retrieve'))
      .then(result => result.decode('string'))
      .catch(e => { console.log(e); throw e })
      .should.eventually.become({
        type: 'string',
        value: 'Hello World!'
      })
  })
})
