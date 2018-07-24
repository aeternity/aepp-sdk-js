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

import {describe, it, before} from 'mocha'
import {configure, plan, ready} from './'

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

const identityContractByteCode = '0x36600060203762000062620000366020518080805180516004146200007d57505b5080518051600414620000db57505b5060011951005b805903906000518059600081529081818162000058915b805081590391505090565b8352505060005250f35b8059039060008052f35b5990565b50806200012c9080905090565b602001517f696e69740000000000000000000000000000000000000000000000000000000014620000ae5762000020565b5050829150620000bd6200006c565b596000815290818181620000d1916200004d565b835250505b905090565b602001517f6d61696e00000000000000000000000000000000000000000000000000000000146200010c576200002f565b602001515159506000516200007090805180826200017691600091505090565b59600081529081818162000141918091505090565b835250509050620000d6565b825180599081525060208401602084038393509350935050600082136200014d57809250505090565b915050806000525959905090509056'

plan(1000000000)

describe('Contract', function () {
  configure(this)

  let contract
  let bytecode
  let deployed

  before(async function () {
    contract = await ready(this)
  })

  describe('precompiled bytecode', () => {
    it('can be invoked', async () => {
      const result = await contract.contractCallStatic(identityContractByteCode, 'sophia', 'main', {args: '42'})
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
    const result = await bytecode.call('main', {args: '42'})
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
    const result = await deployed.call('main', {args: '42'})
    return result.decode('int').should.eventually.become({
      type: 'word',
      value: 42
    })
  })

  it('initializes contract state', async () => {
    const data = `"Hello World!"`
    return contract.contractCompile(stateContract)
      .then(bytecode => bytecode.deploy({initState: data}))
      .then(deployed => deployed.call('retrieve'))
      .then(result => result.decode('string'))
      .catch(e => { console.log(e); throw e })
      .should.eventually.become({
        type: 'string',
        value: 'Hello World!'
      })
  })
})
