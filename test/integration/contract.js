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
  public function retrieve() : string = state.value
`
const testContract = `
contract Voting =
  public function test() : int = 1

contract StateContract =
  record state = { value: string, key: int }
  public function init(value: string, key: int) : state = { value = value, key = key }
  public function retrieve() : (string, int) = (state.value, state.key)
  public function intFn(a: int) : int = a
  public function boolFn(a: bool) : bool = a
  public function listFn(a: list(int)) : list(int) = a
  public function testFn(a: list(int), b: bool) : (list(int), bool) = (a, b)
  public function approve(tx_id: int, voting_contract: Voting) : int = tx_id
  public function getRecord() : state = state
  public function setRecord(s: state) : state = s
`

const encodedNumberSix = 'cb_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAaKNdnK'

plan('10000000000000000')

describe('Contract', function () {
  configure(this)

  let contract
  let bytecode
  let deployed

  before(async function () {
    contract = await ready(this)
  })

  it('precompiled bytecode can be deployed', async () => {
    const code = await contract.contractCompile(identityContract)
    return contract.contractDeploy(code.bytecode, identityContract).should.eventually.have.property('address')
  })

  it('compiles Sophia code', async () => {
    bytecode = await contract.contractCompile(identityContract)
    return bytecode.should.have.property('bytecode')
  })

  it('deploys compiled contracts', async () => {
    deployed = await bytecode.deploy()
    return deployed.should.have.property('address')
  })

  it('calls deployed contracts', async () => {
    const result = await deployed.call('main', ['42'])
    return result.decode('int').should.eventually.become({
      type: 'word',
      value: 42
    })
  })

  it('calls deployed contracts static', async () => {
    const result = await deployed.callStatic('main', ['42'])
    return result.decode('int').should.eventually.become({
      type: 'word',
      value: 42
    })
  })

  it('initializes contract state', async () => {
    const data = `"Hello World!"`
    return contract.contractCompile(stateContract)
      .then(bytecode => bytecode.deploy([data]))
      .then(deployed => deployed.call('retrieve'))
      .then(result => result.decode('string'))
      .catch(e => {
        console.log(e)
        throw e
      })
      .should.eventually.become({
        type: 'string',
        value: 'Hello World!'
      })
  })

  describe('Sophia Compiler', function () {
    it('compile', async () => {
      const code = await contract.compileContractAPI(identityContract)
      const prefix = code.slice(0, 2)
      const isString = typeof code === 'string'
      prefix.should.be.equal('cb')
      isString.should.be.equal(true)
    })
    it('get contract ACI', async () => {
      const aci = await contract.contractGetACI(identityContract)
      aci.should.have.property('interface')
    })
    it('encode call-data', async () => {
      const encoded = await contract.contractEncodeCallDataAPI(identityContract, 'init', [])
      const prefix = encoded.slice(0, 2)
      const isString = typeof encoded === 'string'
      prefix.should.be.equal('cb')
      isString.should.be.equal(true)
    })
    it('decode call-data', async () => {
      return contract.contractDecodeDataAPI('int', encodedNumberSix).should.eventually.become({
        type: 'word',
        value: 6
      })
    })
  })

  describe('Contract ACI Interface', function () {
    let contractObject

    it('Generate ACI object', async () => {
      contractObject = await contract.getContractInstance(testContract)
      contractObject.should.have.property('interface')
      contractObject.should.have.property('aci')
      contractObject.should.have.property('source')
      contractObject.should.have.property('compiled')
      contractObject.should.have.property('deployInfo')
      contractObject.should.have.property('compile')
      contractObject.should.have.property('call')
      contractObject.should.have.property('deploy')
    })
    it('Compile contract', async () => {
      await contractObject.compile()
      const isCompiled = contractObject.compiled.length && contractObject.compiled.slice(0, 3) === 'cb_'
      isCompiled.should.be.equal(true)
    })

    describe('Deploy contract', function () {
      it('Deploy contract before compile', async () => {
        contractObject.compiled = null
        await contractObject.deploy(['123', 1])
        const isCompiled = contractObject.compiled.length && contractObject.compiled.slice(0, 3) === 'cb_'
        isCompiled.should.be.equal(true)
      })
      it('Deploy contract with state', async () => {
        await contractObject.deploy(['blabla', 100])
        const state = await contractObject.call('retrieve')
        return state.decode().should.eventually.become(['blabla', 100])
      })
      it('Deploy contract with wrong arguments', async () => {
        try {
          await contractObject.deploy(['blabla', true])
        } catch (e) {
          e.message.should.be.equal('Validation error: ["Argument index: 1, value: [true] must be of type [int]"]')
        }
      })
    })
    describe('Call contract', function () {
      it('Call contract using using sophia type arguments', async () => {
        const res = await contractObject.call('listFn', ['[ 1, 2 ]'], { skipArgsConvert: true })
        return res.decode().should.eventually.become([1, 2])
      })
      it('Call contract using using js type arguments', async () => {
        const res = await contractObject.call('listFn', [[ 1, 2 ]])
        return res.decode().should.eventually.become([1, 2])
      })
      it('Call contract using using js type arguments and skip result transform', async () => {
        const res = await contractObject.call('listFn', [[ 1, 2 ]], { skipTransformDecoded: true })
        const decoded = await res.decode()
        const decodedJSON = '{"type":"list","value":[{"type":"word","value":1},{"type":"word","value":2}]}'
        JSON.stringify(decoded).should.be.equal(decodedJSON)
      })
      it('Call contract with wrong arguments (pass not all args)', async () => {
        try {
          await contractObject.call('testFn', [[1, 2]])
        } catch (e) {
          e.message.should.be.equal('Validation error: ["Argument index: 1, value: [undefined] must be of type [bool]"]')
        }
      })
      it('Call contract with wrong arguments (wrong arg type)', async () => {
        try {
          await contractObject.call('testFn', [[1, 2], 1234]) // Second arg must be of type bool
        } catch (e) {
          e.message.should.be.equal('Validation error: ["Argument index: 1, value: [1234] must be of type [bool]"]')
        }
      })
      it('Call contract with contract type argument', async () => {
        const result = await contractObject.call('approve', [0, 'ct_AUUhhVZ9de4SbeRk8ekos4vZJwMJohwW5X8KQjBMUVduUmoUh'])
        return result.decode().should.eventually.become(0)
      })
      it('Call contract with return of record type', async () => {
        const result = await contractObject.call('getRecord', [])
        return result.decode().should.eventually.become({ value: 'blabla', key: 100 })
      })
      it('Call contract with argument of record type', async () => {
        const result = await contractObject.call('setRecord', [{ value: 'qwe', key: 1234 }])
        return result.decode().should.eventually.become({ value: 'qwe', key: 1234 })
      })
    })
  })
})
