import { expect } from 'chai';
import { before, describe, it } from 'mocha';
import {
  assertNotNull, randomName, ChainTtl, InputNumber,
} from '../utils';
import { getSdk } from '.';
import {
  commitmentHash, decode, encode, Encoded, Encoding,
  genSalt, AeSdk, Contract, ConsensusProtocolVersion,
} from '../../src';

describe('Operation delegation', () => {
  let aeSdk: AeSdk;
  let isIris: boolean;

  before(async () => {
    aeSdk = await getSdk(2);
    isIris = (await aeSdk.api.getNodeInfo())
      .consensusProtocolVersion === ConsensusProtocolVersion.Iris;
  });

  describe('AENS', () => {
    const name = randomName(15);
    const salt = genSalt();
    let owner: Encoded.AccountAddress;
    let newOwner: Encoded.AccountAddress;
    // TODO: replace with Encoded.Signature after solving https://github.com/aeternity/aepp-calldata-js/issues/240
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
      aens = isIris ? 'AENS' : 'AENSv2';
      contract = await aeSdk.initializeContract({
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
      const preclaimSig = await aeSdk
        .createDelegationSignature(contractAddress, [], { isOracle: false });
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

    it('works using wildcard delegation signature', async () => {
      if (isIris) return;
      const allNamesDelSig = decode(await aeSdk.signAllNamesDelegationToContract(contractAddress));
      const n = randomName(15);

      const commitmentId = decode(commitmentHash(n, salt));
      await contract.signedPreclaim(owner, commitmentId, allNamesDelSig);
      await aeSdk.awaitHeight(2 + await aeSdk.getHeight());

      await contract.signedClaim(owner, n, salt, 20e18, allNamesDelSig);

      const pointee = { 'AENSv2.OraclePt': [newOwner] as const };
      await contract.signedUpdate(owner, n, 'oracle', pointee, allNamesDelSig);

      const nameEntry = (await contract.getName(n)).decodedResult['AENSv2.Name'];
      const ttl = nameEntry[1].FixedTTL[0];
      expect(ttl).to.be.a('bigint');
      expect(nameEntry).to.be.eql([
        owner,
        { FixedTTL: [ttl] },
        new Map([['oracle', { 'AENSv2.OraclePt': [newOwner] }]]),
      ]);

      await contract.signedTransfer(owner, newOwner, n, allNamesDelSig);
      await aeSdk.aensTransfer(n, owner, { onAccount: newOwner });

      await contract.signedRevoke(owner, n, allNamesDelSig);
    });

    it('claims without preclaim', async () => {
      const n = randomName(15);
      const nameFee = 20e18;
      const dlgSig = await aeSdk.createDelegationSignature(contractAddress, [n]);
      const { result } = await contract.signedClaim(aeSdk.address, n, 0, nameFee, dlgSig);
      assertNotNull(result);
      result.returnType.should.be.equal('ok');
    });
  });

  describe('Oracle', () => {
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
      contract = await aeSdk.initializeContract({
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
      delegationSignature = await aeSdk
        .createDelegationSignature(contractAddress, [], { isOracle: true });
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
      if (!isIris) return;
      const fakeQueryId = encode(decode(aeSdk.address), Encoding.OracleQueryId);
      await expect(
        aeSdk.createDelegationSignature(contractAddress, [fakeQueryId], { omitAddress: true }),
      ).to.be.rejectedWith('not equal to account address');
    });
  });
});
