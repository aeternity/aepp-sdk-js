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
import { expect } from 'chai'
import { before, describe, it } from 'mocha'
import * as R from 'ramda'
import { getFunctionACI } from '../../src/contract/aci/helpers'
import { decodeEvents, readType, SOPHIA_TYPES } from '../../src/contract/aci/transformation'
import { decode } from '../../src/tx/builder/helpers'
import { getSdk } from './'

const identityContract = `
contract Identity =
 entrypoint getArg(x : int) = x
`

const libContract = `
namespace TestLib =
  function sum(x: int, y: int) : int = x + y
`
const testContract = `
namespace Test =
  function double(x: int): int = x*2


contract interface Voting =
  type test_type = int
  record state = { value: string, key: test_type, testOption: option(string) }
  record test_record = { value: string, key: list(test_type) }
  entrypoint test : () => int

include "testLib"
contract StateContract =
  type number = int
  record state = { value: string, key: number, testOption: option(string) }
  record yesEr = { t: number}

  datatype event = TheFirstEvent(int) | AnotherEvent(string, address) | AnotherEvent2(bool, string, int)
  datatype dateUnit = Year | Month | Day
  datatype one_or_both('a, 'b) = Left('a) | Right('b) | Both('a, 'b)

  entrypoint init(value: string, key: int, testOption: option(string)) : state = { value = value, key = key, testOption = testOption }
  entrypoint retrieve() : string*int = (state.value, state.key)

  entrypoint remoteContract(a: Voting) : int = 1
  entrypoint remoteArgs(a: Voting.test_record) : Voting.test_type = 1
  entrypoint intFn(a: int) : int = a
  payable entrypoint stringFn(a: string) : string = a
  entrypoint boolFn(a: bool) : bool = a
  entrypoint addressFn(a: address) : address = a
  entrypoint contractAddress (ct: address) : address = ct
  entrypoint accountAddress (ak: address) : address = ak

  entrypoint tupleFn (a: string*int) : string*int = a
  entrypoint tupleInTupleFn (a: (string*string)*int) : (string*string)*int = a
  entrypoint tupleWithList (a: list(int)*int) : list(int)*int = a

  entrypoint listFn(a: list(int)) : list(int) = a
  entrypoint listInListFn(a: list(list(int))) : list(list(int)) = a

  entrypoint mapFn(a: map(address, string*int)) : map(address, string*int) = a
  entrypoint mapOptionFn(a: map(address, string*option(int))) : map(address, string*option(int)) = a

  entrypoint getRecord() : state = state
  stateful entrypoint setRecord(s: state) = put(s)

  entrypoint intOption(s: option(int)) : option(int) = s
  entrypoint listOption(s: option(list(int*string))) : option(list(int*string)) = s

  entrypoint testFn(a: list(int), b: bool) : list(int)*bool = (a, b)
  entrypoint approve(tx_id: int, voting_contract: Voting) : int = tx_id

  entrypoint hashFn(s: hash): hash = s
  entrypoint signatureFn(s: signature): signature = s
  entrypoint bytesFn(s: bytes(32)): bytes(32) = s

  entrypoint usingExternalLib(s: int): int = Test.double(s)

  entrypoint datTypeFn(s: dateUnit): dateUnit = s
  entrypoint datTypeGFn(x : one_or_both(int, string)) : int =
    switch(x)
      Left(x)    => x
      Right(_)   => abort("asdasd")
      Both(x, _) => x
  stateful entrypoint emitEvents() : unit =
    Chain.event(TheFirstEvent(42))
    Chain.event(AnotherEvent("This is not indexed", Contract.address))
    Chain.event(AnotherEvent2(true, "This is not indexed", 1))
`
const filesystem = {
  testLib: libContract
}

describe('Contract ACI Interface', function () {
  let sdk
  let contractObject

  before(async function () {
    sdk = await getSdk()
  })

  describe('Events parsing', async () => {
    let cInstance
    let eventResult
    let decodedEventsWithoutACI
    let decodedEventsUsingACI
    let decodedEventsUsingBuildInMethod

    before(async () => {
      cInstance = await sdk.getContractInstance(
        testContract,
        { filesystem }
      )
      await cInstance.deploy(['test', 1, 'some'])
      eventResult = await cInstance.methods.emitEvents()
      const { log } = await sdk.tx(eventResult.hash)
      decodedEventsWithoutACI = decodeEvents(log, events)
      decodedEventsUsingACI = cInstance.decodeEvents('emitEvents', log)
      decodedEventsUsingBuildInMethod = cInstance.methods.emitEvents.decodeEvents(log)
    })
    const events = [
      { name: 'AnotherEvent2', types: [SOPHIA_TYPES.bool, SOPHIA_TYPES.string, SOPHIA_TYPES.int] },
      { name: 'AnotherEvent', types: [SOPHIA_TYPES.string, SOPHIA_TYPES.address] },
      { name: 'TheFirstEvent', types: [SOPHIA_TYPES.int] }
    ]
    const checkEvents = (event, schema) => {
      schema.name.should.be.equal(event.name)
      schema.types.forEach((t, tIndex) => {
        const value = event.decoded[tIndex]
        switch (t) {
          case SOPHIA_TYPES.address:
            event.address.should.be.equal(`ct_${value}`)
            break
          case SOPHIA_TYPES.int:
            expect(typeof value === 'string' || typeof value === 'number')
              .to.be.equal(true)
            Number.isInteger(+value).should.be.equal(true)
            break
          case SOPHIA_TYPES.bool:
            value.should.be.a('boolean')
            break
          case SOPHIA_TYPES.string:
            value.should.be.a('string')
            break
        }
      })
    }
    events
      .forEach((el, i) => {
        describe(`Correct parse of ${el.name}(${el.types})`, () => {
          it('ACI call result', () => checkEvents(eventResult.decodedEvents[i], el))
          it('ACI instance', () => checkEvents(decodedEventsUsingACI[i], el))
          it('ACI instance methods', () => checkEvents(decodedEventsUsingBuildInMethod[i], el))
          it('Without ACI', () => checkEvents(decodedEventsWithoutACI[i], el))
        })
      })
  })

  it('Generate ACI object', async () => {
    contractObject = await sdk.getContractInstance(
      testContract,
      { filesystem, ttl: 0 }
    )
    contractObject.should.have.property('interface')
    contractObject.should.have.property('aci')
    contractObject.should.have.property('source')
    contractObject.should.have.property('compiled')
    contractObject.should.have.property('deployInfo')
    contractObject.should.have.property('compile')
    contractObject.should.have.property('call')
    contractObject.should.have.property('deploy')
    contractObject.options.ttl.should.be.equal(0)
    contractObject.options.should.have.property('filesystem')
    contractObject.options.filesystem.should.have.property('testLib')
    const functionsFromACI = contractObject.aci.functions.map(({ name }) => name)
    const methods = Object.keys(contractObject.methods)
    R.equals(methods, functionsFromACI).should.be.equal(true)
  })
  it('Compile contract', async () => {
    await contractObject.compile()
    const isCompiled = contractObject.compiled.length && contractObject.compiled.slice(0, 3) === 'cb_'
    isCompiled.should.be.equal(true)
  })
  it('Dry-run deploy fn', async () => {
    const res = await contractObject.methods.init.get('123', 1, 'hahahaha')
    res.result.should.have.property('gasUsed')
    res.result.should.have.property('returnType')
    // TODO: ensure that return value is always can't be decoded (empty?)
  })
  it('Dry-run deploy fn on specific account', async () => {
    const current = await sdk.address()
    const onAccount = sdk.addresses().find(acc => acc !== current)
    const { result } = await contractObject.methods.init.get('123', 1, 'hahahaha', { onAccount })
    result.should.have.property('gasUsed')
    result.should.have.property('returnType')
    result.callerId.should.be.equal(onAccount)
  })
  it('Deploy contract before compile', async () => {
    contractObject.compiled = null
    await contractObject.methods.init('123', 1, 'hahahaha')
    const isCompiled = contractObject.compiled.length && contractObject.compiled.startsWith('cb_')
    isCompiled.should.be.equal(true)
  })
  it('Deploy/Call contract with waitMined: false', async () => {
    const deployed = await contractObject.methods.init('123', 1, 'hahahaha', { waitMined: false })
    await sdk.poll(deployed.transaction, { interval: 50, attempts: 1200 })
    expect(deployed.result).to.be.equal(undefined)
    const result = await contractObject.methods.intFn.send(2, { waitMined: false })
    expect(result.result).to.be.equal(undefined)
    result.txData.should.not.be.equal(undefined)
    await sdk.poll(result.hash, { interval: 50, attempts: 1200 })
  })
  it('Generate ACI object with corresponding bytecode', async () => {
    await sdk.getContractInstance(
      testContract,
      { contractAddress: contractObject.deployInfo.address, filesystem, ttl: 0 }
    )
  })
  it('Generate ACI object with not corresponding bytecode', async () => {
    try {
      await sdk.getContractInstance(
        identityContract,
        { contractAddress: contractObject.deployInfo.address, ttl: 0 }
      )
    } catch (e) {
      e.message.should.be.equal('Contract source do not correspond to the contract bytecode deployed on the chain')
    }
  })
  it('Generate ACI object with not corresponding bytecode and force this check', async () => {
    await sdk.getContractInstance(
      identityContract,
      { forceCodeCheck: true, contractAddress: contractObject.deployInfo.address, ttl: 0 }
    )
  })
  it('Throw error on creating contract instance with invalid contractAddress', async () => {
    try {
      await sdk.getContractInstance(
        testContract,
        { filesystem, contractAddress: 'ct_asdasdasd', ttl: 0 }
      )
    } catch (e) {
      e.message.should.be.equal('Invalid name or address: ct_asdasdasd')
    }
  })
  it('Throw error on creating contract instance with contract address which is not found on-chain or not active', async () => {
    const contractAddress = 'ct_ptREMvyDbSh1d38t4WgYgac5oLsa2v9xwYFnG7eUWR8Er5cmT'
    try {
      await sdk.getContractInstance(
        testContract,
        { filesystem, contractAddress, ttl: 0 }
      )
    } catch (e) {
      e.message.should.be.equal(`Contract with address ${contractAddress} not found on-chain or not active`)
    }
  })
  it('Fail on paying to not payable function', async () => {
    const amount = 100
    try {
      await contractObject.methods.intFn.send(1, { amount })
    } catch (e) {
      e.message.should.be.equal(`You try to pay "${amount}" to function "intFn" which is not payable. Only payable function can accept tokens`)
    }
  })
  it('Can pay to payable function', async () => {
    const contractBalance = await sdk.balance(contractObject.deployInfo.address)
    await contractObject.methods.stringFn.send('1', { amount: 100 })
    const balanceAfter = await sdk.balance(contractObject.deployInfo.address)
    balanceAfter.should.be.equal(`${+contractBalance + 100}`)
  })
  it('Call contract on specific account', async () => {
    const current = await sdk.address()
    const onAccount = sdk.addresses().find(acc => acc !== current)
    const { result } = await contractObject.methods.intFn('123', { onAccount })
    result.callerId.should.be.equal(onAccount)
  })
  describe('Arguments Validation and Casting', function () {
    describe('INT', function () {
      it('Invalid', async () => {
        try {
          await contractObject.methods.intFn('asd')
        } catch (e) {
          e.message.should.be.equal('"[asd]" must be a number')
        }
      })
      it('Valid', async () => {
        const { decodedResult } = await contractObject.methods.intFn.get(1)
        decodedResult.toString().should.be.equal('1')
      })
    })
    describe('BOOL', function () {
      it('Invalid', async () => {
        try {
          await contractObject.methods.boolFn({})
        } catch (e) {
          e.message.should.be.equal('"[[object Object]]" must be a boolean')
        }
      })
      it('Valid', async () => {
        const { decodedResult } = await contractObject.methods.boolFn.get(true)
        decodedResult.should.be.equal(true)
      })
    })
    describe('STRING', function () {
      it('Invalid', async () => {
        try {
          await contractObject.methods.stringFn(123)
        } catch (e) {
          e.message.should.be.equal('"[123]" must be a string')
        }
      })
      it('Valid', async () => {
        const { decodedResult } = await contractObject.methods.stringFn('string')
        decodedResult.should.be.equal('string')
      })
    })
    describe('ADDRESS', function () {
      it('Invalid address', async () => {
        try {
          await contractObject.methods.addressFn('asdasasd')
        } catch (e) {
          e.message.should.be.equal('"[asdasasd]" with value "asdasasd" fails to match the required pattern: /^(ak_|ct_|ok_|oq_)/')
        }
      })
      it('Invalid address type', async () => {
        try {
          await contractObject.methods.addressFn(333)
        } catch (e) {
          e.message.should.be.equal('"[333]" must be a string')
        }
      })
      it('Return address', async () => {
        const { decodedResult } = await contractObject.methods.accountAddress(await sdk.address())
        decodedResult.should.be.equal(await sdk.address())
      })
      it('Valid', async () => {
        const { decodedResult } = await contractObject.methods.addressFn('ak_2ct6nMwmRnyGX6jPhraFPedZ5bYp1GXqpvnAq5LXeL5TTPfFif')
        decodedResult.should.be.equal('ak_2ct6nMwmRnyGX6jPhraFPedZ5bYp1GXqpvnAq5LXeL5TTPfFif')
      })
    })
    describe('TUPLE', function () {
      it('Invalid type', async () => {
        try {
          await contractObject.methods.tupleFn('asdasasd')
        } catch (e) {
          e.message.should.be.equal('"[asdasasd]" must be an array')
        }
      })
      it('Invalid tuple prop type', async () => {
        try {
          await contractObject.methods.tupleFn([1, 'string'])
        } catch (e) {
          e.message.should.be.equal('"[0][0]" must be a string. "[0][1]" must be a number')
        }
      })
      it('Required tuple prop', async () => {
        try {
          await contractObject.methods.tupleFn([1])
        } catch (e) {
          e.message.should.be.equal('"[0][0]" must be a string. "[1]" does not contain 1 required value(s)')
        }
      })
      it('Wrong type in list inside tuple', async () => {
        try {
          await contractObject.methods.tupleWithList([[true], 1])
        } catch (e) {
          e.message.should.be.equal('"[0][0][0]" must be a number')
        }
      })
      it('Wrong type in tuple inside tuple', async () => {
        try {
          await contractObject.methods.tupleInTupleFn([['str', 1], 1])
        } catch (e) {
          e.message.should.be.equal('"[0][0][1]" must be a string')
        }
      })
      it('Valid', async () => {
        const { decodedResult } = await contractObject.methods.tupleFn(['test', 1])
        decodedResult.should.be.eql(['test', 1])
      })
    })
    describe('LIST', function () {
      it('Invalid type', async () => {
        try {
          await contractObject.methods.listFn('asdasasd')
        } catch (e) {
          e.message.should.be.equal('"[asdasasd]" must be an array')
        }
      })
      it('Invalid list element type', async () => {
        try {
          await contractObject.methods.listFn([1, 'string'])
        } catch (e) {
          e.message.should.be.equal('"[0][1]" must be a number')
        }
      })
      it('Invalid list element type nested', async () => {
        try {
          await contractObject.methods.listInListFn([['childListWronmgElement'], 'parentListWrongElement'])
        } catch (e) {
          e.message.should.be.equal('"[0][0][0]" must be a number. "[0][1]" must be an array')
        }
      })
      it('Valid', async () => {
        const { decodedResult } = await contractObject.methods.listInListFn([[1, 2], [3, 4]])
        decodedResult.should.be.eql([[1, 2], [3, 4]])
      })
    })

    describe('MAP', function () {
      const address = 'ak_gvxNbZf5CuxYVfcUFoKAP4geZatWaC2Yy4jpx5vZoCKank4Gc'

      it('Valid', async () => {
        const mapArg = new Map([[address, ['someStringV', 324]]])
        const { decodedResult } = await contractObject.methods.mapFn(Object.fromEntries(mapArg))
        decodedResult.should.be.eql(Array.from(mapArg.entries()))
      })

      it('Map With Option Value', async () => {
        const mapWithSomeValue = new Map([[address, ['someStringV', 123]]])
        const mapWithNoneValue = new Map([[address, ['someStringV', undefined]]])
        let result = await contractObject.methods.mapOptionFn(mapWithSomeValue)
        result.decodedResult.should.be.eql(Array.from(mapWithSomeValue.entries()))
        result = await contractObject.methods.mapOptionFn(mapWithNoneValue)
        result.decodedResult.should.be.eql(Array.from(mapWithNoneValue.entries()))
      })

      it('Cast from string to int', async () => {
        const mapArg = new Map([[address, ['someStringV', '324']]])
        const result = await contractObject.methods.mapFn(mapArg)
        mapArg.set(address, ['someStringV', 324])
        result.decodedResult.should.be.eql(Array.from(mapArg.entries()))
      })

      it('Cast from array to map', async () => {
        const mapArg = [[address, ['someStringV', 324]]]
        const { decodedResult } = await contractObject.methods.mapFn(mapArg)
        decodedResult.should.be.eql(mapArg)
      })
    })

    describe('RECORD/STATE', function () {
      it('Valid Set Record (Cast from JS object)', async () => {
        await contractObject.methods.setRecord({ value: 'qwe', key: 1234, testOption: 'test' })
        const state = await contractObject.methods.getRecord()

        state.decodedResult.should.be.eql({ value: 'qwe', key: 1234, testOption: 'test' })
      })
      it('Get Record(Convert to JS object)', async () => {
        const result = await contractObject.methods.getRecord()
        result.decodedResult.should.be.eql({ value: 'qwe', key: 1234, testOption: 'test' })
      })
      it('Get Record With Option (Convert to JS object)', async () => {
        await contractObject.methods.setRecord({ key: 1234, value: 'qwe', testOption: 'resolved string' })
        const result = await contractObject.methods.getRecord()
        result.decodedResult.should.be.eql({ value: 'qwe', key: 1234, testOption: 'resolved string' })
      })
      it('Invalid value type', async () => {
        try {
          await contractObject.methods.setRecord({ value: 123, key: 'test' })
        } catch (e) {
          e.message.should.be.equal('"[0].value" must be a string. "[0].key" must be a number')
        }
      })
    })
    describe('OPTION', function () {
      it('Set Some Option Value(Cast from JS value/Convert result to JS)', async () => {
        const optionRes = await contractObject.methods.intOption(123)

        optionRes.decodedResult.should.be.equal(123)
      })
      it('Set Some Option List Value(Cast from JS value/Convert result to JS)', async () => {
        const optionRes = await contractObject.methods.listOption([[1, 'testString']])

        optionRes.decodedResult.should.be.eql([[1, 'testString']])
      })
      it('Set None Option Value(Cast from JS value/Convert to JS)', async () => {
        const optionRes = await contractObject.methods.intOption(undefined)
        const isUndefined = optionRes.decodedResult === undefined
        isUndefined.should.be.equal(true)
      })
      it('Invalid option type', async () => {
        try {
          await contractObject.methods.intOption('string')
        } catch (e) {
          e.message.should.be.equal('"[string]" must be a number')
        }
      })
    })
    describe('NAMESPACES', function () {
      it('Use namespace in function body', async () => {
        const res = await contractObject.methods.usingExternalLib(2)

        res.decodedResult.should.be.equal(4)
      })
    })
    describe('DATATYPE', function () {
      it('Invalid type', async () => {
        try {
          await contractObject.methods.datTypeFn({})
        } catch (e) {
          e.message.should.be.equal('"[[object Object]]" does not match any of the allowed types')
        }
      })
      it('Call generic datatype', async () => {
        const res = await contractObject.methods.datTypeGFn({ Left: [2] })
        res.decodedResult.should.be.equal(2)
      })
      it('Invalid arguments length', async () => {
        try {
          await contractObject.methods.datTypeGFn()
        } catch (e) {
          e.message.should.be.equal('Function "datTypeGFn" require 1 arguments of types [{"StateContract.one_or_both":["int","string"]}] but get []')
        }
      })
      it('Invalid variant', async () => {
        try {
          await contractObject.methods.datTypeFn('asdcxz')
        } catch (e) {
          e.message.should.be.equal('"[asdcxz]" must be one of [Year, Month, Day, object]')
        }
      })
      it('Valid', async () => {
        const res = await contractObject.methods.datTypeFn('Year')
        res.decodedResult.should.be.equal('Year')
      })
    })
    describe('Hash', function () {
      it('Invalid type', async () => {
        try {
          await contractObject.methods.hashFn({})
        } catch (e) {
          e.message.should.be.equal('The first argument must be of type string or an instance of Buffer, ArrayBuffer, or Array or an Array-like Object. Received an instance of Object')
        }
      })
      it('Invalid length', async () => {
        const address = await sdk.address()
        const decoded = Buffer.from(decode(address, 'ak').slice(1))
        try {
          await contractObject.methods.hashFn(decoded)
        } catch (e) {
          e.message.should.include('must be 32 bytes')
        }
      })
      it('Valid', async () => {
        const address = await sdk.address()
        const decoded = decode(address, 'ak')
        const hashAsBuffer = await contractObject.methods.hashFn(decoded)
        const hashAsHex = await contractObject.methods.hashFn(decoded.toString('hex'))
        hashAsBuffer.decodedResult.should.be.equal(decoded.toString('hex'))
        hashAsHex.decodedResult.should.be.equal(decoded.toString('hex'))
      })
    })
    describe('Signature', function () {
      it('Invalid type', async () => {
        try {
          await contractObject.methods.signatureFn({})
        } catch (e) {
          e.message.should.be.equal('The first argument must be of type string or an instance of Buffer, ArrayBuffer, or Array or an Array-like Object. Received an instance of Object')
        }
      })
      it('Invalid length', async () => {
        const address = await sdk.address()
        const decoded = decode(address, 'ak')
        try {
          await contractObject.methods.signatureFn(decoded)
        } catch (e) {
          e.message.should.include('must be 64 bytes')
        }
      })
      it('Valid', async () => {
        const address = await sdk.address()
        const decoded = decode(address, 'ak')
        const fakeSignature = Buffer.from(await sdk.sign(decoded))
        const hashAsBuffer = await contractObject.methods.signatureFn(fakeSignature)
        const hashAsHex = await contractObject.methods.signatureFn(fakeSignature.toString('hex'))
        hashAsBuffer.decodedResult.should.be.equal(fakeSignature.toString('hex'))
        hashAsHex.decodedResult.should.be.equal(fakeSignature.toString('hex'))
      })
    })
    describe('Bytes', function () {
      it('Invalid type', async () => {
        try {
          await contractObject.methods.bytesFn({})
        } catch (e) {
          e.message.should.be.equal('The first argument must be of type string or an instance of Buffer, ArrayBuffer, or Array or an Array-like Object. Received an instance of Object')
        }
      })
      it('Invalid length', async () => {
        const address = await sdk.address()
        const decoded = decode(address, 'ak')
        try {
          await contractObject.methods.bytesFn(Buffer.from([...decoded, 2]))
        } catch (e) {
          e.message.should.include('must be 32 bytes')
        }
      })
      it('Valid', async () => {
        const address = await sdk.address()
        const decoded = decode(address, 'ak')
        const hashAsBuffer = await contractObject.methods.bytesFn(decoded)
        const hashAsHex = await contractObject.methods.bytesFn(decoded.toString('hex'))
        hashAsBuffer.decodedResult.should.be.equal(decoded.toString('hex'))
        hashAsHex.decodedResult.should.be.equal(decoded.toString('hex'))
      })
    })
  })
  describe('Call contract', function () {
    it('Call contract using using js type arguments', async () => {
      const res = await contractObject.methods.listFn([1, 2])
      return res.decode().should.eventually.become([1, 2])
    })
    it('Call contract with contract type argument', async () => {
      const result = await contractObject.methods.approve(0, 'ct_AUUhhVZ9de4SbeRk8ekos4vZJwMJohwW5X8KQjBMUVduUmoUh')
      return result.decode().should.eventually.become(0)
    })
  })
  describe('Type resolving', () => {
    let cInstance
    before(async () => {
      cInstance = await sdk.getContractInstance(
        testContract,
        { filesystem }
      )
    })
    it('Resolve remote contract type', async () => {
      const fnACI = getFunctionACI(cInstance.aci, 'remoteContract', cInstance.externalAci)
      readType('Voting', fnACI.bindings).t.should.be.equal('address')
    })
    it('Resolve external contract type', async () => {
      const fnACI = getFunctionACI(cInstance.aci, 'remoteArgs', cInstance.externalAci)
      readType(fnACI.arguments[0].type, fnACI.bindings).should.eql({
        t: 'record',
        generic: [{
          name: 'value',
          type: 'string'
        }, {
          name: 'key',
          type: {
            list: ['Voting.test_type']
          }
        }]
      })
      readType(fnACI.returns, fnACI.bindings).t.should.be.equal('int')
    })
  })
})
