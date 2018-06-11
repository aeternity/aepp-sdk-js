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
import { Wallet, Contract } from '@aeternity/aepp-sdk'
import * as utils from './utils'
import * as R from 'ramda'

const identityContract = `
contract Identity =
  type state = ()
  function main(x : int) = x
`

const stateContract = `
contract StateContract =
  type state = { value: string }
  public function init(value) : state = { value = value }
  public function retrieve() = state.value
`

const identityContractByteCode = '0x366000602037620000606200003460205180805180516004146200007b57505b80518051600414620000d857505b5060011951005b805903906000518059600081529081818162000056915b805081590391505090565b8352505060005250f35b8059039060008052f35b5990565b5080620001289080905090565b602001517f696e69740000000000000000000000000000000000000000000000000000000014620000ac576200001f565b50829150620000ba6200006a565b596000815290818181620000ce916200004b565b835250505b905090565b602001517f6d61696e000000000000000000000000000000000000000000000000000000001462000109576200002d565b6020015159506000516200006e90805180826200017291600091505090565b5960008152908181816200013d918091505090565b835250509050620000d3565b825180599081525060208401602084038393509350935050600082136200014957809250505090565b915050806000525959905090509056'

describe('contract', function () {
  utils.configure(this)

  let client
  let contract
  let bytecode
  let deployed

  before(async function () {
    client = await utils.client
    contract = Contract.create(client, { wallet: Wallet.create(client, utils.sourceWallet) })
  })
  
  it('compiles Sophia code', async () => {
    bytecode = await contract.compile(identityContract)
    return bytecode.should.have.property('bytecode')
  })

  it('invokes function against compiled code', async () => {
    await contract.callStatic(identityContractByteCode, 'sophia')('main', { args: '42', conformFn: parseInt }).should.eventually.become(42)
    return bytecode.call('main', { args: '42', conformFn: parseInt }).should.eventually.become(42)
  })

  it('deploys compiled contracts', async () => {
    deployed = await bytecode.deploy()
    deployed.should.have.property('address')
    return contract.deploy(identityContractByteCode)().should.eventually.have.property('address')
  })

  // TODO re-enable at 0.15.0
  it.skip('calls deployed contracts', async () => {
    return deployed.call('main', { args: '42', conformFn: parseInt }).should.eventually.become(42)
  })

  // TODO datatype decoding
  it.skip('initializes contract state', async () => {
    const data = `"Hello World!"`
    return contract.compile(stateContract).then(bytecode => bytecode.deploy({ initState: data })).then(deployed => deployed.call('retrieve', '()')).catch(e => { console.log(e); throw e }).should.eventually.become('Hello World!')
  })
})
