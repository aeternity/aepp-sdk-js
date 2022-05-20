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
import { randomName } from '../utils'
import { BaseAe, getSdk, publicKey, compilerUrl } from './'
import {
  IllegalArgumentError, NodeInvocationError, MemoryAccount, generateKeyPair,
  commitmentHash, decode, encode, DRY_RUN_ACCOUNT, messageToHash, salt
} from '../../src'

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
contract ContractWithLib =
  entrypoint sumNumbers(x: int, y: int) : int = TestLib.sum(x, y)
`
const aensDelegationContract = `
contract DelegateTest =
  entrypoint getName(name: string): option(AENS.name) =
    AENS.lookup(name)
  stateful payable entrypoint signedPreclaim(addr: address, chash: hash, sign: signature): unit =
    AENS.preclaim(addr, chash, signature = sign)
  stateful entrypoint signedClaim(
    addr: address, name: string, salt: int, name_fee: int, sign: signature): unit =
    AENS.claim(addr, name, salt, name_fee, signature = sign)
  stateful entrypoint signedTransfer(
    owner: address, new_owner: address, name: string, sign: signature): unit =
    AENS.transfer(owner, new_owner, name, signature = sign)
  stateful entrypoint signedRevoke(owner: address, name: string, sign: signature): unit =
    AENS.revoke(owner, name, signature = sign)
  stateful entrypoint signedUpdate(
    owner: address, name: string, key: string, pt: AENS.pointee, sig: signature) =
    switch(AENS.lookup(name))
      None => ()
      Some(AENS.Name(_, _, ptrs)) =>
        AENS.update(owner, name, None, None, Some(ptrs{[key] = pt}), signature = sig)`
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
const signSource = `
contract Sign =
  entrypoint verify (msg: hash, pub: address, sig: signature): bool =
    Crypto.verify_sig(msg, pub, sig)
`

describe('Contract', function () {
  let aeSdk
  let bytecode
  let contract
  let deployed

  before(async function () {
    aeSdk = await getSdk()
    // TODO: option of getSdk to have accounts without genesis
    aeSdk.removeAccount(aeSdk.addresses()[1])
    await aeSdk.addAccount(MemoryAccount({ keypair: generateKeyPair() }))
    await aeSdk.spend(1e18, aeSdk.addresses()[1])
  })

  it('compiles Sophia code', async () => {
    bytecode = (await aeSdk.contractCompiler.compilerApi.compileContract({
      code: identityContract, options: {}
    })).bytecode
    expect(bytecode).to.satisfy(b => b.startsWith('cb_'))
  })

  it('deploys precompiled bytecode', async () => {
    contract = await aeSdk.getContractInstance({ bytecode, source: identityContract })
    expect(await contract.deploy()).to.have.property('address')
  })

  it('throws exception if deploy deposit is not zero', async () => {
    contract.deployInfo = {}
    await expect(contract.deploy([], { deposit: 10 })).to.be.rejectedWith(
      IllegalArgumentError,
      'Contract deposit is not refundable, so it should be equal 0, got 10 instead'
    )
  })

  it('deploys static', async () => {
    const res = await contract.deploy([], { callStatic: true })
    expect(res.result).to.have.property('gasUsed')
    expect(res.result).to.have.property('returnType')
  })

  it('Verify message in Sophia', async () => {
    const msgHash = messageToHash('Hello')
    const signature = await aeSdk.sign(msgHash)
    const signContract = await aeSdk.getContractInstance({ source: signSource })
    await signContract.deploy()
    const { decodedResult } = await signContract.methods
      .verify(msgHash, await aeSdk.address(), signature)
    decodedResult.should.be.equal(true)
  })

  it('Deploy and call contract on specific account', async () => {
    contract.deployInfo = {}
    const onAccount = aeSdk.addresses()[1]
    contract.options.onAccount = onAccount
    deployed = await contract.deploy()
    expect(deployed.result.callerId).to.be.equal(onAccount)
    expect((await contract.methods.getArg(42, { callStatic: true })).result.callerId)
      .to.be.equal(onAccount)
    expect((await contract.methods.getArg(42, { callStatic: false })).result.callerId)
      .to.be.equal(onAccount)
    delete contract.options.onAccount
  })

  it('Call-Static deploy transaction', async () => {
    const res = await contract.deploy([], { callStatic: true })
    res.result.should.have.property('gasUsed')
    res.result.should.have.property('returnType')
  })

  it('Call-Static deploy transaction on specific hash', async () => {
    const { hash } = await aeSdk.api.getTopHeader()
    const res = await contract.deploy([], { callStatic: true, top: hash })
    res.result.should.have.property('gasUsed')
    res.result.should.have.property('returnType')
  })

  it('throws error on deploy', async () => {
    const contract = await aeSdk.getContractInstance({ source: contractWithBrokenDeploy })
    await expect(contract.deploy()).to.be.rejectedWith(NodeInvocationError, 'Invocation failed: "CustomErrorMessage"')
  })

  it('throws errors on method call', async () => {
    const contract = await aeSdk.getContractInstance({ source: contractWithBrokenMethods })
    await contract.deploy()
    await expect(contract.methods.failWithoutMessage(await aeSdk.address()))
      .to.be.rejectedWith('Invocation failed')
    await expect(contract.methods.failWithMessage())
      .to.be.rejectedWith('Invocation failed: "CustomErrorMessage"')
  })

  it('Dry-run without accounts', async () => {
    const aeSdk = await BaseAe()
    aeSdk.removeAccount(publicKey)
    aeSdk.addresses().length.should.be.equal(0)
    const address = await aeSdk.address().catch(() => false)
    address.should.be.equal(false)
    const contract = await aeSdk.getContractInstance({
      source: identityContract, contractAddress: deployed.address
    })
    const { result } = await contract.methods.getArg(42)
    result.callerId.should.be.equal(DRY_RUN_ACCOUNT.pub)
  })

  it('call contract/deploy with waitMined: false', async () => {
    contract.deployInfo = {}
    const deployed = await contract.deploy([], { waitMined: false })
    await aeSdk.poll(deployed.transaction)
    expect(deployed.result).to.be.equal(undefined)
    deployed.txData.should.not.be.equal(undefined)
    const result = await contract.methods.getArg(42, { callStatic: false, waitMined: false })
    expect(result.result).to.be.equal(undefined)
    result.txData.should.not.be.equal(undefined)
    await aeSdk.poll(result.hash)
  })

  it('calls deployed contracts static', async () => {
    const result = await contract.methods.getArg(42, { callStatic: true })
    expect(result.decodedResult).to.be.equal(42n)
  })

  it('initializes contract state', async () => {
    const contract = await aeSdk.getContractInstance({ source: stateContract })
    const data = 'Hello World!'
    await contract.deploy([data])
    expect((await contract.methods.retrieve()).decodedResult).to.be.equal(data)
  })

  describe('Namespaces', () => {
    let contract

    it('Can compiler contract with external deps', async () => {
      contract = await aeSdk.getContractInstance({
        source: contractWithLib, fileSystem: { testLib: libContract }
      })
      expect(await contract.compile()).to.satisfy(b => b.startsWith('cb_'))
    })

    it('Throw error when try to compile contract without providing external deps', async () => {
      await expect(aeSdk.getContractInstance({ source: contractWithLib, options: {} }))
        .to.be.rejectedWith('Couldn\'t find include file')
    })

    it('Can deploy contract with external deps', async () => {
      const deployInfo = await contract.deploy()
      expect(deployInfo).to.have.property('address')

      const deployedStatic = await contract.deploy([], { callStatic: true })
      expect(deployedStatic.result).to.have.property('gasUsed')
      expect(deployedStatic.result).to.have.property('returnType')
    })

    it('Can call contract with external deps', async () => {
      expect((await contract.methods.sumNumbers(1, 2, { callStatic: false })).decodedResult)
        .to.be.equal(3n)
      expect((await contract.methods.sumNumbers(1, 2, { callStatic: true })).decodedResult)
        .to.be.equal(3n)
    })
  })

  describe('Sophia Compiler', function () {
    let bytecode

    it('compile', async () => {
      bytecode = (await aeSdk.contractCompiler.compilerApi.compileContract({
        code: identityContract, options: {}
      })).bytecode
      expect(bytecode).to.be.a('string')
      expect(bytecode.split('_')[0]).to.be.equal('cb')
    })

    it('throws clear exception if compile broken contract', async () => {
      await expect(aeSdk.contractCompiler.compilerApi.compileContract({
        code:
          'contract Foo =\n' +
          '  entrypoint getArg(x : bar) = x\n' +
          '  entrypoint getArg(x : int) = baz\n' +
          '  entrypoint getArg1(x : int) = baz\n',
        options: {}
      })).to.be.rejectedWith(
        'compile error:\n' +
        'type_error:3:3: Duplicate definitions of getArg at\n' +
        '  - line 2, column 3\n' +
        '  - line 3, column 3\n' +
        'type_error:3:32: Unbound variable baz at line 3, column 32\n' +
        'type_error:4:33: Unbound variable baz at line 4, column 33'
      )
    })

    it('generate contract ACI', async () => {
      const aci = await aeSdk.contractCompiler.compilerApi.generateACI(
        { code: identityContract, options: {} })
      expect(aci).to.have.property('encodedAci')
      expect(aci).to.have.property('externalEncodedAci')
      expect(aci).to.have.property('interface')
    })

    it('throws clear exception if generating ACI with no arguments', async () => {
      await expect(aeSdk.contractCompiler.compilerApi.generateACI({ options: {} }))
        .to.be.rejectedWith('Error "body.code cannot be null or undefined." occurred in serializing the payload - undefined')
    })

    it('validate bytecode', async () => {
      expect(await aeSdk.contractCompiler.compilerApi.validateByteCode({
        bytecode, source: identityContract, options: {}
      })).to.be.eql({ body: {} })
    })

    it('Use invalid compiler url', async () => {
      aeSdk.contractCompiler.setCompilerUrl('https://compiler.aepps.comas')
      await expect(aeSdk.contractCompiler.compilerApi.generateACI({ code: 'test' }))
        .to.be.rejectedWith('getaddrinfo ENOTFOUND compiler.aepps.comas')
      aeSdk.contractCompiler.setCompilerUrl(compilerUrl)
    })
  })

  describe('AENS operation delegation', () => {
    let contract
    let contractId
    const name = randomName(15)
    const nameSalt = salt()
    let owner
    let newOwner
    let delegationSignature

    before(async () => {
      contract = await aeSdk.getContractInstance({ source: aensDelegationContract })
      await contract.deploy()
      contractId = contract.deployInfo.address;
      [owner, newOwner] = aeSdk.addresses()
    })

    it('preclaims', async () => {
      const commitmentId = commitmentHash(name, nameSalt)
      // TODO: provide more convenient way to create the decoded commitmentId ?
      const commitmentIdDecoded = decode(commitmentId, 'cm')
      const preclaimSig = await aeSdk.createAensDelegationSignature({ contractId })
      const preclaim = await contract.methods
        .signedPreclaim(owner, commitmentIdDecoded, preclaimSig)
      preclaim.result.returnType.should.be.equal('ok')
      await aeSdk.awaitHeight(2 + await aeSdk.height())
      // signature for any other name related operations
      delegationSignature = await aeSdk.createAensDelegationSignature({ contractId, name })
    })

    it('claims', async () => {
      const nameFee = 20e18 // 20 AE
      const claim = await contract.methods.signedClaim(
        owner, name, nameSalt, nameFee, delegationSignature
      )
      claim.result.returnType.should.be.equal('ok')
    })

    it('gets', async () => {
      const nameEntry = (await contract.methods.getName(name)).decodedResult['AENS.Name']
      expect(nameEntry[0]).to.be.equal(owner)
      expect(nameEntry[1].FixedTTL[0]).to.be.a('bigint')
      expect(nameEntry[2]).to.be.eql(new Map())
    })

    it('updates', async () => {
      const pointee = { 'AENS.OraclePt': [newOwner] }
      const update = await contract.methods.signedUpdate(
        owner, name, 'oracle', pointee, delegationSignature
      )
      expect(update.result.returnType).to.be.equal('ok')
      expect((await aeSdk.aensQuery(name)).pointers).to.be.eql([{
        key: 'oracle',
        id: newOwner.replace('ak', 'ok')
      }])
    })

    it('transfers', async () => {
      const transfer = await contract.methods.signedTransfer(
        owner, newOwner, name, delegationSignature
      )
      transfer.result.returnType.should.be.equal('ok')
    })

    it('revokes', async () => {
      const revokeSig = await aeSdk.createAensDelegationSignature(
        { contractId, name }, { onAccount: newOwner }
      )
      const revoke = await contract.methods.signedRevoke(newOwner, name, revokeSig)
      revoke.result.returnType.should.be.equal('ok')
      await expect(aeSdk.aensQuery(name)).to.be.rejectedWith(Error)
    })
  })

  describe('Oracle operation delegation', () => {
    let contract
    let contractId
    let address
    let oracle
    let oracleId
    let queryObject
    let delegationSignature
    const queryFee = 500000
    const ttl = { RelativeTTL: [50] }

    before(async () => {
      contract = await aeSdk.getContractInstance({ source: oracleContract })
      await contract.deploy()
      contractId = contract.deployInfo.address
      address = await aeSdk.address()
      oracleId = encode(decode(address), 'ok')
    })

    it('registers', async () => {
      delegationSignature = await aeSdk.createOracleDelegationSignature({ contractId })
      const oracleRegister = await contract.methods.signedRegisterOracle(
        address, delegationSignature, queryFee, ttl
      )
      oracleRegister.result.returnType.should.be.equal('ok')
      oracle = await aeSdk.getOracleObject(oracleId)
      oracle.id.should.be.equal(oracleId)
    })

    it('extends', async () => {
      const queryExtend = await contract.methods.signedExtendOracle(
        oracleId, delegationSignature, ttl
      )
      queryExtend.result.returnType.should.be.equal('ok')
      const oracleExtended = await aeSdk.getOracleObject(oracleId)
      oracleExtended.ttl.should.be.equal(oracle.ttl + 50)
    })

    it('creates query', async () => {
      const q = 'Hello!'
      // TODO: don't register an extra oracle after fixing https://github.com/aeternity/aepp-sdk-js/issues/1419
      oracle = await aeSdk.registerOracle('string', 'int', { queryFee, onAccount: aeSdk.addresses()[1] })
      const query = await contract.methods.createQuery(
        oracle.id, q, 1000 + queryFee, ttl, ttl, { amount: 5 * queryFee }
      )
      query.result.returnType.should.be.equal('ok')
      queryObject = await aeSdk.getQueryObject(oracle.id, query.decodedResult)
      queryObject.should.be.an('object')
      queryObject.decodedQuery.should.be.equal(q)
    })

    it('responds to query', async () => {
      const r = 'Hi!'
      const queryId = queryObject.id
      aeSdk.selectAccount(aeSdk.addresses()[1])
      const respondSig = await aeSdk.createOracleDelegationSignature({ contractId, queryId })
      const response = await contract.methods.respond(
        oracle.id, queryObject.id, respondSig, r
      )
      response.result.returnType.should.be.equal('ok')
      const queryObject2 = await aeSdk.getQueryObject(oracle.id, queryObject.id)
      queryObject2.decodedResponse.should.be.equal(r)
    })
  })
})
