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
  record testOption = { value: option(string) }

  public function init(value: string, key: int) : state = { value = value, key = key }
  public function retrieve() : (string, int) = (state.value, state.key)

  public function intFn(a: int) : int = a
  public function stringFn(a: string) : string = a
  public function boolFn(a: bool) : bool = a
  public function addressFn(a: address) : address = a
  public function emptyAddress() : address = #0
  public function contractAddress (ct: address) : address = ct
  public function accountAddress (ak: address) : address = ak

  public function tupleFn (a: (string, int)) : (string, int) = a
  public function tupleInTupleFn (a: ((string, string), int)) : ((string, string), int) = a
  public function tupleWithList (a: (list(int), int)) : (list(int), int) = a
  
  public function listFn(a: list(int)) : list(int) = a
  public function listInListFn(a: list(list(int))) : list(list(int)) = a
  
  public function mapFn(a: map(address, (string, int))) : map(address, (string, int)) = a
  public function mapOptionFn(a: map(address, (string, option(int)))) : map(address, (string, option(int))) = a
  
  public function getRecord() : state = state
  public stateful function setRecord(s: state) = put(s)
  public stateful function testRecord(s: testOption) = s
  
  public function intOption(s: option(int)) : option(int) = s
  public function listOption(s: option(list((int, string)))) : option(list((int ,string))) = s
  
  public function testFn(a: list(int), b: bool) : (list(int), bool) = (a, b)
  public function approve(tx_id: int, voting_contract: Voting) : int = tx_id
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
    })
    describe('Arguments Validation and Casting', function () {
      describe('INT', function () {
        it('Invalid', async () => {
          try {
            await contractObject.call('intFn', ['asd'])
          } catch (e) {
            e.message.should.be.equal('"Argument" at position 0 fails because [Value "asd" at path: [0] not a number]')
          }
        })
        it('Valid', async () => {
          await contractObject.call('intFn', [1])
        })
      })
      describe('STRING', function () {
        it('Invalid', async () => {
          try {
            await contractObject.call('stringFn', [123])
          } catch (e) {
            e.message.should.be.equal('"Argument" at position 0 fails because [Value "123" at path: [0] not a string]')
          }
        })
        it('Valid', async () => {
          await contractObject.call('stringFn', ['string'])
        })
      })
      describe('ADDRESS', function () {
        it('Invalid address', async () => {
          try {
            await contractObject.call('addressFn', ['asdasasd'])
          } catch (e) {
            e.message.should.be.equal('"Argument" at position 0 fails because ["[asdasasd]" with value "asdasasd" fails to match the required pattern: /^(ak_|ct_|ok_|oq_)/]')
          }
        })
        it('Invalid address type', async () => {
          try {
            await contractObject.call('addressFn', [333])
          } catch (e) {
            e.message.should.be.equal('"Argument" at position 0 fails because [Value "333" at path: [0] not a string]')
          }
        })
        it('Empty address', async () => {
          const result = await contractObject.call('emptyAddress')
          return result.decode().should.eventually.become(0)
        })
        it('Return address', async () => {
          const contractAddress = await (await contractObject
            .call('contractAddress', ['ct_AUUhhVZ9de4SbeRk8ekos4vZJwMJohwW5X8KQjBMUVduUmoUh']))
            .decode(null, { addressPrefix: 'ct' })

          const accountAddress = await (await contractObject
            .call('accountAddress', [await contract.address()]))
            .decode(null, { addressPrefix: 'ak' })

          contractAddress.should.be.equal('ct_AUUhhVZ9de4SbeRk8ekos4vZJwMJohwW5X8KQjBMUVduUmoUh')
          accountAddress.should.be.equal(await contract.address())
        })
        it('Valid', async () => {
          await contractObject.call('addressFn', ['ak_2ct6nMwmRnyGX6jPhraFPedZ5bYp1GXqpvnAq5LXeL5TTPfFif'])
        })
      })
      describe('TUPLE', function () {
        it('Invalid type', async () => {
          try {
            await contractObject.call('tupleFn', ['asdasasd'])
          } catch (e) {
            e.message.should.be.equal('"Argument" at position 0 fails because [Value "[asdasasd]" at path: [0] not a array]')
          }
        })
        it('Invalid tuple prop type', async () => {
          try {
            await contractObject.call('tupleFn', [[1, 'string']])
          } catch (e) {
            e.message.should.be.equal('"Argument" at position 0 fails because ["[1,string]" at position 0 fails because [Value "1" at path: [0,0] not a string], "[1,string]" at position 1 fails because [Value "string" at path: [0,1] not a number]]')
          }
        })
        it('Required tuple prop', async () => {
          try {
            await contractObject.call('tupleFn', [[1]])
          } catch (e) {
            e.message.should.be.equal('"Argument" at position 0 fails because ["[1]" at position 0 fails because [Value "1" at path: [0,0] not a string], "[1]" does not contain 1 required value(s)]')
          }
        })
        it('Wrong type in list inside tuple', async () => {
          try {
            await contractObject.call('tupleWithList', [[[true], 1]])
          } catch (e) {
            e.message.should.be.equal('"Argument" at position 0 fails because ["[true,1]" at position 0 fails because ["0" at position 0 fails because [Value "true" at path: [0,0,0] not a number]]]')
          }
        })
        it('Wrong type in tuple inside tuple', async () => {
          try {
            await contractObject.call('tupleInTupleFn', [[['str', 1], 1]])
          } catch (e) {
            e.message.should.be.equal('"Argument" at position 0 fails because ["[str,1,1]" at position 0 fails because ["Tuple argument" at position 1 fails because [Value "1" at path: [0,0,1] not a string]]]')
          }
        })
        it('Valid', async () => {
          await contractObject.call('tupleFn', [['test', 1]])
        })
      })
      describe('LIST', function () {
        it('Invalid type', async () => {
          try {
            await contractObject.call('listFn', ['asdasasd'])
          } catch (e) {
            e.message.should.be.equal('"Argument" at position 0 fails because [Value "[asdasasd]" at path: [0] not a array]')
          }
        })
        it('Invalid list element type', async () => {
          try {
            await contractObject.call('listFn', [[1, 'string']])
          } catch (e) {
            e.message.should.be.equal('"Argument" at position 0 fails because ["[1,string]" at position 1 fails because [Value "string" at path: [0,1] not a number]]')
          }
        })
        it('Invalid list element type nested', async () => {
          try {
            await contractObject.call('listInListFn', [[['childListWronmgElement'], 'parentListWrongElement']])
          } catch (e) {
            e.message.should.be.equal('"Argument" at position 0 fails because ["[childListWronmgElement,parentListWrongElement]" at position 0 fails because ["0" at position 0 fails because [Value "childListWronmgElement" at path: [0,0,0] not a number]], "[childListWronmgElement,parentListWrongElement]" at position 1 fails because [Value "1" at path: [0,1] not a array]]')
          }
        })
      })
      describe('MAP', function () {
        it('Valid', async () => {
          const address = await contract.address()
          const mapArg = new Map(
            [
              [address, ['someStringV', 324]]
            ]
          )
          const result = await contractObject.call('mapFn', [mapArg])
          return result.decode().should.eventually.become(Array.from(mapArg.entries()))
        })
        it('Map With Option Value', async () => {
          const address = await contract.address()
          let mapArgWithSomeValue = new Map(
            [
              [address, ['someStringV', Promise.resolve(123)]]
            ]
          )
          let mapArgWithNoneValue = new Map(
            [
              [address, ['someStringV', Promise.reject(Error()).catch(e => undefined)]]
            ]
          )
          let returnArgWithSomeValue = new Map(
            [
              [address, ['someStringV', 123]]
            ]
          )
          let returnArgWithNoneValue = new Map(
            [
              [address, ['someStringV', undefined]]
            ]
          )
          const resultWithSome = await contractObject.call('mapOptionFn', [mapArgWithSomeValue])
          const resultWithNone = await contractObject.call('mapOptionFn', [mapArgWithNoneValue])

          const decodedSome = await resultWithSome.decode()

          decodedSome.decode().should.eventually.become(Array.from(returnArgWithSomeValue.entries()))
          return resultWithNone.decode().should.eventually.become(Array.from(returnArgWithNoneValue.entries()))
        })
        it('Cast from string to int', async () => {
          const address = await contract.address()
          const mapArg = new Map(
            [
              [address, ['someStringV', '324']]
            ]
          )
          const result = await contractObject.call('mapFn', [mapArg])
          mapArg.set(address, ['someStringV', 324])
          return result.decode().should.eventually.become(Array.from(mapArg.entries()))
        })
        it('Cast from array to map', async () => {
          const address = await contract.address()
          const mapArg =
            [
              [address, ['someStringV', 324]]
            ]
          const result = await contractObject.call('mapFn', [mapArg])
          return result.decode().should.eventually.become(mapArg)
        })
      })
      describe('RECORD/STATE', function () {
        it('Valid Set Record (Cast from JS object)', async () => {
          await contractObject.call('setRecord', [{ value: 'qwe', key: 1234 }])
          const state = await contractObject.call('getRecord', [])

          return state.decode().should.eventually.become({ value: 'qwe', key: 1234 })
        })
        it('Get Record(Convert to JS object)', async () => {
          const result = await contractObject.call('getRecord', [])
          return result.decode().should.eventually.become({ value: 'qwe', key: 1234 })
        })
        it('Get Record With Option (Convert to JS object)', async () => {
          const result = await contractObject.call('testRecord', [{ value: Promise.resolve('some text') }])
          return result.decode().should.eventually.become({ value: 'some text' })
        })
        it('Invalid value type', async () => {
          try {
            await contractObject.call('setRecord', [{ value: 123, key: 'test' }])
          } catch (e) {
            e.message.should.be.equal('"Argument" at position 0 fails because [child "value" fails because [Value "123" at path: [0,value] not a string], child "key" fails because [Value "test" at path: [0,key] not a number]]')
          }
        })
      })
      describe('OPTION', function () {
        it('Set Some Option Value(Cast from JS value/Convert result to JS)', async () => {
          const optionRes = await contractObject.call('intOption', [Promise.resolve(123)])

          return optionRes.decode().should.eventually.become(123)
        })
        it('Set Some Option List Value(Cast from JS value/Convert result to JS)', async () => {
          const optionRes = await contractObject.call('listOption', [Promise.resolve([[1, 'testString']])])

          return optionRes.decode().should.eventually.become([[1, 'testString']])
        })
        it('Set None Option Value(Cast from JS value/Convert to JS)', async () => {
          const optionRes = await contractObject.call('intOption', [Promise.reject(Error())])

          return optionRes.decode().should.eventually.become(undefined)
        })
        it('Invalid option type', async () => {
          try {
            await contractObject.call('intOption', [1])
          } catch (e) {
            e.message.should.be.equal('"Argument" at position 0 fails because ["[1]" must be an object]')
          }
        })
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
      it('Call contract with contract type argument', async () => {
        const result = await contractObject.call('approve', [0, 'ct_AUUhhVZ9de4SbeRk8ekos4vZJwMJohwW5X8KQjBMUVduUmoUh'])
        return result.decode().should.eventually.become(0)
      })
    })
  })
})
