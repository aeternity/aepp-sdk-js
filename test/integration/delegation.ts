import { expect } from 'chai';
import { before, describe, it } from 'mocha';
import { assertNotNull, randomName, ChainTtl, InputNumber, indent } from '../utils';
import { getSdk, timeoutBlock } from '.';
import {
  commitmentHash,
  decode,
  encode,
  Encoded,
  Encoding,
  genSalt,
  AeSdk,
  Contract,
  Oracle,
  OracleClient,
  Name,
  packDelegation,
  DelegationTag,
  UnexpectedTsError,
} from '../../src';

describe('Operation delegation', () => {
  let aeSdk: AeSdk;

  before(async () => {
    aeSdk = await getSdk(2);
  });

  describe('AENS', () => {
    interface Pointee {
      'AENS.OraclePt'?: readonly [Encoded.AccountAddress];
      'AENSv2.OraclePt'?: readonly [Encoded.AccountAddress];
      'AENSv2.DataPt'?: readonly [Uint8Array];
    }

    const name = randomName(30);
    const nameFee = 500000000000001;
    const salt = genSalt();
    let owner: Encoded.AccountAddress;
    let newOwner: Encoded.AccountAddress;
    // TODO: replace with Encoded.Signature after solving https://github.com/aeternity/aepp-calldata-js/issues/240
    let delegationSignature: Encoded.Signature;
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
        pt: Pointee,
        sign: Uint8Array,
      ) => void;
    }>;
    let contractAddress: Encoded.ContractAddress;

    before(async () => {
      contract = await Contract.initialize({
        ...aeSdk.getContext(),
        sourceCode: `
@compiler >= 8
@compiler < 9

contract DelegateTest =
  entrypoint getName(name: string): option(AENSv2.name) =
    AENSv2.lookup(name)
  stateful payable entrypoint signedPreclaim(addr: address, chash: hash, sign: signature): unit =
    AENSv2.preclaim(addr, chash, signature = sign)
  stateful entrypoint signedClaim(
    addr: address, name: string, salt: int, name_fee: int, sign: signature): unit =
    AENSv2.claim(addr, name, salt, name_fee, signature = sign)
  stateful entrypoint signedTransfer(
    owner: address, new_owner: address, name: string, sign: signature): unit =
    AENSv2.transfer(owner, new_owner, name, signature = sign)
  stateful entrypoint signedRevoke(owner: address, name: string, sign: signature): unit =
    AENSv2.revoke(owner, name, signature = sign)
  stateful entrypoint signedUpdate(
    owner: address, name: string, key: string, pt: AENSv2.pointee, sig: signature) =
    switch(AENSv2.lookup(name))
      None => ()
      Some(AENSv2.Name(_, _, ptrs)) =>
        AENSv2.update(owner, name, None, None, Some(ptrs{[key] = pt}), signature = sig)`,
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
      const preclaimSig = await aeSdk.signDelegation(
        packDelegation({
          tag: DelegationTag.AensPreclaim,
          accountAddress: aeSdk.address,
          contractAddress,
        }),
      );
      const { result } = await contract.signedPreclaim(
        owner,
        commitmentIdDecoded,
        decode(preclaimSig),
      );
      assertNotNull(result);
      result.returnType.should.be.equal('ok');
      delegationSignature = await aeSdk.signDelegation(
        packDelegation({
          tag: DelegationTag.AensName,
          accountAddress: aeSdk.address,
          contractAddress,
          nameId: name,
        }),
      );
    });

    it('claims', async () => {
      await aeSdk.awaitHeight(1 + (await aeSdk.getHeight()));
      const { result } = await contract.signedClaim(
        owner,
        name,
        salt,
        nameFee,
        decode(delegationSignature),
      );
      assertNotNull(result);
      result.returnType.should.be.equal('ok');
    }).timeout(timeoutBlock);

    it('updates', async () => {
      const pointee: Pointee = { 'AENSv2.OraclePt': [newOwner] };
      const { result } = await contract.signedUpdate(
        owner,
        name,
        'oracle',
        pointee,
        decode(delegationSignature),
      );
      assertNotNull(result);
      expect(result.returnType).to.be.equal('ok');
      expect((await aeSdk.api.getNameEntryByName(name)).pointers).to.be.eql([
        {
          key: 'oracle',
          id: newOwner.replace('ak', 'ok'),
          encodedKey: 'ba_b3JhY2xlzgFUsQ==',
        },
      ]);
    });

    const dataPt = new Uint8Array(Buffer.from('test value'));

    it('updates with raw pointer', async () => {
      const pointee: Pointee = { 'AENSv2.DataPt': [dataPt] };
      await contract.signedUpdate(owner, name, 'test key', pointee, decode(delegationSignature));
      expect((await aeSdk.api.getNameEntryByName(name)).pointers[0]).to.be.eql({
        key: 'test key',
        id: encode(dataPt, Encoding.Bytearray),
        encodedKey: 'ba_dGVzdCBrZXk//Xo5',
      });
    });

    it('gets', async () => {
      const nameEntry = (await contract.getName(name)).decodedResult['AENSv2.Name'];
      if (!('FixedTTL' in nameEntry[1])) throw new UnexpectedTsError();
      const ttl = nameEntry[1].FixedTTL[0];
      expect(ttl).to.be.a('bigint');
      expect(nameEntry).to.be.eql([
        owner,
        { FixedTTL: [ttl] },
        new Map([
          ['oracle', { 'AENSv2.OraclePt': [newOwner] }],
          ['test key', { 'AENSv2.DataPt': [dataPt] }],
        ]),
      ]);
    });

    it('transfers', async () => {
      const { result } = await contract.signedTransfer(
        owner,
        newOwner,
        name,
        decode(delegationSignature),
      );
      assertNotNull(result);
      result.returnType.should.be.equal('ok');
    });

    it('revokes', async () => {
      const revokeSig = await aeSdk.signDelegation(
        packDelegation({
          tag: DelegationTag.AensName,
          accountAddress: aeSdk.accounts[newOwner].address,
          contractAddress,
          nameId: name,
        }),
        { onAccount: aeSdk.accounts[newOwner] },
      );
      const { result } = await contract.signedRevoke(newOwner, name, decode(revokeSig));
      assertNotNull(result);
      result.returnType.should.be.equal('ok');
      await expect(aeSdk.api.getNameEntryByName(name)).to.be.rejectedWith(Error);
    });

    it('works using wildcard delegation signature', async () => {
      const allNamesDelSig = decode(
        await aeSdk.signDelegation(
          packDelegation({
            tag: DelegationTag.AensWildcard,
            accountAddress: aeSdk.address,
            contractAddress,
          }),
        ),
      );
      const n = randomName(30);

      const commitmentId = decode(commitmentHash(n, salt));
      await contract.signedPreclaim(owner, commitmentId, allNamesDelSig);
      await aeSdk.awaitHeight(1 + (await aeSdk.getHeight()));

      await contract.signedClaim(owner, n, salt, nameFee, allNamesDelSig);

      const pointee: Pointee = { 'AENSv2.OraclePt': [newOwner] };
      await contract.signedUpdate(owner, n, 'oracle', pointee, allNamesDelSig);

      const nameEntry = (await contract.getName(n)).decodedResult['AENSv2.Name'];
      if (!('FixedTTL' in nameEntry[1])) throw new UnexpectedTsError();
      const ttl = nameEntry[1].FixedTTL[0];
      expect(ttl).to.be.a('bigint');
      expect(nameEntry).to.be.eql([
        owner,
        { FixedTTL: [ttl] },
        new Map([['oracle', { 'AENSv2.OraclePt': [newOwner] }]]),
      ]);

      await contract.signedTransfer(owner, newOwner, n, allNamesDelSig);
      await new Name(n, aeSdk.getContext()).transfer(owner, {
        onAccount: aeSdk.accounts[newOwner],
      });

      await contract.signedRevoke(owner, n, allNamesDelSig);
    }).timeout(timeoutBlock);

    it('claims without preclaim', async () => {
      const n = randomName(30);
      const dlgSig = await aeSdk.signDelegation(
        packDelegation({
          tag: DelegationTag.AensName,
          accountAddress: aeSdk.address,
          contractAddress,
          nameId: n,
        }),
      );
      const { result } = await contract.signedClaim(aeSdk.address, n, 0, nameFee, decode(dlgSig));
      assertNotNull(result);
      result.returnType.should.be.equal('ok');
    });
  });

  describe('Oracle', () => {
    let oracle: OracleClient;
    let queryObject: Awaited<ReturnType<OracleClient['getQuery']>>;
    let delegationSignature: Encoded.Signature;
    const queryFee = 500000;
    const ttl: ChainTtl = { RelativeTTL: [50n] };
    let contract: Contract<{
      signedRegisterOracle: (
        addr: Encoded.AccountAddress,
        sign: Uint8Array,
        qfee: InputNumber,
        ttl: ChainTtl,
      ) => Encoded.OracleAddress;
      signedExtendOracle: (o: Encoded.OracleAddress, sign: Uint8Array, ttl: ChainTtl) => void;
      createQuery: (
        o: Encoded.OracleAddress,
        q: string,
        qfee: InputNumber,
        qttl: ChainTtl,
        rttl: ChainTtl,
      ) => Encoded.OracleQueryId;
      queryFee: (o: Encoded.OracleAddress) => bigint;
      respond: (
        o: Encoded.OracleAddress,
        q: Encoded.OracleQueryId,
        sign: Uint8Array,
        r: string,
      ) => void;
    }>;
    let contractAddress: Encoded.ContractAddress;

    before(async () => {
      contract = await Contract.initialize({
        ...aeSdk.getContext(),
        sourceCode: indent`
          contract DelegateTest =
            stateful payable entrypoint signedRegisterOracle(
              acct: address, sign: signature, qfee: int, ttl: Chain.ttl): oracle(string, string) =
              Oracle.register(acct, qfee, ttl, signature = sign)
            stateful payable entrypoint signedExtendOracle(
              o: oracle(string, string), sign: signature, ttl: Chain.ttl): unit =
              Oracle.extend(o, signature = sign, ttl)
            payable stateful entrypoint createQuery(
              o: oracle(string, string), q: string, qfee: int, qttl: Chain.ttl, rttl: Chain.ttl): oracle_query(string, string) =
              require(qfee =< Call.value, "insufficient value for qfee")
              require(Oracle.check(o), "oracle not valid")
              Oracle.query(o, q, qfee, qttl, rttl)
            entrypoint queryFee(o : oracle(string, int)) : int =
              Oracle.query_fee(o)
            stateful entrypoint respond(
              o: oracle(string, string), q: oracle_query(string, string), sign : signature, r: string) =
              Oracle.respond(o, q, signature = sign, r)`,
      });
      await contract.$deploy([]);
      assertNotNull(contract.$options.address);
      contractAddress = contract.$options.address;
      oracle = new OracleClient(
        encode(decode(aeSdk.address), Encoding.OracleAddress),
        aeSdk.getContext(),
      );
    });

    it('registers', async () => {
      delegationSignature = await aeSdk.signDelegation(
        packDelegation({
          tag: DelegationTag.Oracle,
          accountAddress: aeSdk.address,
          contractAddress,
        }),
      );
      const { result } = await contract.signedRegisterOracle(
        aeSdk.address,
        decode(delegationSignature),
        queryFee,
        ttl,
      );
      assertNotNull(result);
      result.returnType.should.be.equal('ok');
    });

    it('extends', async () => {
      const prevState = await oracle.getState();
      const { result } = await contract.signedExtendOracle(
        oracle.address,
        decode(delegationSignature),
        ttl,
      );
      assertNotNull(result);
      result.returnType.should.be.equal('ok');
      const state = await oracle.getState();
      expect(state.ttl).to.be.equal(prevState.ttl + 50);
    });

    it('creates query', async () => {
      const q = 'Hello!';
      // TODO: don't register an extra oracle after fixing https://github.com/aeternity/aepp-sdk-js/issues/1419
      const orc = new Oracle(aeSdk.accounts[aeSdk.addresses()[1]], aeSdk.getContext());
      await orc.register('string', 'int', { queryFee });
      oracle = new OracleClient(orc.address, aeSdk.getContext());

      const query = await contract.createQuery(oracle.address, q, 1000 + queryFee, ttl, ttl, {
        amount: 5 * queryFee,
      });
      assertNotNull(query.result);
      query.result.returnType.should.be.equal('ok');
      queryObject = await oracle.getQuery(query.decodedResult);
      expect(queryObject.decodedQuery).to.be.equal(q);
    });

    it('responds to query', async () => {
      const r = 'Hi!';
      aeSdk.selectAccount(aeSdk.addresses()[1]);
      const respondSig = await aeSdk.signDelegation(
        packDelegation({
          tag: DelegationTag.OracleResponse,
          contractAddress,
          queryId: queryObject.id,
        }),
      );
      const { result } = await contract.respond(
        oracle.address,
        queryObject.id,
        decode(respondSig),
        r,
      );
      assertNotNull(result);
      result.returnType.should.be.equal('ok');
      const queryObject2 = await oracle.getQuery(queryObject.id);
      expect(queryObject2.decodedResponse).to.be.equal(r);
    });
  });
});
