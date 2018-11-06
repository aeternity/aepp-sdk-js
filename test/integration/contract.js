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

plan(1000000000)

describe('Contract', function () {
  configure(this)

  let contract
  let bytecode
  let deployed
  let compiledIdentity

  before(async function () {
    contract = await ready(this)
  })

  describe('precompiled bytecode', () => {
    it('can be invoked', async () => {
      compiledIdentity = await contract.contractCompile(identityContract)
      const result = await contract.contractCallStatic(compiledIdentity.bytecode, 'sophia', 'main', { args: '(42)' })
      return result.decode('int').should.eventually.become({
        type: 'word',
        value: 42
      })
    })

    it('can be deployed', async () => {
      return contract.contractDeploy(compiledIdentity.bytecode, 'sophia').should.eventually.have.property('address')
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
