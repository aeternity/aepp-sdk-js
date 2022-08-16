/*
 * ISC License (ISC)
 * Copyright (c) 2022 aeternity developers
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
import { expect } from 'chai';
import { before, describe, it } from 'mocha';
import BigNumber from 'bignumber.js';
import {
  AeSdk,
  decode,
  BytecodeMismatchError,
  InvalidAensNameError,
  MissingContractAddressError,
  MissingContractDefError,
  NotPayableFunctionError,
  MissingEventDefinitionError,
  AmbiguousEventDefinitionError,
  UnexpectedTsError,
  IllegalArgumentError,
} from '../../src';
import { getSdk } from '.';
import { Encoded } from '../../src/utils/encoder';
import { ContractInstance } from '../../src/contract/Contract';
import { Aci } from '../../src/apis/compiler';

const identityContractSourceCode = `
contract Identity =
 entrypoint getArg(x : int) = x
`;

const libContractSource = `
namespace TestLib =
  function sum(x: int, y: int) : int = x + y
`;

const remoteContractSource = `
contract Remote =
  datatype event = RemoteEvent1(int) | RemoteEvent2(string, int) | Duplicate(int)
  stateful entrypoint emitEvents(duplicate: bool) : unit =
    Chain.event(RemoteEvent2("test-string", 43))
    switch(duplicate)
      true => Chain.event(Duplicate(0))
      false => ()
`;

const testContractSourceCode = `
namespace Test =
  function double(x: int): int = x*2

contract interface RemoteI =
  type test_type = int
  record test_record = { value: string, key: list(test_type) }
  entrypoint test : () => int
  datatype event = RemoteEvent1(int) | RemoteEvent2(string, int) | Duplicate(int)
  entrypoint emitEvents : (bool) => unit

include "testLib"
contract StateContract =
  type number = int
  record state = { value: string, key: number, testOption: option(string) }
  record yesEr = { t: number}

  datatype event = TheFirstEvent(int) | AnotherEvent(string, address) | AnotherEvent2(bool, string, int) | Duplicate(string)
  datatype dateUnit = Year | Month | Day
  datatype one_or_both('a, 'b) = Left('a) | Right('b) | Both('a, 'b)

  entrypoint init(value: string, key: int, testOption: option(string)) : state = { value = value, key = key, testOption = testOption }
  entrypoint retrieve() : string*int = (state.value, state.key)
  stateful entrypoint setKey(key: number) = put(state{key = key})

  entrypoint remoteContract(a: RemoteI) : int = 1
  entrypoint remoteArgs(a: RemoteI.test_record) : RemoteI.test_type = 1
  entrypoint intFn(a: int) : int = a
  payable entrypoint stringFn(a: string) : string = a
  entrypoint boolFn(a: bool) : bool = a
  entrypoint addressFn(a: address) : address = a
  entrypoint contractAddress (ct: address) : address = ct
  entrypoint accountAddress (ak: address) : address = ak

  entrypoint tupleFn (a: string*int) : string*int = a
  entrypoint tupleInTupleFn (a: (string*int)*int) : (string*int)*int = a
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
  entrypoint approve(tx_id: int, remote_contract: RemoteI) : int = tx_id

  entrypoint hashFn(s: hash): hash = s
  entrypoint signatureFn(s: signature): signature = s
  entrypoint bytesFn(s: bytes(32)): bytes(32) = s

  entrypoint bitsFn(s: bits): bits = s

  entrypoint usingExternalLib(s: int): int = Test.double(s)

  entrypoint datTypeFn(s: dateUnit): dateUnit = s
  entrypoint datTypeGFn(x : one_or_both(int, string)) : int =
    switch(x)
      Left(x)    => x
      Right(_)   => abort("asdasd")
      Both(x, _) => x

  stateful entrypoint emitEvents(remote: RemoteI, duplicate: bool) : unit =
    Chain.event(TheFirstEvent(42))
    Chain.event(AnotherEvent("This is not indexed", ak_ptREMvyDbSh1d38t4WgYgac5oLsa2v9xwYFnG7eUWR8Er5cmT))
    remote.emitEvents(duplicate)
    Chain.event(AnotherEvent2(true, "This is not indexed", 1))

  entrypoint chainTtlFn(t: Chain.ttl): Chain.ttl = t

  stateful entrypoint recursion(t: string): string =
    put(state{value = t})
    recursion(t)
`;
const fileSystem = {
  testLib: libContractSource,
};
const notExistingContractAddress = 'ct_ptREMvyDbSh1d38t4WgYgac5oLsa2v9xwYFnG7eUWR8Er5cmT';

describe('Contract instance', () => {
  let aeSdk: AeSdk;
  let testContract: ContractInstance;
  let testContractAddress: Encoded.ContractAddress;
  let testContractAci: Aci;
  let testContractBytecode: Encoded.ContractBytearray;

  before(async () => {
    aeSdk = await getSdk(2);
    testContractAci = await aeSdk.compilerApi
      .generateACI({ code: testContractSourceCode, options: { fileSystem } });
    // @ts-expect-error should be changed on api
    testContractBytecode = (await aeSdk.compilerApi.compileContract({
      code: testContractSourceCode, options: { fileSystem },
    })).bytecode;
  });

  it('generates by source code', async () => {
    aeSdk._options.testProperty = 'test';
    testContract = await aeSdk.getContractInstance({
      sourceCode: testContractSourceCode, fileSystem, ttl: 0, gasLimit: 15000,
    });
    delete aeSdk._options.testProperty;
    expect(testContract.$options.testProperty).to.be.equal('test');
    testContract.should.have.property('sourceCode');
    testContract.should.have.property('bytecode');
    testContract.should.have.property('deployInfo');
    testContract.should.have.property('$compile');
    testContract.should.have.property('$call');
    testContract.should.have.property('$deploy');
    testContract.$options.ttl.should.be.equal(0);
    testContract.$options.should.have.property('fileSystem');
    testContract.$options.fileSystem.should.have.property('testLib');
    expect(Object.keys(testContract.methods)).to.be.eql(
      testContract._aci.encodedAci.contract.functions.map(({ name }) => name),
    );
  });

  it('compiles', async () => {
    await testContract.$compile();
    expect(testContract.bytecode).to.satisfy((b: string) => b.startsWith('cb_'));
  });

  it('fails on calling without deployment', () => expect(testContract.methods.intFn(2))
    .to.be.rejectedWith(MissingContractAddressError, 'Can\'t call contract without address'));

  it('deploys', async () => {
    const deployInfo = await testContract.$deploy(['test', 1, 'hahahaha'], {
      amount: 42,
      denomination: 'aettos',
      gasLimit: 16000,
      deposit: 0,
      ttl: 0,
      gasPrice: '1e9',
      strategy: 'max',
    });
    expect(deployInfo.address).to.satisfy((b: string) => b.startsWith('ct_'));
    expect(deployInfo.txData.tx.gas).to.be.equal(16000);
    expect(deployInfo.txData.tx.amount).to.be.equal(42n);
    expect(deployInfo.txData.gasUsed).to.be.equal(209);
    expect(deployInfo.txData.gasPrice).to.be.equal(1000000000n);
    expect(deployInfo.txData.tx.deposit).to.be.equal(0n);
    expect(testContract.bytecode).to.satisfy((b: string) => b.startsWith('cb_'));
    testContractAddress = deployInfo.address;
  });

  it('calls', async () => {
    expect((await testContract.methods.intFn(2)).decodedResult).to.be.equal(2n);
  });

  it('gets actual options from AeSdkBase', async () => {
    const [address1, address2] = aeSdk.addresses();
    expect((await testContract.methods.intFn(2)).result.callerId).to.be.equal(address1);
    aeSdk.selectAccount(address2);
    expect((await testContract.methods.intFn(2)).result.callerId).to.be.equal(address2);
    aeSdk.selectAccount(address1);
  });

  it('generates by aci', async () => aeSdk.getContractInstance({ aci: testContractAci, address: testContractAddress }));

  it('fails on trying to generate with not existing contract address', () => expect(aeSdk.getContractInstance(
    { aci: identityContractSourceCode, address: notExistingContractAddress },
  )).to.be.rejectedWith(`v3/contracts/${notExistingContractAddress} error: Contract not found`));

  it('fails on trying to generate with invalid address', () => expect(aeSdk.getContractInstance(
    { aci: identityContractSourceCode, address: 'ct_asdasdasd' },
  )).to.be.rejectedWith(InvalidAensNameError, 'Invalid name or address: ct_asdasdasd'));

  it('fails on trying to generate by aci without address', () => expect(aeSdk.getContractInstance({ aci: testContractAci }))
    .to.be.rejectedWith(MissingContractAddressError, 'Can\'t create instance by ACI without address'));

  it('generates by bytecode and aci', async () => aeSdk.getContractInstance({ bytecode: testContractBytecode, aci: testContractAci }));

  it('fails on generation without arguments', () => expect(aeSdk.getContractInstance()).to.be.rejectedWith(MissingContractDefError, 'Either ACI or source code is required'));

  it('calls by aci', async () => {
    const contract = await aeSdk.getContractInstance(
      { aci: testContractAci, address: testContract.deployInfo.address },
    );
    expect((await contract.methods.intFn(3)).decodedResult).to.be.equal(3n);
  });

  it('deploys and calls by bytecode and aci', async () => {
    const contract = await aeSdk.getContractInstance(
      { bytecode: testContractBytecode, aci: testContractAci },
    );
    await contract.$deploy(['test', 1]);
    expect((await contract.methods.intFn(3)).decodedResult).to.be.equal(3n);
  });

  it('accepts matching source code with enabled validation', async () => aeSdk.getContractInstance({
    sourceCode: testContractSourceCode,
    fileSystem,
    address: testContractAddress,
    validateBytecode: true,
  }));

  it('rejects not matching source code with enabled validation', () => expect(aeSdk.getContractInstance({
    sourceCode: identityContractSourceCode,
    address: testContractAddress,
    validateBytecode: true,
  })).to.be.rejectedWith(BytecodeMismatchError, 'Contract source code do not correspond to the bytecode deployed on the chain'));

  it('accepts matching bytecode with enabled validation', async () => aeSdk.getContractInstance({
    bytecode: testContractBytecode,
    aci: testContractAci,
    address: testContractAddress,
    validateBytecode: true,
  }));

  it('rejects not matching bytecode with enabled validation', async () => expect(aeSdk.getContractInstance({
    bytecode: (await aeSdk.compilerApi.compileContract({ code: identityContractSourceCode }))
      .bytecode,
    aci: await aeSdk.compilerApi
      .generateACI({ code: identityContractSourceCode, options: { fileSystem } }),
    address: testContractAddress,
    validateBytecode: true,
  })).to.be.rejectedWith(BytecodeMismatchError, 'Contract bytecode do not correspond to the bytecode deployed on the chain'));

  it('dry-runs init function', async () => {
    const res = await testContract.methods.init.get('test', 1, 'hahahaha');
    res.result.should.have.property('gasUsed');
    res.result.should.have.property('returnType');
    // TODO: ensure that return value is always can't be decoded (empty?)
  });

  it('dry-runs init function on specific account', async () => {
    const onAccount = aeSdk.accounts[aeSdk.addresses()[1]];
    const { result } = await testContract.methods.init.get('test', 1, 'hahahaha', { onAccount });
    result.callerId.should.be.equal(onAccount.address);
  });

  it('fails on paying to not payable function', async () => {
    const amount = 100;
    await expect(testContract.methods.intFn.send(1, { amount }))
      .to.be.rejectedWith(NotPayableFunctionError, `You try to pay "${amount}" to function "intFn" which is not payable. Only payable function can accept coins`);
  });

  it('pays to payable function', async () => {
    if (testContract.deployInfo.address == null) throw new UnexpectedTsError('testContract.deployInfo.address is null');
    const contractBalance = await aeSdk.getBalance(testContract.deployInfo.address);
    await testContract.methods.stringFn.send('test', { amount: 100 });
    const balanceAfter = await aeSdk.getBalance(testContract.deployInfo.address);
    balanceAfter.should.be.equal(`${+contractBalance + 100}`);
  });

  it('calls on specific account', async () => {
    const onAccount = aeSdk.accounts[aeSdk.addresses()[1]];
    const { result } = await testContract.methods.intFn(123, { onAccount });
    result.callerId.should.be.equal(onAccount.address);
  });

  describe('Gas', () => {
    let contract: ContractInstance;

    before(async () => {
      contract = await aeSdk.getContractInstance(
        { sourceCode: testContractSourceCode, fileSystem },
      );
    });

    it('estimates gas by default for contract deployments', async () => {
      const { tx: { gas }, gasUsed } = (await contract.$deploy(['test', 42])).txData;
      expect(gasUsed).to.be.equal(160);
      expect(gas).to.be.equal(200);
    });

    it('overrides gas through getContractInstance options for contract deployments', async () => {
      const ct = await aeSdk.getContractInstance({
        sourceCode: testContractSourceCode, fileSystem, gasLimit: 300,
      });
      const { tx: { gas }, gasUsed } = (await ct.$deploy(['test', 42])).txData;
      expect(gasUsed).to.be.equal(160);
      expect(gas).to.be.equal(300);
    });

    it('estimates gas by default for contract calls', async () => {
      const { tx: { gas }, gasUsed } = (await contract.methods.setKey(2)).txData;
      expect(gasUsed).to.be.equal(61);
      expect(gas).to.be.equal(76);
    });

    it('overrides gas through options for contract calls', async () => {
      const { tx: { gas }, gasUsed } = (await contract.methods.setKey(3, { gasLimit: 100 })).txData;
      expect(gasUsed).to.be.equal(61);
      expect(gas).to.be.equal(100);
    });

    it('runs out of gasLimit with correct message', async () => {
      await expect(contract.methods.setKey(42, { gasLimit: 10, callStatic: true }))
        .to.be.rejectedWith('Invocation failed: "Out of gas"');
      await expect(contract.methods.setKey(42, { gasLimit: 10 }))
        .to.be.rejectedWith('Invocation failed');
      await expect(contract.methods.recursion('infinite'))
        .to.be.rejectedWith('Invocation failed: "Out of gas"');
    });

    it('validates gas limit for contract calls', async () => {
      await expect(contract.methods.setKey(4, { gasLimit: 7e6 }))
        .to.be.rejectedWith(IllegalArgumentError, 'Gas limit 7000000 must be less or equal to 5818100');
    });

    it('sets maximum possible gas limit for dry-run contract calls', async () => {
      const { tx: { tx: { gasLimit } } } = await contract.methods.intFn(4);
      expect(gasLimit).to.be.equal(5817980);
      await expect(contract.methods.intFn(4, { gasLimit: gasLimit + 1 }))
        .to.be.rejectedWith(IllegalArgumentError, 'Gas limit 5817981 must be less or equal to 5817980');
      await expect(contract.methods.intFn(4, { gasLimit: gasLimit + 1, gasMax: 6e6 + 1 }))
        .to.be.rejectedWith('v3/dry-run error: Over the gas limit');
    });
  });

  describe('Events parsing', () => {
    let remoteContract: ContractInstance;
    let eventResult: Awaited<ReturnType<ContractInstance['$call']>>;

    before(async () => {
      remoteContract = await aeSdk.getContractInstance({ sourceCode: remoteContractSource });
      await remoteContract.$deploy();
      eventResult = await testContract.methods.emitEvents(remoteContract.deployInfo.address, false);
    });

    it('decodes events', () => {
      expect(eventResult.decodedEvents).to.be.eql([{
        name: 'AnotherEvent2',
        args: [true, 'This is not indexed', 1n],
        contract: {
          name: 'StateContract',
          address: testContract.deployInfo.address,
        },
      }, {
        name: 'RemoteEvent2',
        args: [
          'test-string',
          43n,
        ],
        contract: {
          name: 'RemoteI',
          address: remoteContract.deployInfo.address,
        },
      }, {
        name: 'AnotherEvent',
        args: [
          'This is not indexed',
          'ak_ptREMvyDbSh1d38t4WgYgac5oLsa2v9xwYFnG7eUWR8Er5cmT',
        ],
        contract: {
          name: 'StateContract',
          address: testContract.deployInfo.address,
        },
      }, {
        name: 'TheFirstEvent',
        args: [42n],
        contract: {
          name: 'StateContract',
          address: testContract.deployInfo.address,
        },
      }]);
    });

    it('decodes events using decodeEvents', () => {
      expect(testContract.$decodeEvents(eventResult.result.log))
        .to.be.eql(eventResult.decodedEvents);
    });

    it('throws error if can\'t find event definition', () => {
      const event = eventResult.result.log[0];
      event.topics[0] = event.topics[0].replace('0', '1');
      expect(() => testContract.$decodeEvents([event])).to.throw(
        MissingEventDefinitionError,
        'Can\'t find definition of 7165442193418278913262533136158148486147352807284929017531784742205476270109'
        + ` event emitted by ${testContract.deployInfo.address as string}`
        + ' (use omitUnknown option to ignore events like this)',
      );
    });

    it('omits events without definition using omitUnknown option', () => {
      const event = eventResult.result.log[0];
      event.topics[0] = event.topics[0].replace('0', '1');
      expect(testContract.$decodeEvents([event], { omitUnknown: true })).to.be.eql([]);
    });

    const getDuplicateLog = (): Array<{
      address: Encoded.ContractAddress;
      data: Encoded.ContractBytearray;
      topics: Array<string | number>;
    }> => [{
      address: remoteContract.deployInfo.address as Encoded.ContractAddress,
      data: 'cb_Xfbg4g==',
      topics: [
        '28631352549432199952459007654025571262660118571086898449909844428770770966435',
        0,
      ],
    }];

    it('throws error if found multiple event definitions', () => {
      expect(() => testContract.$decodeEvents(getDuplicateLog())).to.throw(
        AmbiguousEventDefinitionError,
        'Found multiple definitions of "Duplicate" event emitted by'
        + ` ${remoteContract.deployInfo.address ?? ''} in "StateContract", "RemoteI" contracts`
        + ' (use contractAddressToName option to specify contract name corresponding to address)',
      );
    });

    it('multiple event definitions resolved using contractAddressToName', () => {
      expect(
        testContract.$decodeEvents(
          getDuplicateLog(),
          { contractAddressToName: { [remoteContract.deployInfo.address ?? '']: 'RemoteI' } },
        ),
      ).to.be.eql([{
        name: 'Duplicate',
        args: [0n],
        contract: {
          address: remoteContract.deployInfo.address,
          name: 'RemoteI',
        },
      }]);
    });

    it('calls a contract that emits events with no defined events', async () => {
      const contract = await aeSdk.getContractInstance({
        sourceCode:
          'contract FooContract =\n'
          + '  entrypoint emitEvents(f: bool) = ()',
        address: remoteContract.deployInfo.address,
      });
      const result = await contract.methods.emitEvents(false, { omitUnknown: true });
      expect(result.decodedEvents).to.be.eql([]);
    });
  });

  describe('Arguments Validation and Casting', () => {
    describe('INT', () => {
      it('Invalid', async () => {
        await expect(testContract.methods.intFn('asd'))
          .to.be.rejectedWith('Cannot convert asd to a BigInt');
      });

      it('Valid', async () => {
        const { decodedResult } = await testContract.methods.intFn.get(1);
        expect(decodedResult).to.be.equal(1n);
      });

      const unsafeInt = BigInt(`${Number.MAX_SAFE_INTEGER.toString()}0`);
      it('Supports unsafe integer', async () => {
        const { decodedResult } = await testContract.methods.intFn.get(unsafeInt);
        expect(decodedResult).to.be.equal(unsafeInt);
      });

      it('Supports BigNumber', async () => {
        const { decodedResult } = await testContract.methods.intFn
          .get(new BigNumber(unsafeInt.toString()));
        expect(decodedResult).to.be.equal(unsafeInt);
      });
    });

    describe('BOOL', () => {
      it('Accepts empty object as true', async () => {
        const { decodedResult } = await testContract.methods.boolFn({});
        decodedResult.should.be.equal(true);
      });

      it('Valid', async () => {
        const { decodedResult } = await testContract.methods.boolFn.get(true);
        decodedResult.should.be.equal(true);
      });
    });

    describe('STRING', () => {
      it('Accepts array as joined string', async () => {
        const arr = [1, 2, 3];
        const { decodedResult } = await testContract.methods.stringFn(arr);
        decodedResult.should.be.equal(arr.join(','));
      });

      it('Accepts number as string', async () => {
        const { decodedResult } = await testContract.methods.stringFn(123);
        decodedResult.should.be.equal('123');
      });

      it('Valid', async () => {
        const { decodedResult } = await testContract.methods.stringFn('test-string');
        decodedResult.should.be.equal('test-string');
      });
    });

    describe('ADDRESS', () => {
      it('Invalid address', async () => {
        await expect(testContract.methods.addressFn('asdasasd'))
          .to.be.rejectedWith('Address should start with ak_, got asdasasd instead');
      });

      it('Invalid address type', async () => {
        await expect(testContract.methods.addressFn(333)).to.be
          .rejectedWith('Address should start with ak_, got 333 instead');
      });

      it('Return address', async () => {
        const { decodedResult } = await testContract.methods.accountAddress(aeSdk.address);
        decodedResult.should.be.equal(aeSdk.address);
      });

      it('Valid', async () => {
        const { decodedResult } = await testContract.methods.addressFn('ak_2ct6nMwmRnyGX6jPhraFPedZ5bYp1GXqpvnAq5LXeL5TTPfFif');
        decodedResult.should.be.equal('ak_2ct6nMwmRnyGX6jPhraFPedZ5bYp1GXqpvnAq5LXeL5TTPfFif');
      });
    });

    describe('TUPLE', () => {
      it('Invalid type', async () => {
        await expect(testContract.methods.tupleFn('asdasasd'))
          .to.be.rejectedWith('Fate tuple must be an Array, got asdasasd instead');
      });

      it('Invalid tuple prop type', async () => {
        await expect(testContract.methods.tupleFn([1, 'test-string']))
          .to.be.rejectedWith('Cannot convert test-string to a BigInt');
      });

      it('Required tuple prop', async () => {
        await expect(testContract.methods.tupleFn([1]))
          .to.be.rejectedWith('Cannot convert undefined to a BigInt');
      });

      it('Wrong type in list inside tuple', async () => {
        await expect(testContract.methods.tupleWithList([['test-string'], 1]))
          .to.be.rejectedWith('Cannot convert test-string to a BigInt');
      });

      it('Wrong type in tuple inside tuple', async () => {
        await expect(testContract.methods.tupleInTupleFn([['str', 'test-string'], 1]))
          .to.be.rejectedWith('Cannot convert test-string to a BigInt');
      });

      it('Valid', async () => {
        const { decodedResult } = await testContract.methods.tupleFn(['test', 1]);
        decodedResult.should.be.eql(['test', 1n]);
      });
    });

    describe('LIST', () => {
      it('Invalid type', async () => {
        await expect(testContract.methods.listFn('asdasasd'))
          .to.be.rejectedWith('Fate list must be an Array, got asdasasd instead');
      });

      it('Invalid list element type', async () => {
        await expect(testContract.methods.listFn([1, 'test-string']))
          .to.be.rejectedWith('Cannot convert test-string to a BigInt');
      });

      it('Invalid list element type nested', async () => {
        await expect(testContract.methods.listInListFn([['childListWronmgElement'], 'parentListWrongElement']))
          .to.be.rejectedWith('Cannot convert childListWronmgElement to a BigInt');
      });

      it('Valid', async () => {
        const { decodedResult } = await testContract.methods.listInListFn([[1, 2], [3, 4]]);
        decodedResult.should.be.eql([[1n, 2n], [3n, 4n]]);
      });
    });

    describe('MAP', () => {
      const address = 'ak_gvxNbZf5CuxYVfcUFoKAP4geZatWaC2Yy4jpx5vZoCKank4Gc';

      it('Valid', async () => {
        const mapArg = new Map([[address, ['someStringV', 324n]]]);
        const { decodedResult } = await testContract.methods.mapFn(mapArg);
        decodedResult.should.be.eql(mapArg);
      });

      it('Map With Option Value', async () => {
        const mapWithSomeValue = new Map([[address, ['someStringV', 123n]]]);
        const mapWithNoneValue = new Map([[address, ['someStringV', undefined]]]);
        let result = await testContract.methods.mapOptionFn(mapWithSomeValue);
        result.decodedResult.should.be.eql(mapWithSomeValue);
        result = await testContract.methods.mapOptionFn(mapWithNoneValue);
        result.decodedResult.should.be.eql(mapWithNoneValue);
      });

      it('Cast from string to int', async () => {
        const mapArg = new Map([[address, ['someStringV', '324']]] as const);
        const result = await testContract.methods.mapFn(mapArg);
        result.decodedResult.should.be.eql(new Map([[address, ['someStringV', 324n]]] as const));
      });

      it('Cast from array to map', async () => {
        const mapArg = [[address, ['someStringV', 324n]]] as const;
        const { decodedResult } = await testContract.methods.mapFn(mapArg);
        decodedResult.should.be.eql(new Map(mapArg));
      });
    });

    describe('RECORD/STATE', () => {
      it('Valid Set Record (Cast from JS object)', async () => {
        await testContract.methods.setRecord({ value: 'qwe', key: 1234, testOption: 'test' });
        const state = await testContract.methods.getRecord();
        state.decodedResult.should.be.eql({ value: 'qwe', key: 1234n, testOption: 'test' });
      });

      it('Get Record(Convert to JS object)', async () => {
        const result = await testContract.methods.getRecord();
        result.decodedResult.should.be.eql({ value: 'qwe', key: 1234n, testOption: 'test' });
      });

      it('Get Record With Option (Convert to JS object)', async () => {
        await testContract.methods.setRecord({ key: 1234, value: 'qwe', testOption: 'resolved string' });
        const result = await testContract.methods.getRecord();
        result.decodedResult.should.be.eql({ value: 'qwe', key: 1234n, testOption: 'resolved string' });
      });

      it('Invalid value type', async () => {
        await expect(testContract.methods.setRecord({ value: 123, key: 'test' }))
          .to.be.rejectedWith('Cannot convert test to a BigInt');
      });
    });

    describe('OPTION', () => {
      it('Set Some Option Value(Cast from JS value/Convert result to JS)', async () => {
        const optionRes = await testContract.methods.intOption(123);
        optionRes.decodedResult.should.be.equal(123n);
      });

      it('Set Some Option List Value(Cast from JS value/Convert result to JS)', async () => {
        const optionRes = await testContract.methods.listOption([[1, 'testString']]);
        optionRes.decodedResult.should.be.eql([[1n, 'testString']]);
      });

      it('Set None Option Value(Cast from JS value/Convert to JS)', async () => {
        const optionRes = await testContract.methods.intOption(null);
        expect(optionRes.decodedResult).to.be.equal(undefined);
      });

      it('Invalid option type', async () => {
        await expect(testContract.methods.intOption('test-string'))
          .to.be.rejectedWith('Cannot convert test-string to a BigInt');
      });
    });

    describe('NAMESPACES', () => {
      it('Use namespace in function body', async () => {
        const res = await testContract.methods.usingExternalLib(2);
        res.decodedResult.should.be.equal(4n);
      });
    });

    describe('DATATYPE', () => {
      it('Invalid type', async () => {
        await expect(testContract.methods.datTypeFn({}))
          .to.be.rejectedWith('Variant should be an object mapping constructor to array of values, got "[object Object]" instead');
      });

      it('Call generic datatype', async () => {
        const res = await testContract.methods.datTypeGFn({ Left: [2] });
        res.decodedResult.should.be.equal(2n);
      });

      it('Invalid arguments length', async () => {
        await expect(testContract.methods.datTypeGFn())
          .to.be.rejectedWith('Non matching number of arguments. datTypeGFn expects between 1 and 1 number of arguments but got 0');
      });

      it('Invalid variant', async () => {
        await expect(testContract.methods.datTypeFn({ asdcxz: [] }))
          .to.be.rejectedWith('Unknown variant constructor: asdcxz');
      });

      it('Valid', async () => {
        const res = await testContract.methods.datTypeFn({ Year: [] });
        res.decodedResult.should.be.eql({ Year: [] });
      });
    });

    describe('Hash', () => {
      it('Invalid type', async () => {
        await expect(testContract.methods.hashFn({}))
          .to.be.rejectedWith('Should be one of: Array, ArrayBuffer, hex string, Number, BigInt; got [object Object] instead');
      });

      it('Invalid length', async () => {
        await expect(testContract.methods.hashFn(decode(aeSdk.address).slice(1)))
          .to.be.rejectedWith('Invalid length: got 31 bytes instead of 32 bytes');
      });

      it('Valid', async () => {
        const decoded = decode(aeSdk.address);
        const hashAsBuffer = await testContract.methods.hashFn(decoded);
        const hashAsHex = await testContract.methods.hashFn(decoded.toString('hex'));
        hashAsBuffer.decodedResult.should.be.eql(decoded);
        hashAsHex.decodedResult.should.be.eql(decoded);
      });
    });

    describe('Signature', () => {
      it('Invalid type', async () => {
        await expect(testContract.methods.signatureFn({}))
          .to.be.rejectedWith('Should be one of: Array, ArrayBuffer, hex string, Number, BigInt; got [object Object] instead');
      });

      it('Invalid length', async () => {
        await expect(testContract.methods.signatureFn(decode(aeSdk.address)))
          .to.be.rejectedWith('Invalid length: got 32 bytes instead of 64 bytes');
      });

      it('Valid', async () => {
        const fakeSignature = Buffer.from(await aeSdk.sign(decode(aeSdk.address)));
        const hashAsBuffer = await testContract.methods.signatureFn(fakeSignature);
        const hashAsHex = await testContract.methods.signatureFn(fakeSignature.toString('hex'));
        hashAsBuffer.decodedResult.should.be.eql(fakeSignature);
        hashAsHex.decodedResult.should.be.eql(fakeSignature);
      });
    });

    describe('Bytes', () => {
      it('Invalid type', async () => {
        await expect(testContract.methods.bytesFn({}))
          .to.be.rejectedWith('Should be one of: Array, ArrayBuffer, hex string, Number, BigInt; got [object Object] instead');
      });

      it('Invalid length', async () => {
        const decoded = decode(aeSdk.address);
        await expect(testContract.methods.bytesFn(Buffer.from([...decoded, 2])))
          .to.be.rejectedWith('is not of type [{bytes,32}]');
      });

      it('Valid', async () => {
        const decoded = decode(aeSdk.address);
        const hashAsBuffer = await testContract.methods.bytesFn(decoded);
        const hashAsHex = await testContract.methods.bytesFn(decoded.toString('hex'));
        hashAsBuffer.decodedResult.should.be.eql(decoded);
        hashAsHex.decodedResult.should.be.eql(decoded);
      });
    });

    describe('Bits', () => {
      it('Invalid', async () => {
        await expect(testContract.methods.bitsFn({}))
          .to.be.rejectedWith('Cannot convert [object Object] to a BigInt');
      });

      it('Valid', async () => {
        (await Promise.all([0, -1n, 0b101n]
          .map(async (value) => [value, (await testContract.methods.bitsFn(value)).decodedResult])))
          .forEach(([v1, v2]) => expect(v2).to.be.equal(BigInt(v1)));
      });
    });

    describe('Chain.ttl variant', () => {
      it('Invalid', async () => {
        await expect(testContract.methods.chainTtlFn(50))
          .to.be.rejectedWith('Variant should be an object mapping constructor to array of values, got "50" instead');
      });

      it('Valid', async () => {
        const value = { FixedTTL: [50n] };
        expect((await testContract.methods.chainTtlFn(value)).decodedResult).to.be.eql(value);
      });
    });
  });

  describe('Call contract', () => {
    it('Call contract using using js type arguments', async () => {
      const res = await testContract.methods.listFn([1, 2]);
      expect(res.decodedResult).to.be.eql([1n, 2n]);
    });

    it('Call contract with contract type argument', async () => {
      const result = await testContract.methods.approve(0, 'ct_AUUhhVZ9de4SbeRk8ekos4vZJwMJohwW5X8KQjBMUVduUmoUh');
      expect(result.decodedResult).to.be.equal(0n);
    });
  });
});
