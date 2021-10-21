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
import { commitmentHash, decode } from '../../src/tx/builder/helpers'
import { DRY_RUN_ACCOUNT } from '../../src/tx/builder/schema'
import { messageToHash, salt } from '../../src/utils/crypto'
import { randomName } from '../utils'
import { BaseAe, getSdk, publicKey } from './'

const identityContract = `
contract Identity =
 entrypoint getArg(x : int) = x
`

const contractWithBrokenDeploy = `
contract Foo =
  entrypoint init() = require(false, "CustomErrorMessage")
`

const contractWithBrokenMethods = `
contract Foo =
  payable stateful entrypoint failWithoutMessage(x : address) = Chain.spend(x, 1000000000)

  payable stateful entrypoint failWithMessage() =
    require(false, "CustomErrorMessage")
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
const aensDelegationContract = `
contract DelegateTest =
  // Transactions
  stateful payable entrypoint signedPreclaim(addr  : address,
                                             chash : hash,
                                             sign  : signature) : unit =
    AENS.preclaim(addr, chash, signature = sign)
  stateful entrypoint signedClaim(addr : address,
                                name : string,
                                salt : int,
                                name_fee : int,
                                sign : signature) : unit =
    AENS.claim(addr, name, salt, name_fee, signature = sign)
  stateful entrypoint signedTransfer(owner     : address,
                                   new_owner : address,
                                   name      : string,
                                   sign      : signature) : unit =
    AENS.transfer(owner, new_owner, name, signature = sign)
  stateful entrypoint signedRevoke(owner     : address,
                                   name      : string,
                                   sign      : signature) : unit =
    AENS.revoke(owner, name, signature = sign)`
const oracleContract = `
contract DelegateTest =
  type fee = int
  type ttl = Chain.ttl
  stateful payable entrypoint signedRegisterOracle(acct : address,
                                                   sign : signature,
                                                   qfee : fee,
                                                   ttl  : ttl) : oracle(string, string) =
     Oracle.register(acct, qfee, ttl, signature = sign)
  stateful payable entrypoint signedExtendOracle(o    : oracle(string, string),
                                                 sign : signature,   // Signed oracle address
                                                 ttl  : ttl) : unit =
    Oracle.extend(o, signature = sign, ttl)

  payable stateful entrypoint createQuery(o    : oracle(string, string),
                                          q    : string,
                                          qfee : int,
                                          qttl : Chain.ttl,
                                          rttl : Chain.ttl) : oracle_query(string, string) =
    require(qfee =< Call.value, "insufficient value for qfee")
    require(Oracle.check(o), "oracle not valid")
    Oracle.query(o, q, qfee, qttl, rttl)

  entrypoint queryFee(o : oracle(string, int)) : int =
    Oracle.query_fee(o)

  stateful entrypoint respond(o    : oracle(string, string),
                              q    : oracle_query(string, string),
                              sign : signature,        // Signed oracle query id + contract address
                              r    : string) =
    Oracle.respond(o, q, signature = sign, r)`
const encodedNumberSix = 'cb_DA6sWJo='
const signSource = `
contract Sign =
  entrypoint verify (msg: hash, pub: address, sig: signature): bool =
    Crypto.verify_sig(msg, pub, sig)
`

describe('Contract', function () {
  let sdk
  let bytecode
  let deployed

  before(async function () {
    sdk = await getSdk()
  })

  describe('Aens and Oracle operation delegation', () => {
    let cInstance
    let cInstanceOracle

    before(async () => {
      cInstance = await sdk.getContractInstance(aensDelegationContract)
      cInstanceOracle = await sdk.getContractInstance(oracleContract)
      await cInstance.deploy()
      await cInstanceOracle.deploy()
    })

    it('Delegate AENS operations', async () => {
      const name = randomName(15)
      const contractId = cInstance.deployInfo.address
      const nameFee = 20 * (10 ** 18) // 20 AE
      const currentOwner = await sdk.address()

      // preclaim
      const _salt = salt()
      const commitmentId = commitmentHash(name, _salt)
      // TODO: provide more convenient way to create the decoded commitmentId ?
      const commitmentIdDecoded = decode(commitmentId, 'cm')
      const preclaimSig = await sdk.createAensDelegationSignature({ contractId }, { onAccount: currentOwner })
      const preclaim = await cInstance.methods.signedPreclaim(await sdk.address(), commitmentIdDecoded, preclaimSig)
      preclaim.result.returnType.should.be.equal('ok')
      await sdk.awaitHeight((await sdk.height()) + 2)

      // signature for any other name related operations
      const aensDelegationSig = await sdk.createAensDelegationSignature({ contractId, name }, { onAccount: currentOwner })

      // claim
      const claim = await cInstance.methods.signedClaim(await sdk.address(), name, _salt, nameFee, aensDelegationSig)
      claim.result.returnType.should.be.equal('ok')
      await sdk.awaitHeight((await sdk.height()) + 2)

      // transfer
      const newOwner = sdk.addresses().find(acc => acc !== currentOwner)
      const transfer = await cInstance.methods.signedTransfer(await sdk.address(), newOwner, name, aensDelegationSig)
      transfer.result.returnType.should.be.equal('ok')
      await sdk.awaitHeight((await sdk.height()) + 2)

      // revoke
      const revokeSig = await sdk.createAensDelegationSignature({ contractId, name }, { onAccount: newOwner })
      const revoke = await cInstance.methods.signedRevoke(newOwner, name, revokeSig)
      revoke.result.returnType.should.be.equal('ok')

      await expect(sdk.aensQuery(name)).to.be.rejectedWith(Error)
    })

    it('Delegate Oracle operations', async () => {
      const contractId = cInstanceOracle.deployInfo.address
      const current = await sdk.address()
      const onAccount = sdk.addresses().find(acc => acc !== current)
      const qFee = 500000
      const ttl = { variant: 'RelativeTTL', values: [50] }
      const oracleId = `ok_${onAccount.slice(3)}`

      const oracleDelegationSig = await sdk.createOracleDelegationSignature({ contractId }, { onAccount })

      // register Oracle
      const oracleRegister = await cInstanceOracle.methods.signedRegisterOracle(onAccount, oracleDelegationSig, qFee, ttl, { onAccount })
      oracleRegister.result.returnType.should.be.equal('ok')
      const oracle = await sdk.getOracleObject(oracleId)
      oracle.id.should.be.equal(oracleId)

      // extend oracle
      const queryExtend = await cInstanceOracle.methods.signedExtendOracle(oracleId, oracleDelegationSig, ttl, { onAccount })
      queryExtend.result.returnType.should.be.equal('ok')
      const oracleExtended = await sdk.getOracleObject(oracleId)
      oracleExtended.ttl.should.be.equal(oracle.ttl + 50)

      // create query
      const q = 'Hello!'
      const newOracle = await sdk.registerOracle('string', 'int', { queryFee: qFee })
      const query = await cInstanceOracle.methods.createQuery(newOracle.id, q, 1000 + qFee, ttl, ttl, { onAccount, amount: 5 * qFee })
      query.should.be.an('object')
      const queryObject = await sdk.getQueryObject(newOracle.id, query.decodedResult)
      queryObject.should.be.an('object')
      queryObject.decodedQuery.should.be.equal(q)
      console.log(queryObject)

      // respond to query
      const r = 'Hi!'
      const queryId = queryObject.id
      const respondSig = await sdk.createOracleDelegationSignature({ contractId, queryId })
      const response = await cInstanceOracle.methods.respond(newOracle.id, queryObject.id, respondSig, r, { onAccount })
      console.log(response)
      const queryObject2 = await sdk.getQueryObject(newOracle.id, queryObject.id)
      console.log(queryObject2)
      queryObject2.decodedResponse.should.be.equal(r)
    })
  })

  it('precompiled bytecode can be deployed', async () => {
    const code = await sdk.contractCompile(identityContract)
    return sdk.contractDeploy(code.bytecode, identityContract).should.eventually.have.property('address')
  })

  it('enforce zero deposit for contract deployment', async () => {
    const { version, consensusProtocolVersion } = sdk.getNodeInfo()
    console.log(`Node => ${version}, consensus => ${consensusProtocolVersion}, compiler => ${sdk.compilerVersion}`)
    const code = await sdk.contractCompile(identityContract)
    var { txData } = await sdk.contractDeploy(code.bytecode, identityContract, [], { deposit: 10 })
    return txData.tx.deposit.should.be.equal(0)
  })

  it('Verify message in Sophia', async () => {
    const msgHash = messageToHash('Hello')
    const signature = await sdk.sign(msgHash)
    const signContract = await sdk.getContractInstance(signSource)
    await signContract.deploy()
    const { decodedResult } = await signContract.methods.verify(msgHash, await sdk.address(), signature)
    decodedResult.should.be.equal(true)
  })

  it('compiles Sophia code', async () => {
    bytecode = await sdk.contractCompile(identityContract)
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

  it('Deploy and call contract on specific account', async () => {
    const current = await sdk.address()
    const onAccount = sdk.addresses().find(acc => acc !== current)

    const deployed = await bytecode.deploy([], { onAccount })
    deployed.result.callerId.should.be.equal(onAccount)
    const callRes = await deployed.call('getArg', [42])
    callRes.result.callerId.should.be.equal(onAccount)
    const callStaticRes = await deployed.callStatic('getArg', [42])
    callStaticRes.result.callerId.should.be.equal(onAccount)
  })

  it('Call-Static deploy transaction', async () => {
    const compiled = bytecode.bytecode
    const res = await sdk.contractCallStatic(identityContract, null, 'init', [], { bytecode: compiled })
    res.result.should.have.property('gasUsed')
    res.result.should.have.property('returnType')
  })

  it('Call-Static deploy transaction on specific hash', async () => {
    const { hash } = await sdk.topBlock()
    const compiled = bytecode.bytecode
    const res = await sdk.contractCallStatic(identityContract, null, 'init', [], { bytecode: compiled, top: hash })
    res.result.should.have.property('gasUsed')
    res.result.should.have.property('returnType')
  })

  describe('_handleCallError', () => {
    it('throws error on deploy', async () => {
      const code = await sdk.contractCompile(contractWithBrokenDeploy)
      await expect(code.deploy()).to.be.rejectedWith('Invocation failed: "CustomErrorMessage"')
    })

    it('throws errors on method call', async () => {
      const code = await sdk.contractCompile(contractWithBrokenMethods)
      const deployed = await code.deploy()
      await expect(deployed.call('failWithoutMessage', [await sdk.address()]))
        .to.be.rejectedWith('Invocation failed')
      await expect(deployed.call('failWithMessage'))
        .to.be.rejectedWith('Invocation failed: "CustomErrorMessage"')
    })
  })

  it('Dry-run without accounts', async () => {
    const client = await BaseAe()
    client.removeAccount(publicKey)
    client.addresses().length.should.be.equal(0)
    const address = await client.address().catch(e => false)
    address.should.be.equal(false)
    const { result } = await client.contractCallStatic(identityContract, deployed.address, 'getArg', [42])
    result.callerId.should.be.equal(DRY_RUN_ACCOUNT.pub)
  })

  it('calls deployed contracts', async () => {
    const result = await deployed.call('getArg', [42])
    return result.decode().should.eventually.become(42)
  })

  it('call contract/deploy with waitMined: false', async () => {
    const deployed = await bytecode.deploy([], { waitMined: false })
    await sdk.poll(deployed.transaction, { interval: 50, attempts: 1200 })
    expect(deployed.result).to.be.equal(undefined)
    deployed.txData.should.not.be.equal(undefined)
    const result = await deployed.call('getArg', [42], { waitMined: false })
    expect(result.result).to.be.equal(undefined)
    result.txData.should.not.be.equal(undefined)
    await sdk.poll(result.hash, { interval: 50, attempts: 1200 })
  })

  it('calls deployed contracts static', async () => {
    const result = await deployed.callStatic('getArg', [42])
    return result.decode().should.eventually.become(42)
  })

  it('initializes contract state', async () => {
    const data = '"Hello World!"'
    return sdk.contractCompile(stateContract)
      .then(bytecode => bytecode.deploy([data]))
      .then(deployed => deployed.call('retrieve'))
      .then(result => result.decode())
      .should.eventually.become('Hello World!')
  })

  describe('Namespaces', () => {
    let deployed

    it('Can compiler contract with external deps', async () => {
      const filesystem = {
        testLib: libContract
      }
      const compiled = await sdk.contractCompile(contractWithLib, { filesystem })
      compiled.should.have.property('bytecode')
    })

    it('Throw error when try to compile contract without providing external deps', async () => {
      const error = await sdk.contractCompile(contractWithLib).then(() => null, e => e)
      expect(error.response.text).to.contain('Couldn\'t find include file')
    })

    it('Can deploy contract with external deps', async () => {
      const filesystem = {
        testLib: libContract
      }
      const compiled = await sdk.contractCompile(contractWithLib, { filesystem })
      deployed = await compiled.deploy()
      deployed.should.have.property('address')

      const deployedStatic = await compiled.deployStatic([])
      deployedStatic.result.should.have.property('gasUsed')
      deployedStatic.result.should.have.property('returnType')

      const encodedCallData = await compiled.encodeCall('sumNumbers', ['1', '2'])
      encodedCallData.should.satisfy(s => s.startsWith('cb_'))
    })

    it('Can call contract with external deps', async () => {
      const callResult = await deployed.call('sumNumbers', [1, 2])
      const decoded = await callResult.decode()
      decoded.should.be.equal(3)

      const callStaticResult = await deployed.callStatic('sumNumbers', [1, 2])
      const decoded2 = await callStaticResult.decode()
      decoded2.should.be.equal(3)
    })
  })

  describe('Sophia Compiler', function () {
    let callData
    let bytecode

    it('compile', async () => {
      bytecode = await sdk.compileContractAPI(identityContract)
      const prefix = bytecode.slice(0, 2)
      const isString = typeof bytecode === 'string'
      prefix.should.be.equal('cb')
      isString.should.be.equal(true)
    })

    it('throws clear exception if compile broken contract', async () => {
      await expect(sdk.compileContractAPI(
        'contract Foo =\n' +
        '  entrypoint getArg(x : bar) = x\n' +
        '  entrypoint getArg(x : int) = baz\n' +
        '  entrypoint getArg1(x : int) = baz\n'
      )).to.be.rejectedWith(
        'compile error:\n' +
        'type_error:3:3: Duplicate definitions of getArg at\n' +
        '  - line 2, column 3\n' +
        '  - line 3, column 3\n' +
        'type_error:3:32: Unbound variable baz at line 3, column 32\n' +
        'type_error:4:33: Unbound variable baz at line 4, column 33'
      )
    })

    it('Get FATE assembler', async () => {
      const result = await sdk.getFateAssembler(bytecode)
      result.should.be.a('object')
      const assembler = result['fate-assembler']
      assembler.should.be.a('string')
    })

    it('Get compiler version from bytecode', async () => {
      const { version } = await sdk.getBytecodeCompilerVersion(bytecode)
      version.should.be.a('string')
      version.split('.').length.should.be.equal(3)
    })

    it('get contract ACI', async () => {
      const aci = await sdk.contractGetACI(identityContract)
      aci.should.have.property('interface')
    })

    it('throws clear exception if generating ACI with no arguments', async () => {
      await expect(sdk.contractGetACI())
        .to.be.rejectedWith('validation_error in body ({"error":"missing_required_property","data":"code","path":[]})')
    })

    it('encode call-data', async () => {
      callData = await sdk.contractEncodeCallDataAPI(identityContract, 'init', [])
      const prefix = callData.slice(0, 2)
      const isString = typeof callData === 'string'
      prefix.should.be.equal('cb')
      isString.should.be.equal(true)
    })

    it('decode call result', async () => {
      return sdk.contractDecodeCallResultAPI(identityContract, 'getArg', encodedNumberSix, 'ok').should.eventually.become(6)
    })

    it('Decode call-data using source', async () => {
      const decodedCallData = await sdk.contractDecodeCallDataBySourceAPI(identityContract, 'init', callData)
      decodedCallData.arguments.should.be.an('array')
      decodedCallData.arguments.length.should.be.equal(0)
      decodedCallData.function.should.be.equal('init')
    })

    it('Decode call-data using bytecode', async () => {
      const decodedCallData = await sdk.contractDecodeCallDataByCodeAPI(bytecode, callData)
      decodedCallData.arguments.should.be.an('array')
      decodedCallData.arguments.length.should.be.equal(0)
      decodedCallData.function.should.be.equal('init')
    })

    it('validate bytecode', async () => {
      return sdk.validateByteCodeAPI(bytecode, identityContract).should.eventually.become(true)
    })

    it('Use invalid compiler url', async () => {
      const cloned = R.clone(sdk)
      await expect(cloned.setCompilerUrl('https://compiler.aepps.comas'))
        .to.be.rejectedWith('request to https://compiler.aepps.comas/api failed, reason: getaddrinfo ENOTFOUND compiler.aepps.comas')
    })
  })
})
