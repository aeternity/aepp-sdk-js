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
import { commitmentHash, decode } from '../../src/tx/builder/helpers'
import { DRY_RUN_ACCOUNT } from '../../src/tx/builder/schema'
import { messageToHash, salt } from '../../src/utils/crypto'
import { randomName } from '../utils'
import { BaseAe, getSdk, publicKey } from './'
import { Crypto, MemoryAccount } from '../../src'
import { NodeInvocationError } from '../../src/utils/errors'

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
  let sdk
  let bytecode
  let deployed

  before(async function () {
    sdk = await getSdk()
    sdk.removeAccount(sdk.addresses()[1]) // TODO: option of getSdk to have accounts without genesis
    await sdk.addAccount(MemoryAccount({ keypair: Crypto.generateKeyPair() }))
    await sdk.spend(1e18, sdk.addresses()[1])
  })

  it('precompiled bytecode can be deployed', async () => {
    const code = await sdk.contractCompile(identityContract)
    return sdk.contractDeploy(code.bytecode, identityContract)
      .should.eventually.have.property('address')
  })

  it('enforce zero deposit for contract deployment', async () => {
    const code = await sdk.contractCompile(identityContract)
    const { txData } = await sdk.contractDeploy(
      code.bytecode, identityContract, [], { deposit: 10 }
    )
    return txData.tx.deposit.should.be.equal(0)
  })

  it('Verify message in Sophia', async () => {
    const msgHash = messageToHash('Hello')
    const signature = await sdk.sign(msgHash)
    const signContract = await sdk.getContractInstance({ source: signSource })
    await signContract.deploy()
    const { decodedResult } = await signContract.methods
      .verify(msgHash, await sdk.address(), signature)
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
    const onAccount = sdk.addresses()[1]
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

  it('throws error on deploy', async () => {
    const code = await sdk.contractCompile(contractWithBrokenDeploy)
    await expect(code.deploy()).to.be.rejectedWith(NodeInvocationError, 'Invocation failed: "CustomErrorMessage"')
  })

  it('throws errors on method call', async () => {
    const code = await sdk.contractCompile(contractWithBrokenMethods)
    const deployed = await code.deploy()
    await expect(deployed.call('failWithoutMessage', [await sdk.address()]))
      .to.be.rejectedWith('Invocation failed')
    await expect(deployed.call('failWithMessage'))
      .to.be.rejectedWith('Invocation failed: "CustomErrorMessage"')
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

  it('call contract/deploy with waitMined: false', async () => {
    const deployed = await bytecode.deploy([], { waitMined: false })
    await sdk.poll(deployed.transaction)
    expect(deployed.result).to.be.equal(undefined)
    deployed.txData.should.not.be.equal(undefined)
    const result = await deployed.call('getArg', [42], { waitMined: false })
    expect(result.result).to.be.equal(undefined)
    result.txData.should.not.be.equal(undefined)
    await sdk.poll(result.hash)
  })

  it('calls deployed contracts static', async () => {
    const result = await deployed.callStatic('getArg', [42])
    expect(result.decodedResult).to.be.equal(42n)
  })

  it('initializes contract state', async () => {
    const data = 'Hello World!'
    return sdk.contractCompile(stateContract)
      .then(bytecode => bytecode.deploy([data]))
      .then(deployed => deployed.call('retrieve'))
      .then(result => result.decodedResult)
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
      callResult.decodedResult.should.be.equal(3n)

      const callStaticResult = await deployed.callStatic('sumNumbers', [1, 2])
      callStaticResult.decodedResult.should.be.equal(3n)
    })
  })

  describe('Sophia Compiler', function () {
    let bytecode

    it('compile', async () => {
      bytecode = (await sdk.compilerApi.compileContract({ code: identityContract })).bytecode
      expect(bytecode).to.be.a('string')
      expect(bytecode.split('_')[0]).to.be.equal('cb')
    })

    it('throws clear exception if compile broken contract', async () => {
      await expect(sdk.compilerApi.compileContract({
        code:
          'contract Foo =\n' +
          '  entrypoint getArg(x : bar) = x\n' +
          '  entrypoint getArg(x : int) = baz\n' +
          '  entrypoint getArg1(x : int) = baz\n'
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
      const aci = await sdk.compilerApi.generateACI({ code: identityContract })
      expect(aci).to.have.property('encoded_aci')
      expect(aci).to.have.property('external_encoded_aci')
      expect(aci).to.have.property('interface')
    })

    it('throws clear exception if generating ACI with no arguments', async () => {
      await expect(sdk.compilerApi.generateACI())
        .to.be.rejectedWith('validation_error in body ({"error":"missing_required_property","data":"code","path":[]})')
    })

    it('validate bytecode', async () => {
      expect(await sdk.compilerApi.validateByteCode({ bytecode, source: identityContract }))
        .to.be.eql({})
    })

    it('Use invalid compiler url', async () => {
      await expect(sdk.setCompilerUrl('https://compiler.aepps.comas'))
        .to.be.rejectedWith('request to https://compiler.aepps.comas/api failed, reason: getaddrinfo ENOTFOUND compiler.aepps.comas')
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
      contract = await sdk.getContractInstance({ source: aensDelegationContract })
      await contract.deploy()
      contractId = contract.deployInfo.address;
      [owner, newOwner] = sdk.addresses()
    })

    it('preclaims', async () => {
      const commitmentId = commitmentHash(name, nameSalt)
      // TODO: provide more convenient way to create the decoded commitmentId ?
      const commitmentIdDecoded = decode(commitmentId, 'cm')
      const preclaimSig = await sdk.createAensDelegationSignature(
        { contractId }, { onAccount: owner }
      )
      const preclaim = await contract.methods
        .signedPreclaim(owner, commitmentIdDecoded, preclaimSig)
      preclaim.result.returnType.should.be.equal('ok')
      await sdk.awaitHeight((await sdk.height()) + 2)
      // signature for any other name related operations
      delegationSignature = await sdk.createAensDelegationSignature(
        { contractId, name }, { onAccount: owner }
      )
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
      expect((await sdk.aensQuery(name)).pointers).to.be.eql([{
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
      const revokeSig = await sdk.createAensDelegationSignature(
        { contractId, name }, { onAccount: newOwner }
      )
      const revoke = await contract.methods.signedRevoke(newOwner, name, revokeSig)
      revoke.result.returnType.should.be.equal('ok')
      await expect(sdk.aensQuery(name)).to.be.rejectedWith(Error)
    })
  })

  describe('Oracle operation delegation', () => {
    let contract
    let contractId
    let onAccount
    let oracle
    let oracleId
    let queryObject
    let delegationSignature
    const queryFee = 500000
    const ttl = { RelativeTTL: [50] }

    before(async () => {
      contract = await sdk.getContractInstance({ source: oracleContract })
      await contract.deploy()
      contractId = contract.deployInfo.address
      onAccount = sdk.addresses()[1]
      oracleId = `ok_${onAccount.slice(3)}`
    })

    it('registers', async () => {
      delegationSignature = await sdk.createOracleDelegationSignature(
        { contractId }, { onAccount }
      )
      const oracleRegister = await contract.methods.signedRegisterOracle(
        onAccount, delegationSignature, queryFee, ttl, { onAccount }
      )
      oracleRegister.result.returnType.should.be.equal('ok')
      oracle = await sdk.getOracleObject(oracleId)
      oracle.id.should.be.equal(oracleId)
    })

    it('extends', async () => {
      const queryExtend = await contract.methods.signedExtendOracle(
        oracleId, delegationSignature, ttl, { onAccount }
      )
      queryExtend.result.returnType.should.be.equal('ok')
      const oracleExtended = await sdk.getOracleObject(oracleId)
      oracleExtended.ttl.should.be.equal(oracle.ttl + 50)
    })

    it('creates query', async () => {
      const q = 'Hello!'
      oracle = await sdk.registerOracle('string', 'int', { queryFee })
      const query = await contract.methods.createQuery(
        oracle.id, q, 1000 + queryFee, ttl, ttl, { onAccount, amount: 5 * queryFee }
      )
      query.result.returnType.should.be.equal('ok')
      queryObject = await sdk.getQueryObject(oracle.id, query.decodedResult)
      queryObject.should.be.an('object')
      queryObject.decodedQuery.should.be.equal(q)
    })

    it('responds to query', async () => {
      const r = 'Hi!'
      const queryId = queryObject.id
      const respondSig = await sdk.createOracleDelegationSignature({ contractId, queryId })
      const response = await contract.methods.respond(
        oracle.id, queryObject.id, respondSig, r, { onAccount }
      )
      response.result.returnType.should.be.equal('ok')
      const queryObject2 = await sdk.getQueryObject(oracle.id, queryObject.id)
      queryObject2.decodedResponse.should.be.equal(r)
    })
  })
})
