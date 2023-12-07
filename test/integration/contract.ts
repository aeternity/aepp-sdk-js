import { expect } from 'chai';
import { before, describe, it } from 'mocha';
import {
  assertNotNull, randomName, ChainTtl, InputNumber,
} from '../utils';
import { getSdk } from '.';
import {
  ArgumentError,
  NodeInvocationError,
  commitmentHash,
  decode, encode, Encoded, Encoding,
  DRY_RUN_ACCOUNT,
  messageToHash,
  genSalt,
  UnexpectedTsError,
  AeSdk,
  Contract, ContractMethodsBase, ConsensusProtocolVersion,
} from '../../src';

const identitySourceCode = `
contract Identity =
 entrypoint getArg(x : int) = x
`;

interface IdentityContractApi extends ContractMethodsBase {
  getArg: (x: InputNumber) => bigint;
}

describe('Contract', () => {
  let aeSdk: AeSdk;
  let bytecode: Encoded.ContractBytearray;
  let identityContract: Contract<IdentityContractApi>;
  let deployed: Awaited<ReturnType<Contract<{}>['$deploy']>>;

  before(async () => {
    aeSdk = await getSdk(2);
  });

  it('deploys precompiled bytecode', async () => {
    identityContract = await Contract.initialize({
      ...aeSdk.getContext(), bytecode, sourceCode: identitySourceCode,
    });
    expect(await identityContract.$deploy([])).to.have.property('address');
  });

  it('throws exception if deploy deposit is not zero', async () => {
    delete identityContract.$options.address;
    await expect(identityContract.$deploy([], { deposit: 10 })).to.be.rejectedWith(
      ArgumentError,
      'deposit should be equal 0 (because is not refundable), got 10 instead',
    );
  });

  it('deploys static', async () => {
    const res = await identityContract.$deploy([], { callStatic: true });
    expect(res.result).to.have.property('gasUsed');
    expect(res.result).to.have.property('returnType');
  });

  it('Verify signature of 32 bytes in Sophia', async () => {
    const signContract = await Contract.initialize<{
      verify: (data: Uint8Array, pub: Encoded.AccountAddress, sig: Uint8Array) => boolean;
    }>({
          ...aeSdk.getContext(),
          sourceCode:
            'contract Sign ='
            + '\n  entrypoint verify (data: bytes(32), pub: address, sig: signature): bool ='
            + '\n    Crypto.verify_sig(data, pub, sig)',
        });
    await signContract.$deploy([]);
    const data = Buffer.from(new Array(32).fill(0).map((_, idx) => idx ** 2));
    const signature = await aeSdk.sign(data);
    expect((await signContract.verify(data, aeSdk.address, signature)).decodedResult)
      .to.be.equal(true);
  });

  it('Verify message in Sophia', async () => {
    const signContract = await Contract.initialize<{
      message_to_hash: (message: string) => Uint8Array;
      verify: (message: string, pub: Encoded.AccountAddress, sig: Uint8Array) => boolean;
    }>({
          ...aeSdk.getContext(),
          sourceCode:
            'include "String.aes"'
            + '\n'
            + '\ncontract Sign ='
            + '\n  entrypoint int_to_binary (i: int): string ='
            + '\n    switch(Char.from_int(i))'
            + '\n      None => abort("Int is too big")'
            + '\n      Some(c) => String.from_list([c])'
            + '\n'
            + '\n  entrypoint includes (str: string, pat: string): bool ='
            + '\n    switch(String.contains(str, pat))'
            + '\n      None => false'
            + '\n      Some(_) => true'
            + '\n'
            + '\n  entrypoint message_to_hash (message: string): hash ='
            + '\n    let prefix = "aeternity Signed Message:\\n"'
            + '\n    let prefixBinary = String.concat(int_to_binary(String.length(prefix)), prefix)'
            + '\n    let messageBinary = String.concat(int_to_binary(String.length(message)), message)'
            + '\n    Crypto.blake2b(String.concat(prefixBinary, messageBinary))'
            + '\n'
            + '\n  entrypoint verify (message: string, pub: address, sig: signature): bool ='
            + '\n    require(includes(message, "H"), "Invalid message")'
            + '\n    Crypto.verify_sig(message_to_hash(message), pub, sig)',
        });
    await signContract.$deploy([]);

    await Promise.all(['Hello', 'H'.repeat(127)].map(async (message) => {
      expect((await signContract.message_to_hash(message)).decodedResult)
        .to.be.eql(messageToHash(message));
      const signature = await aeSdk.signMessage(message);
      expect((await signContract.verify(message, aeSdk.address, signature)).decodedResult)
        .to.be.equal(true);
    }));
  });

  it('Deploy and call contract on specific account', async () => {
    delete identityContract.$options.address;
    const onAccount = aeSdk.accounts[aeSdk.addresses()[1]];
    const accountBefore = identityContract.$options.onAccount;
    identityContract.$options.onAccount = onAccount;
    deployed = await identityContract.$deploy([]);
    if (deployed?.result?.callerId == null) throw new UnexpectedTsError();
    expect(deployed.result.callerId).to.be.equal(onAccount.address);
    let { result } = await identityContract.getArg(42, { callStatic: true });
    assertNotNull(result);
    expect(result.callerId).to.be.equal(onAccount.address);
    result = (await identityContract.getArg(42, { callStatic: false })).result;
    assertNotNull(result);
    expect(result.callerId).to.be.equal(onAccount.address);
    identityContract.$options.onAccount = accountBefore;
  });

  it('Call-Static deploy transaction', async () => {
    const { result } = await identityContract.$deploy([], { callStatic: true });
    assertNotNull(result);
    result.should.have.property('gasUsed');
    result.should.have.property('returnType');
  });

  it('Call-Static deploy transaction on specific hash', async () => {
    const hash = (await aeSdk.api.getTopHeader()).hash as Encoded.MicroBlockHash;
    const { result } = await identityContract.$deploy([], { callStatic: true, top: hash });
    assertNotNull(result);
    result.should.have.property('gasUsed');
    result.should.have.property('returnType');
  });

  it('throws error on deploy', async () => {
    const ct = await Contract.initialize({
      ...aeSdk.getContext(),
      sourceCode:
        'contract Foo =\n'
        + '  entrypoint init() = abort("CustomErrorMessage")',
    });
    await expect(ct.$deploy([])).to.be.rejectedWith(NodeInvocationError, 'Invocation failed: "CustomErrorMessage"');
  });

  it('throws errors on method call', async () => {
    const ct = await Contract.initialize<{
      failWithoutMessage: (x: Encoded.AccountAddress) => void;
      failWithMessage: () => void;
    }>({
          ...aeSdk.getContext(),
          sourceCode:
            'contract Foo =\n'
            + '  payable stateful entrypoint failWithoutMessage(x : address) = Chain.spend(x, 1000000000)\n'
            + '  payable stateful entrypoint failWithMessage() =\n'
            + '    abort("CustomErrorMessage")',
        });
    await ct.$deploy([]);
    await expect(ct.failWithoutMessage(aeSdk.address))
      .to.be.rejectedWith('Invocation failed');
    await expect(ct.failWithMessage())
      .to.be.rejectedWith('Invocation failed: "CustomErrorMessage"');
  });

  it('Dry-run without accounts', async () => {
    const sdk = await getSdk(0);
    const contract = await Contract.initialize<IdentityContractApi>({
      ...sdk.getContext(), sourceCode: identitySourceCode, address: deployed.address,
    });
    const { result } = await contract.getArg(42);
    assertNotNull(result);
    result.callerId.should.be.equal(DRY_RUN_ACCOUNT.pub);
  });

  it('Dry-run at specific height', async () => {
    const contract = await Contract.initialize<{ call: () => void }>({
      ...aeSdk.getContext(),
      sourceCode: 'contract Callable =\n'
        + '  record state = { wasCalled: bool }\n'
        + '\n'
        + '  entrypoint init() : state = { wasCalled = false }\n'
        + '\n'
        + '  stateful entrypoint call() =\n'
        + '    require(!state.wasCalled, "Already called")\n'
        + '    put(state{ wasCalled = true })\n',
    });
    await contract.$deploy([]);
    await aeSdk.awaitHeight(await aeSdk.getHeight() + 1);
    const beforeKeyBlockHeight = await aeSdk.getHeight();
    await aeSdk.spend(1, aeSdk.address);
    const topHeader = await aeSdk.api.getTopHeader();
    const beforeKeyBlockHash = topHeader.prevKeyHash as Encoded.KeyBlockHash;
    const beforeMicroBlockHash = topHeader.hash as Encoded.MicroBlockHash;
    expect(beforeKeyBlockHash).to.satisfy((s: string) => s.startsWith('kh_'));
    expect(beforeMicroBlockHash).to.satisfy((s: string) => s.startsWith('mh_'));

    await contract.call();
    await expect(contract.call()).to.be.rejectedWith('Already called');
    await contract.call({ callStatic: true, top: beforeMicroBlockHash });
    await contract.call({ callStatic: true, top: beforeKeyBlockHash });
    await contract.call({ callStatic: true, top: beforeKeyBlockHeight });
  });

  it('call contract/deploy with waitMined: false', async () => {
    delete identityContract.$options.address;
    const deployInfo = await identityContract.$deploy([], { waitMined: false });
    assertNotNull(deployInfo.transaction);
    await aeSdk.poll(deployInfo.transaction);
    expect(deployInfo.result).to.be.equal(undefined);
    deployInfo.txData.should.not.be.equal(undefined);
    const result = await identityContract.getArg(42, { callStatic: false, waitMined: false });
    expect(result.result).to.be.equal(undefined);
    result.txData.should.not.be.equal(undefined);
    await aeSdk.poll(result.hash as Encoded.TxHash);
  });

  it('calls deployed contracts static', async () => {
    const result = await identityContract.getArg(42, { callStatic: true });
    expect(result.decodedResult).to.be.equal(42n);
  });

  it('initializes contract state', async () => {
    const contract = await Contract.initialize<{
      init: (a: string) => void;
      retrieve: () => string;
    }>({
          ...aeSdk.getContext(),
          sourceCode:
            'contract StateContract =\n'
            + '  record state = { value: string }\n'
            + '  entrypoint init(value) : state = { value = value }\n'
            + '  entrypoint retrieve() : string = state.value',
        });
    const data = 'Hello World!';
    await contract.$deploy([data]);
    expect((await contract.retrieve()).decodedResult).to.be.equal(data);
  });

  describe('Namespaces', () => {
    const contractWithLibSourceCode = (
      'include "testLib"\n'
      + 'contract ContractWithLib =\n'
      + '  entrypoint sumNumbers(x: int, y: int) : int = TestLib.sum(x, y)'
    );

    let contract: Contract<{ sumNumbers: (x: number, y: number) => bigint }>;

    it('Can compiler contract with external deps', async () => {
      contract = await Contract.initialize({
        ...aeSdk.getContext(),
        sourceCode: contractWithLibSourceCode,
        fileSystem: {
          testLib:
            'namespace TestLib =\n'
            + '  function sum(x: int, y: int) : int = x + y',
        },
      });
      expect(await contract.$compile()).to.satisfy((b: string) => b.startsWith('cb_'));
    });

    it('Throw error when try to compile contract without providing external deps', async () => {
      await expect(
        Contract.initialize({ ...aeSdk.getContext(), sourceCode: contractWithLibSourceCode }),
      ).to.be.rejectedWith('Couldn\'t find include file');
    });

    it('Can deploy contract with external deps', async () => {
      const deployInfo = await contract.$deploy([]);
      expect(deployInfo).to.have.property('address');

      const deployedStatic = await contract.$deploy([], { callStatic: true });
      expect(deployedStatic.result).to.have.property('gasUsed');
      expect(deployedStatic.result).to.have.property('returnType');
    });

    it('Can call contract with external deps', async () => {
      expect((await contract.sumNumbers(1, 2, { callStatic: false })).decodedResult)
        .to.be.equal(3n);
      expect((await contract.sumNumbers(1, 2, { callStatic: true })).decodedResult)
        .to.be.equal(3n);
    });
  });

  describe('AENS operation delegation', () => {
    const name = randomName(15);
    const salt = genSalt();
    let owner: Encoded.AccountAddress;
    let newOwner: Encoded.AccountAddress;
    let delegationSignature: Uint8Array;
    let contract: Contract<{
      getName: (name: string) => {
        'AENS.Name': [Encoded.AccountAddress, ChainTtl, Map<string, string>];
        'AENSv2.Name': [Encoded.AccountAddress, ChainTtl, Map<string, string>];
      };
      signedPreclaim: (addr: Encoded.AccountAddress, chash: Uint8Array, sign: Uint8Array) => void;
      signedClaim: (
        addr: Encoded.AccountAddress,
        name: string,
        salt: InputNumber,
        name_fee: InputNumber,
        sign: Uint8Array,
      ) => void;
      signedTransfer: (
        owner: Encoded.AccountAddress,
        new_owner: Encoded.AccountAddress,
        name: string,
        sign: Uint8Array,
      ) => void;
      signedRevoke: (owner: Encoded.AccountAddress, name: string, sign: Uint8Array) => void;
      signedUpdate: (
        owner: Encoded.AccountAddress,
        name: string,
        key: string,
        pt: {
          'AENS.OraclePt'?: readonly [Encoded.Any];
          'AENSv2.OraclePt'?: readonly [Encoded.Any];
        },
        sign: Uint8Array
      ) => void;
    }>;
    let contractAddress: Encoded.ContractAddress;
    let aens: string;

    before(async () => {
      const isIris = (await aeSdk.api.getNodeInfo())
        .consensusProtocolVersion === ConsensusProtocolVersion.Iris;
      aens = isIris ? 'AENS' : 'AENSv2';
      contract = await Contract.initialize({
        ...aeSdk.getContext(),
        sourceCode: `
@compiler ${isIris ? '>= 7' : '>= 8'}
@compiler ${isIris ? '< 8' : '< 9'}

contract DelegateTest =
  entrypoint getName(name: string): option(${aens}.name) =
    ${aens}.lookup(name)
  stateful payable entrypoint signedPreclaim(addr: address, chash: hash, sign: signature): unit =
    ${aens}.preclaim(addr, chash, signature = sign)
  stateful entrypoint signedClaim(
    addr: address, name: string, salt: int, name_fee: int, sign: signature): unit =
    ${aens}.claim(addr, name, salt, name_fee, signature = sign)
  stateful entrypoint signedTransfer(
    owner: address, new_owner: address, name: string, sign: signature): unit =
    ${aens}.transfer(owner, new_owner, name, signature = sign)
  stateful entrypoint signedRevoke(owner: address, name: string, sign: signature): unit =
    ${aens}.revoke(owner, name, signature = sign)
  stateful entrypoint signedUpdate(
    owner: address, name: string, key: string, pt: ${aens}.pointee, sig: signature) =
    switch(${aens}.lookup(name))
      None => ()
      Some(${aens}.Name(_, _, ptrs)) =>
        ${aens}.update(owner, name, None, None, Some(ptrs{[key] = pt}), signature = sig)`,
      });
      await contract.$deploy([]);
      assertNotNull(contract.$options.address);
      contractAddress = contract.$options.address;
      [owner, newOwner] = aeSdk.addresses();
    });

    it('preclaims', async () => {
      const commitmentId = commitmentHash(name, salt);
      // TODO: provide more convenient way to create the decoded commitmentId ?
      const commitmentIdDecoded = decode(commitmentId);
      const preclaimSig = await aeSdk.createDelegationSignature(contractAddress, []);
      const { result } = await contract.signedPreclaim(owner, commitmentIdDecoded, preclaimSig);
      assertNotNull(result);
      result.returnType.should.be.equal('ok');
      await aeSdk.awaitHeight(2 + await aeSdk.getHeight());
      // signature for any other name related operations
      delegationSignature = await aeSdk.createDelegationSignature(contractAddress, [name]);
    });

    it('claims', async () => {
      const nameFee = 20e18; // 20 AE
      const { result } = await contract
        .signedClaim(owner, name, salt, nameFee, delegationSignature);
      assertNotNull(result);
      result.returnType.should.be.equal('ok');
    });

    it('gets', async () => {
      const nameEntry = (await contract.getName(name)).decodedResult[`${aens}.Name`];
      expect(nameEntry[0]).to.be.equal(owner);
      expect(nameEntry[1].FixedTTL[0]).to.be.a('bigint');
      expect(nameEntry[2]).to.be.eql(new Map());
    });

    it('updates', async () => {
      const pointee = { [`${aens}.OraclePt`]: [newOwner] as const };
      const { result } = await contract
        .signedUpdate(owner, name, 'oracle', pointee, delegationSignature);
      assertNotNull(result);
      expect(result.returnType).to.be.equal('ok');
      expect((await aeSdk.aensQuery(name)).pointers).to.be.eql([{
        key: 'oracle',
        id: newOwner.replace('ak', 'ok'),
      }]);
    });

    it('transfers', async () => {
      const { result } = await contract
        .signedTransfer(owner, newOwner, name, delegationSignature);
      assertNotNull(result);
      result.returnType.should.be.equal('ok');
    });

    it('revokes', async () => {
      const revokeSig = await aeSdk.createDelegationSignature(
        contractAddress,
        [name],
        { onAccount: aeSdk.accounts[newOwner] },
      );
      const { result } = await contract.signedRevoke(newOwner, name, revokeSig);
      assertNotNull(result);
      result.returnType.should.be.equal('ok');
      await expect(aeSdk.aensQuery(name)).to.be.rejectedWith(Error);
    });
  });

  describe('Oracle operation delegation', () => {
    let oracle: Awaited<ReturnType<typeof aeSdk.getOracleObject>>;
    let oracleId: Encoded.OracleAddress;
    let queryObject: Awaited<ReturnType<typeof aeSdk.getQueryObject>>;
    let delegationSignature: Uint8Array;
    const queryFee = 500000;
    const ttl: ChainTtl = { RelativeTTL: [50n] };
    let contract: Contract<{
      signedRegisterOracle: (
        addr: Encoded.AccountAddress, sign: Uint8Array, qfee: InputNumber, ttl: ChainTtl,
      ) => Encoded.OracleAddress;
      signedExtendOracle: (o: Encoded.OracleAddress, sign: Uint8Array, ttl: ChainTtl) => void;
      createQuery: (
        o: Encoded.OracleAddress, q: string, qfee: InputNumber, qttl: ChainTtl, rttl: ChainTtl,
      ) => Encoded.OracleQueryId;
      queryFee: (o: Encoded.OracleAddress) => bigint;
      respond: (
        o: Encoded.OracleAddress, q: Encoded.OracleQueryId, sign: Uint8Array, r: string,
      ) => void;
    }>;
    let contractAddress: Encoded.ContractAddress;

    before(async () => {
      contract = await Contract.initialize({
        ...aeSdk.getContext(),
        sourceCode:
          'contract DelegateTest =\n'
          + '  stateful payable entrypoint signedRegisterOracle(\n'
          + '    acct: address, sign: signature, qfee: int, ttl: Chain.ttl): oracle(string, string) =\n'
          + '    Oracle.register(acct, qfee, ttl, signature = sign)\n'
          + '  stateful payable entrypoint signedExtendOracle(\n'
          + '    o: oracle(string, string), sign: signature, ttl: Chain.ttl): unit =\n'
          + '    Oracle.extend(o, signature = sign, ttl)\n'
          + '  payable stateful entrypoint createQuery(\n'
          + '    o: oracle(string, string), q: string, qfee: int, qttl: Chain.ttl, rttl: Chain.ttl): oracle_query(string, string) =\n'
          + '    require(qfee =< Call.value, "insufficient value for qfee")\n'
          + '    require(Oracle.check(o), "oracle not valid")\n'
          + '    Oracle.query(o, q, qfee, qttl, rttl)\n'
          + '  entrypoint queryFee(o : oracle(string, int)) : int =\n'
          + '    Oracle.query_fee(o)\n'
          + '  stateful entrypoint respond(\n'
          + '    o: oracle(string, string), q: oracle_query(string, string), sign : signature, r: string) =\n'
          + '    Oracle.respond(o, q, signature = sign, r)',
      });
      await contract.$deploy([]);
      assertNotNull(contract.$options.address);
      contractAddress = contract.$options.address;
      oracleId = encode(decode(aeSdk.address), Encoding.OracleAddress);
    });

    it('registers', async () => {
      delegationSignature = await aeSdk.createDelegationSignature(contractAddress, []);
      const { result } = await contract
        .signedRegisterOracle(aeSdk.address, delegationSignature, queryFee, ttl);
      assertNotNull(result);
      result.returnType.should.be.equal('ok');
      oracle = await aeSdk.getOracleObject(oracleId);
      oracle.id.should.be.equal(oracleId);
    });

    it('extends', async () => {
      const { result } = await contract.signedExtendOracle(oracleId, delegationSignature, ttl);
      assertNotNull(result);
      result.returnType.should.be.equal('ok');
      const oracleExtended = await aeSdk.getOracleObject(oracleId);
      oracleExtended.ttl.should.be.equal(oracle.ttl + 50);
    });

    it('creates query', async () => {
      const q = 'Hello!';
      // TODO: don't register an extra oracle after fixing https://github.com/aeternity/aepp-sdk-js/issues/1419
      oracle = await aeSdk.registerOracle('string', 'int', { queryFee, onAccount: aeSdk.addresses()[1] });
      const query = await contract
        .createQuery(oracle.id, q, 1000 + queryFee, ttl, ttl, { amount: 5 * queryFee });
      assertNotNull(query.result);
      query.result.returnType.should.be.equal('ok');
      queryObject = await aeSdk.getQueryObject(oracle.id, query.decodedResult);
      queryObject.should.be.an('object');
      queryObject.decodedQuery.should.be.equal(q);
    });

    it('responds to query', async () => {
      const r = 'Hi!';
      // TODO type should be corrected in node api
      const queryId = queryObject.id as Encoded.OracleQueryId;
      aeSdk.selectAccount(aeSdk.addresses()[1]);
      const respondSig = await aeSdk
        .createDelegationSignature(contractAddress, [queryId], { omitAddress: true });
      const { result } = await contract.respond(oracle.id, queryId, respondSig, r);
      assertNotNull(result);
      result.returnType.should.be.equal('ok');
      const queryObject2 = await aeSdk.getQueryObject(oracle.id, queryId);
      queryObject2.decodedResponse.should.be.equal(r);
    });

    it('fails trying to create general delegation as oracle query', async () => {
      const fakeQueryId = encode(decode(aeSdk.address), Encoding.OracleQueryId);
      await expect(
        aeSdk.createDelegationSignature(contractAddress, [fakeQueryId], { omitAddress: true }),
      ).to.be.rejectedWith('not equal to account address');
    });
  });
});
