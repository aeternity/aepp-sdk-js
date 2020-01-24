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
import Compiler from '../../es/contract/compiler'
import { describe, it, before } from 'mocha'
import { BaseAe, configure, plan, ready, compilerUrl } from './'
import { decode } from '../../es/tx/builder/helpers'

import * as R from 'ramda'

const identityContract = `
contract Identity =
 entrypoint main(x : int) = x
`

const errorContract = `
contract Identity =
 payable stateful entrypoint main(x : address) = Chain.spend(x, 1000000000)
`

const stateContract = `
contract StateContract =
  record state = { value: string }
  entrypoint init(value) : state = { value = value }
  entrypoint retrieve() : string = state.value
`
const libContract = `
namespace TestLib =
  function sum(x: int, y: int) : int = x + y
`
const contractWithLib = `
include "testLib"
contract Voting =
  entrypoint sumNumbers(x: int, y: int) : int = TestLib.sum(x, y)
`
const testContract = `
namespace Test =
  function double(x: int): int = x*2


contract Voting =
  entrypoint test : () => int

include "testLib"
contract StateContract =
  type number = int
  record state = { value: string, key: number, testOption: option(string) }
  record yesEr = { t: number}
  
  datatype dateUnit = Year | Month | Day
  datatype one_or_both('a, 'b) = Left('a) | Right('b) | Both('a, 'b)

  entrypoint init(value: string, key: int, testOption: option(string)) : state = { value = value, key = key, testOption = testOption }
  entrypoint retrieve() : string*int = (state.value, state.key)

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
`

const encodedNumberSix = 'cb_DA6sWJo='
const filesystem = {
  testLib: libContract
}
plan('1000000000000000000000')

describe('Contract', function () {
  configure(this)

  let contract
  let bytecode
  let deployed

  before(async function () {
    contract = await ready(this, true, true)
  })

  it('precompiled bytecode can be deployed', async () => {
    const { version, consensusProtocolVersion } = contract.getNodeInfo()
    console.log(`Node => ${version}, consensus => ${consensusProtocolVersion}, compiler => ${contract.compilerVersion}`)
    const code = await contract.contractCompile(identityContract)
    return contract.contractDeploy(code.bytecode, identityContract).should.eventually.have.property('address')
  })

  it('compiles Sophia code', async () => {
    bytecode = await contract.contractCompile(identityContract)
    return bytecode.should.have.property('bytecode')
  })

  it('deploy static compiled contract', async () => {
    const res = await bytecode.deployStatic([])
    res.result.should.have.property('gasUsed')
    res.result.should.have.property('returnType')
  })

  it('deploys compiled contracts', async () => {
    deployed = await bytecode.deploy([])
    return deployed.should.have.property('address')
  })

  it('Deploy/Call/Dry-run contract using callData', async () => {
    const callArg = 1
    const { bytecode } = await contract.contractCompile(identityContract)
    const callDataDeploy = await contract.contractEncodeCall(identityContract, 'init', [])
    const callDataCall = await contract.contractEncodeCall(identityContract, 'main', [callArg.toString()])

    const deployStatic = await contract.contractCallStatic(identityContract, null, 'init', callDataDeploy, { bytecode })
    deployStatic.result.should.have.property('gasUsed')
    deployStatic.result.should.have.property('returnType')

    const deployed = await contract.contractDeploy(bytecode, identityContract, callDataDeploy)
    deployed.result.should.have.property('gasUsed')
    deployed.result.should.have.property('returnType')
    deployed.should.have.property('address')

    const callStaticRes = await contract.contractCallStatic(identityContract, deployed.address, 'main', callDataCall)
    callStaticRes.result.should.have.property('gasUsed')
    callStaticRes.result.should.have.property('returnType')
    const decodedCallStaticResult = await callStaticRes.decode()
    decodedCallStaticResult.should.be.equal(callArg)

    const callRes = await contract.contractCall(identityContract, deployed.address, 'main', callDataCall)
    callRes.result.should.have.property('gasUsed')
    callRes.result.should.have.property('returnType')
    callRes.result.should.have.property('returnType')
    const decodedCallResult = await callRes.decode()
    decodedCallResult.should.be.equal(callArg)
  })

  it('Deploy and call contract on specific account', async () => {
    const current = await contract.address()
    const onAccount = contract.addresses().find(acc => acc !== current)

    const deployed = await bytecode.deploy([], { onAccount })
    deployed.result.callerId.should.be.equal(onAccount)
    const callRes = await deployed.call('main', ['42'])
    callRes.result.callerId.should.be.equal(onAccount)
    const callStaticRes = await deployed.callStatic('main', ['42'])
    callStaticRes.result.callerId.should.be.equal(onAccount)
  })

  it('Call-Static deploy transaction', async () => {
    const compiled = bytecode.bytecode
    const res = await contract.contractCallStatic(identityContract, null, 'init', [], { bytecode: compiled })
    res.result.should.have.property('gasUsed')
    res.result.should.have.property('returnType')
  })

  it('Call-Static deploy transaction on specific hash', async () => {
    const { hash } = await contract.topBlock()
    const compiled = bytecode.bytecode
    const res = await contract.contractCallStatic(identityContract, null, 'init', [], { bytecode: compiled, top: hash })
    res.result.should.have.property('gasUsed')
    res.result.should.have.property('returnType')
  })
  it('Test handleError(Parse and check contract execution error)', async () => {
    const code = await contract.contractCompile(errorContract)
    const deployed = await code.deploy()
    try {
      await deployed.call('main', [await contract.address()])
    } catch (e) {
      e.message.indexOf('Invocation failed').should.not.be.equal(-1)
    }
  })

  it('Dry-run without accounts', async () => {
    const client = await BaseAe()
    client.removeAccount('ak_2a1j2Mk9YSmC1gioUq4PWRm3bsv887MbuRVwyv4KaUGoR1eiKi')
    client.addresses().length.should.be.equal(0)
    const address = await client.address().catch(e => false)
    address.should.be.equal(false)
    const { result } = await client.contractCallStatic(identityContract, deployed.address, 'main', ['42'])
    result.callerId.should.be.equal(client.Ae.defaults.dryRunAccount.pub)
  })

  it('calls deployed contracts', async () => {
    const result = await deployed.call('main', ['42'])
    return result.decode().should.eventually.become(42)
  })

  it('call contract/deploy with `waitMined: false`', async () => {
    const deployed = await bytecode.deploy([], { waitMined: false })
    await contract.poll(deployed.transaction)
    Boolean(deployed.result === undefined).should.be.equal(true)
    Boolean(deployed.txData === undefined).should.be.equal(true)
    const result = await deployed.call('main', ['42'], { waitMined: false, verify: false })
    Boolean(result.result === undefined).should.be.equal(true)
    Boolean(result.txData === undefined).should.be.equal(true)
    await contract.poll(result.hash)
  })

  it('calls deployed contracts static', async () => {
    const result = await deployed.callStatic('main', ['42'])
    return result.decode().should.eventually.become(42)
  })

  it('initializes contract state', async () => {
    const data = '"Hello World!"'
    return contract.contractCompile(stateContract)
      .then(bytecode => bytecode.deploy([data]))
      .then(deployed => deployed.call('retrieve'))
      .then(result => result.decode())
      .catch(e => {
        console.log(e)
        throw e
      })
      .should.eventually.become('Hello World!')
  })
  describe('Namespaces', () => {
    let deployed
    it('Can compiler contract with external deps', async () => {
      const filesystem = {
        testLib: libContract
      }
      const compiled = await contract.contractCompile(contractWithLib, { filesystem })
      compiled.should.have.property('bytecode')
    })
    it('Throw error when try to compile contract without providing external deps', async () => {
      try {
        await contract.contractCompile(contractWithLib)
      } catch (e) {
        e.message.indexOf('Couldn\'t find include file').should.not.be.equal(-1)
      }
    })
    it('Can deploy contract with external deps', async () => {
      const filesystem = {
        testLib: libContract
      }
      const compiled = await contract.contractCompile(contractWithLib, { filesystem })
      deployed = await compiled.deploy()
      deployed.should.have.property('address')

      const deployedStatic = await compiled.deployStatic([])
      deployedStatic.result.should.have.property('gasUsed')
      deployedStatic.result.should.have.property('returnType')

      const encodedCallData = await compiled.encodeCall('sumNumbers', ['1', '2'])
      encodedCallData.indexOf('cb_').should.not.be.equal(-1)
    })
    it('Can call contract with external deps', async () => {
      const callResult = await deployed.call('sumNumbers', ['1', '2'])
      const decoded = await callResult.decode()
      decoded.should.be.equal(3)

      const callStaticResult = await deployed.callStatic('sumNumbers', ['1', '2'])
      const decoded2 = await callStaticResult.decode()
      decoded2.should.be.equal(3)
    })
  })

  describe('Sophia Compiler', function () {
    let callData
    let bytecode
    it('Init un-compatible compiler version', async () => {
      try {
        // Init compiler
        const compiler = await Compiler({ compilerUrl })
        // Overwrite compiler version
        compiler.compilerVersion = '1.0.0'
        await compiler.checkCompatibility()
      } catch (e) {
        e.message.indexOf('Unsupported compiler version 1.0.0').should.not.be.equal(-1)
      }
    })
    it('compile', async () => {
      bytecode = await contract.compileContractAPI(identityContract)
      const prefix = bytecode.slice(0, 2)
      const isString = typeof bytecode === 'string'
      prefix.should.be.equal('cb')
      isString.should.be.equal(true)
    })
    it('Get FATE assembler', async () => {
      const result = await contract.getFateAssembler(bytecode)
      result.should.be.a('object')
      const assembler = result['fate-assembler']
      assembler.should.be.a('string')
    })
    it('Get compiler version from bytecode', async () => {
      const version = await contract.getBytecodeCompilerVersion(bytecode)
      console.log(version)
    })
    it('get contract ACI', async () => {
      const aci = await contract.contractGetACI(identityContract)
      aci.should.have.property('interface')
    })
    it('encode call-data', async () => {
      callData = await contract.contractEncodeCallDataAPI(identityContract, 'init', [])
      const prefix = callData.slice(0, 2)
      const isString = typeof callData === 'string'
      prefix.should.be.equal('cb')
      isString.should.be.equal(true)
    })
    it('decode call result', async () => {
      return contract.contractDecodeCallResultAPI(identityContract, 'main', encodedNumberSix, 'ok', { backend: 'fate' }).should.eventually.become(6)
    })
    it('Decode call-data using source', async () => {
      const decodedCallData = await contract.contractDecodeCallDataBySourceAPI(identityContract, 'init', callData)
      decodedCallData.arguments.should.be.an('array')
      decodedCallData.arguments.length.should.be.equal(0)
      decodedCallData.function.should.be.equal('init')
    })
    it('Decode call-data using bytecode', async () => {
      const decodedCallData = await contract.contractDecodeCallDataByCodeAPI(bytecode, callData)
      decodedCallData.arguments.should.be.an('array')
      decodedCallData.arguments.length.should.be.equal(0)
      decodedCallData.function.should.be.equal('init')
    })
    it('Decode data API', async () => {
      const returnData = 'cb_bzvA9Af6'
      return contract.contractDecodeDataAPI('string', returnData).catch(e => 1).should.eventually.become(1)
    })
    it('validate bytecode', async () => {
      return contract.validateByteCodeAPI(bytecode, identityContract).should.eventually.become(true)
    })
    it('Use invalid compiler url', async () => {
      try {
        const cloned = R.clone(contract)
        await cloned.setCompilerUrl('https://compiler.aepps.comas')
      } catch (e) {
        e.message.should.be.equal('Compiler do not respond')
      }
    })
  })

  describe('Contract ACI Interface', function () {
    let contractObject

    it('Generate ACI object', async () => {
      contractObject = await contract.getContractInstance(testContract, { filesystem, opt: { ttl: 0 } })
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
    })
    it('Dry-run deploy fn on specific account', async () => {
      const current = await contract.address()
      const onAccount = contract.addresses().find(acc => acc !== current)
      const { result } = await contractObject.methods.init.get('123', 1, 'hahahaha', { onAccount })
      result.should.have.property('gasUsed')
      result.should.have.property('returnType')
      result.callerId.should.be.equal(onAccount)
    })
    it('Can deploy/call using AEVM', async () => {
      await contractObject.compile({ backend: 'aevm' })
      const deployStatic = await contractObject.methods.init.get('123', 1, 'hahahaha', { backend: 'aevm' })
      deployStatic.should.be.an('object')
      deployed = await contractObject.methods.init.send('123', 1, 'hahahaha', { backend: 'aevm' })
      deployed.should.be.an('object')
      const { result } = await contractObject.methods.intFn(123, { backend: 'aevm' })
      result.should.have.property('gasUsed')
      result.should.have.property('returnType')
      await contractObject.compile()
    })
    it('Deploy contract before compile', async () => {
      contractObject.compiled = null
      await contractObject.methods.init('123', 1, 'hahahaha')
      const isCompiled = contractObject.compiled.length && contractObject.compiled.slice(0, 3) === 'cb_'
      isCompiled.should.be.equal(true)
    })
    it('Deploy/Call contract with { waitMined: false }', async () => {
      const deployed = await contractObject.methods.init('123', 1, 'hahahaha', { waitMined: false })
      await contract.poll(deployed.transaction)
      Boolean(deployed.result === undefined).should.be.equal(true)
      Boolean(deployed.txData === undefined).should.be.equal(true)
      const result = await contractObject.methods.intFn.send(2, { waitMined: false })
      Boolean(result.result === undefined).should.be.equal(true)
      Boolean(result.txData === undefined).should.be.equal(true)
      await contract.poll(result.hash)
    })
    it('Generate ACI object with corresponding bytecode', async () => {
      await contract.getContractInstance(testContract, { contractAddress: contractObject.deployInfo.address, filesystem, opt: { ttl: 0 } })
    })
    it('Generate ACI object with not corresponding bytecode', async () => {
      try {
        await contract.getContractInstance(identityContract, { contractAddress: contractObject.deployInfo.address, opt: { ttl: 0 } })
      } catch (e) {
        e.message.should.be.equal('Contract source do not correspond to the contract bytecode deployed on the chain')
      }
    })
    it('Generate ACI object with not corresponding bytecode and force this check', async () => {
      await contract.getContractInstance(identityContract, { forceCodeCheck: true, contractAddress: contractObject.deployInfo.address, opt: { ttl: 0 } })
    })
    it('Throw error on creating contract instance with invalid contractAddress', async () => {
      try {
        await contract.getContractInstance(testContract, { filesystem, contractAddress: 'ct_asdasdasd', opt: { ttl: 0 } })
      } catch (e) {
        e.message.should.be.equal('Invalid contract address')
      }
    })
    it('Throw error on creating contract instance with contract address which is not found on-chain or not active', async () => {
      const contractAddress = 'ct_ptREMvyDbSh1d38t4WgYgac5oLsa2v9xwYFnG7eUWR8Er5cmT'
      try {
        await contract.getContractInstance(testContract, { filesystem, contractAddress, opt: { ttl: 0 } })
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
      const contractBalance = await contract.balance(contractObject.deployInfo.address)
      await contractObject.methods.stringFn.send('1', { amount: 100 })
      const balanceAfter = await contract.balance(contractObject.deployInfo.address)
      balanceAfter.should.be.equal(`${+contractBalance + 100}`)
    })
    it('Call contract on specific account', async () => {
      const current = await contract.address()
      const onAccount = contract.addresses().find(acc => acc !== current)
      const { result } = await contractObject.methods.intFn('123', { onAccount })
      result.callerId.should.be.equal(onAccount)
    })
    describe('Arguments Validation and Casting', function () {
      describe('INT', function () {
        it('Invalid', async () => {
          try {
            await contractObject.methods.intFn('asd')
          } catch (e) {
            e.message.should.be.equal('"Argument" at position 0 fails because [Value "[asd]" at path: [0] not a number]')
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
            e.message.should.be.equal('"Argument" at position 0 fails because [Value "[[object Object]]" at path: [0] not a boolean]')
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
            e.message.should.be.equal('"Argument" at position 0 fails because [Value "123" at path: [0] not a string]')
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
            e.message.should.be.equal('"Argument" at position 0 fails because ["[asdasasd]" with value "asdasasd" fails to match the required pattern: /^(ak_|ct_|ok_|oq_)/]')
          }
        })
        it('Invalid address type', async () => {
          try {
            await contractObject.methods.addressFn(333)
          } catch (e) {
            e.message.should.be.equal('"Argument" at position 0 fails because [Value "333" at path: [0] not a string]')
          }
        })
        it('Return address', async () => {
          const { decodedResult } = await contractObject.methods.accountAddress(await contract.address())
          decodedResult.should.be.equal(await contract.address())
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
            e.message.should.be.equal('"Argument" at position 0 fails because [Value "[asdasasd]" at path: [0] not a array]')
          }
        })
        it('Invalid tuple prop type', async () => {
          try {
            await contractObject.methods.tupleFn([1, 'string'])
          } catch (e) {
            e.message.should.be.equal('"Argument" at position 0 fails because ["[1,string]" at position 0 fails because [Value "1" at path: [0,0] not a string], "[1,string]" at position 1 fails because [Value "1" at path: [0,1] not a number]]')
          }
        })
        it('Required tuple prop', async () => {
          try {
            await contractObject.methods.tupleFn([1])
          } catch (e) {
            e.message.should.be.equal('"Argument" at position 0 fails because ["[1]" at position 0 fails because [Value "1" at path: [0,0] not a string], "[1]" does not contain 1 required value(s)]')
          }
        })
        it('Wrong type in list inside tuple', async () => {
          try {
            await contractObject.methods.tupleWithList([[true], 1])
          } catch (e) {
            e.message.should.be.equal('"Argument" at position 0 fails because ["[true,1]" at position 0 fails because ["0" at position 0 fails because [Value "0" at path: [0,0,0] not a number]]]')
          }
        })
        it('Wrong type in tuple inside tuple', async () => {
          try {
            await contractObject.methods.tupleInTupleFn([['str', 1], 1])
          } catch (e) {
            e.message.should.be.equal('"Argument" at position 0 fails because ["[str,1,1]" at position 0 fails because ["Tuple argument" at position 1 fails because [Value "1" at path: [0,0,1] not a string]]]')
          }
        })
        it('Valid', async () => {
          const { decodedResult } = await contractObject.methods.tupleFn(['test', 1])
          JSON.stringify(decodedResult).should.be.equal(JSON.stringify(['test', 1]))
        })
      })
      describe('LIST', function () {
        it('Invalid type', async () => {
          try {
            await contractObject.methods.listFn('asdasasd')
          } catch (e) {
            e.message.should.be.equal('"Argument" at position 0 fails because [Value "[asdasasd]" at path: [0] not a array]')
          }
        })
        it('Invalid list element type', async () => {
          try {
            await contractObject.methods.listFn([1, 'string'])
          } catch (e) {
            e.message.should.be.equal('"Argument" at position 0 fails because ["[1,string]" at position 1 fails because [Value "1" at path: [0,1] not a number]]')
          }
        })
        it('Invalid list element type nested', async () => {
          try {
            await contractObject.methods.listInListFn([['childListWronmgElement'], 'parentListWrongElement'])
          } catch (e) {
            e.message.should.be.equal('"Argument" at position 0 fails because ["[childListWronmgElement,parentListWrongElement]" at position 0 fails because ["0" at position 0 fails because [Value "0" at path: [0,0,0] not a number]], "[childListWronmgElement,parentListWrongElement]" at position 1 fails because [Value "1" at path: [0,1] not a array]]')
          }
        })
        it('Valid', async () => {
          const { decodedResult } = await contractObject.methods.listInListFn([[1, 2], [3, 4]])
          JSON.stringify(decodedResult).should.be.equal(JSON.stringify([[1, 2], [3, 4]]))
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
          const objectFromMap = Array.from(mapArg.entries()).reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {})
          const { decodedResult } = await contractObject.methods.mapFn(objectFromMap)
          JSON.stringify(decodedResult).should.be.equal(JSON.stringify(Array.from(mapArg.entries())))
        })
        it('Map With Option Value', async () => {
          const address = await contract.address()
          const mapArgWithSomeValue = new Map(
            [
              [address, ['someStringV', 123]]
            ]
          )
          const mapArgWithNoneValue = new Map(
            [
              [address, ['someStringV', undefined]]
            ]
          )
          const returnArgWithSomeValue = new Map(
            [
              [address, ['someStringV', 123]]
            ]
          )
          const returnArgWithNoneValue = new Map(
            [
              [address, ['someStringV', undefined]]
            ]
          )
          const resultWithSome = await contractObject.methods.mapOptionFn(mapArgWithSomeValue)
          const resultWithNone = await contractObject.methods.mapOptionFn(mapArgWithNoneValue)

          const decodedSome = resultWithSome.decodedResult

          JSON.stringify(decodedSome).should.be.equal(JSON.stringify(Array.from(returnArgWithSomeValue.entries())))
          JSON.stringify(resultWithNone.decodedResult).should.be.equal(JSON.stringify(Array.from(returnArgWithNoneValue.entries())))
        })
        it('Cast from string to int', async () => {
          const address = await contract.address()
          const mapArg = new Map(
            [
              [address, ['someStringV', '324']]
            ]
          )
          const result = await contractObject.methods.mapFn(mapArg)
          mapArg.set(address, ['someStringV', 324])
          JSON.stringify(result.decodedResult).should.be.equal(JSON.stringify(Array.from(mapArg.entries())))
        })
        it('Cast from array to map', async () => {
          const address = await contract.address()
          const mapArg =
            [
              [address, ['someStringV', 324]]
            ]
          const { decodedResult } = await contractObject.methods.mapFn(mapArg)
          JSON.stringify(decodedResult).should.be.equal(JSON.stringify(mapArg))
        })
      })
      describe('RECORD/STATE', function () {
        const objEq = (obj, obj2) => !Object.entries(obj).find(([key, val]) => JSON.stringify(obj2[key]) !== JSON.stringify(val))
        it('Valid Set Record (Cast from JS object)', async () => {
          await contractObject.methods.setRecord({ value: 'qwe', key: 1234, testOption: 'test' })
          const state = await contractObject.methods.getRecord()

          objEq(state.decodedResult, { value: 'qwe', key: 1234, testOption: 'test' }).should.be.equal(true)
        })
        it('Get Record(Convert to JS object)', async () => {
          const result = await contractObject.methods.getRecord()
          objEq(result.decodedResult, { value: 'qwe', key: 1234, testOption: 'test' }).should.be.equal(true)
        })
        it('Get Record With Option (Convert to JS object)', async () => {
          await contractObject.methods.setRecord({ key: 1234, value: 'qwe', testOption: 'resolved string' })
          const result = await contractObject.methods.getRecord()
          objEq(result.decodedResult, { value: 'qwe', key: 1234, testOption: 'resolved string' }).should.be.equal(true)
        })
        it('Invalid value type', async () => {
          try {
            await contractObject.methods.setRecord({ value: 123, key: 'test' })
          } catch (e) {
            e.message.should.be.equal('"Argument" at position 0 fails because [child "value" fails because [Value "123" at path: [0,value] not a string], child "key" fails because [Value "key" at path: [0,key] not a number]]')
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

          JSON.stringify(optionRes.decodedResult).should.be.equal(JSON.stringify([[1, 'testString']]))
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
            e.message.should.be.equal('"Argument" at position 0 fails because [Value "[string]" at path: [0] not a number]')
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
            e.message.should.be.equal('"Argument" at position 0 fails because ["0" must be a string, "value" must contain at least one of [Year, Month, Day]]')
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
            e.message.should.be.equal('"Argument" at position 0 fails because ["0" must be one of [Year, Month, Day], "0" must be an object]')
          }
        })
        it('Valid', async () => {
          const res = await contractObject.methods.datTypeFn('Year')
          JSON.stringify(res.decodedResult).should.be.equal('"Year"')
        })
      })
      describe('Hash', function () {
        it('Invalid type', async () => {
          try {
            await contractObject.methods.hashFn({})
          } catch (e) {
            e.message.should.be.equal('The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type object')
          }
        })
        it('Invalid length', async () => {
          const address = await contract.address()
          const decoded = Buffer.from(decode(address, 'ak').slice(1))
          try {
            await contractObject.methods.hashFn(decoded)
          } catch (e) {
            const isSizeCheck = e.message.indexOf('not a 32 bytes') !== -1
            isSizeCheck.should.be.equal(true)
          }
        })
        it('Valid', async () => {
          const address = await contract.address()
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
            e.message.should.be.equal('The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type object')
          }
        })
        it('Invalid length', async () => {
          const address = await contract.address()
          const decoded = decode(address, 'ak')
          try {
            await contractObject.methods.signatureFn(decoded)
          } catch (e) {
            const isSizeCheck = e.message.indexOf('not a 64 bytes') !== -1
            isSizeCheck.should.be.equal(true)
          }
        })
        it('Valid', async () => {
          const address = await contract.address()
          const decoded = decode(address, 'ak')
          const fakeSignature = Buffer.from(await contract.sign(decoded))
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
            e.message.should.be.equal('The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type object')
          }
        })
        it('Invalid length', async () => {
          const address = await contract.address()
          const decoded = decode(address, 'ak')
          try {
            await contractObject.methods.bytesFn(Buffer.from([...decoded, 2]))
          } catch (e) {
            const isSizeCheck = e.message.indexOf('not a 32 bytes') !== -1
            isSizeCheck.should.be.equal(true)
          }
        })
        it('Valid', async () => {
          const address = await contract.address()
          const decoded = decode(address, 'ak')
          const hashAsBuffer = await contractObject.methods.bytesFn(decoded)
          const hashAsHex = await contractObject.methods.bytesFn(decoded.toString('hex'))
          hashAsBuffer.decodedResult.should.be.equal(decoded.toString('hex'))
          hashAsHex.decodedResult.should.be.equal(decoded.toString('hex'))
        })
      })
    })
    describe('Call contract', function () {
      it('Call contract using using sophia type arguments', async () => {
        contractObject.setOptions({ skipArgsConvert: true })
        const res = await contractObject.methods.listFn('[ 1, 2 ]')
        contractObject.setOptions({ skipArgsConvert: false })
        return res.decode().should.eventually.become([1, 2])
      })
      it('Call contract using using js type arguments', async () => {
        const res = await contractObject.methods.listFn([1, 2])
        return res.decode().should.eventually.become([1, 2])
      })
      it('Call contract using using js type arguments and skip result transform', async () => {
        contractObject.setOptions({ skipTransformDecoded: true })
        const res = await contractObject.methods.listFn([1, 2])
        const decoded = await res.decode()
        const decodedJSON = JSON.stringify([1, 2])
        contractObject.setOptions({ skipTransformDecoded: false })
        JSON.stringify(decoded).should.be.equal(decodedJSON)
      })
      it('Call contract with contract type argument', async () => {
        const result = await contractObject.methods.approve(0, 'ct_AUUhhVZ9de4SbeRk8ekos4vZJwMJohwW5X8KQjBMUVduUmoUh')
        return result.decode().should.eventually.become(0)
      })
    })
  })
})
