import { expect } from 'chai';
import { before, describe, it } from 'mocha';
import BigNumber from 'bignumber.js';
import {
  AeSdk,
  decode, Encoded,
  BytecodeMismatchError,
  InvalidAensNameError,
  MissingContractAddressError,
  MissingContractDefError,
  NotPayableFunctionError,
  MissingEventDefinitionError,
  AmbiguousEventDefinitionError,
  IllegalArgumentError,
  Contract, ContractMethodsBase,
  hash,
  AE_AMOUNT_FORMATS,
  Tag,
} from '../../src';
import { getSdk } from '.';
import {
  assertNotNull, ChainTtl, ensureEqual, InputNumber,
} from '../utils';
import { Aci } from '../../src/contract/compiler/Base';
import { ContractCallObject } from '../../src/contract/Contract';
import includesAci from './contracts/Includes.json';

const identityContractSourceCode = `
contract Identity =
 entrypoint getArg(x : int) = x
`;

const libContractSource = `
namespace TestLib =
  function sum(x: int, y: int) : int = x + y
`;

const testContractSourceCode = `
namespace Test =
  function double(x: int): int = x*2

contract interface RemoteI =
  type test_type = int
  record test_record = { value: string, key: list(test_type) }

include "testLib"
contract StateContract =
  type number = int
  record state = { value: string, key: number, testOption: option(string) }

  datatype dateUnit = Year | Month | Day
  datatype one_or_both('a, 'b) = Left('a) | Right('b) | Both('a, 'b)

  entrypoint init(value: string, key: int, testOption: option(string)) : state = { value = value, key = key, testOption = testOption }
  entrypoint retrieve() : string*int = (state.value, state.key)
  stateful entrypoint setKey(key: number) = put(state{key = key})

  entrypoint remoteContract(_: RemoteI) : int = 1
  entrypoint remoteArgs(_: RemoteI.test_record) : RemoteI.test_type = 1
  entrypoint unitFn(a: unit) = a
  entrypoint intFn(a: int) : int = TestLib.sum(a, 0)
  payable entrypoint stringFn(a: string) : string = a
  entrypoint boolFn(a: bool) : bool = a
  entrypoint addressFn(a: address) : address = a

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
  entrypoint approve(remote_contract: RemoteI) : RemoteI = remote_contract

  entrypoint hashFn(s: hash): hash = s
  entrypoint signatureFn(s: signature): signature = s
  entrypoint bytesFn(s: bytes(32)): bytes(32) = s

  entrypoint bitsFn(s: bits): bits = s

  entrypoint usingExternalLib(s: int): int = Test.double(s)

  entrypoint datTypeFn(s: dateUnit): dateUnit = s
  entrypoint datTypeGFn(x : one_or_both(int, string)) : int =
    switch(x)
      Left(p)    => p
      Right(_)   => abort("asdasd")
      Both(p, _) => p

  entrypoint chainTtlFn(t: Chain.ttl): Chain.ttl = t

  stateful entrypoint recursion(t: string): string =
    put(state{value = t})
    recursion(t)
`;
const fileSystem = {
  testLib: libContractSource,
};
const notExistingContractAddress = 'ct_ptREMvyDbSh1d38t4WgYgac5oLsa2v9xwYFnG7eUWR8Er5cmT';

type DateUnit = { Year: [] } | { Month: [] } | { Day: [] };
type OneOrBoth<First, Second> = { Left: [First] } | { Both: [First, Second] } | { Right: [Second] };

interface TestContractApi extends ContractMethodsBase {
  init: (value: string, key: InputNumber, testOption?: string) => void;
  retrieve: () => [string, bigint];
  setKey: (key: InputNumber) => void;

  remoteContract: (a: Encoded.ContractAddress) => bigint;
  remoteArgs: (a: { value: string; key: InputNumber[] }) => bigint;
  unitFn: (a: []) => [];
  intFn: (a: InputNumber) => bigint;
  stringFn: (a: string) => string;
  boolFn: (a: boolean) => boolean;
  addressFn: (a: Encoded.AccountAddress) => Encoded.AccountAddress;

  tupleFn: (a: [string, InputNumber]) => [string, bigint];
  tupleInTupleFn: (a: [[string, InputNumber], InputNumber]) => [[string, bigint], bigint];
  tupleWithList: (a: [InputNumber[], InputNumber]) => [bigint[], bigint];

  listFn: (a: InputNumber[]) => bigint[];
  listInListFn: (a: InputNumber[][]) => bigint[][];

  mapFn: (
    a: Map<Encoded.AccountAddress, readonly [string, InputNumber]> |
    ReadonlyArray<readonly [Encoded.AccountAddress, readonly [string, InputNumber]]>,
  ) => Map<Encoded.AccountAddress, [string, bigint]>;
  mapOptionFn: (
    a: Map<Encoded.AccountAddress, readonly [string, InputNumber | undefined]> |
    ReadonlyArray<[Encoded.AccountAddress, readonly [string, InputNumber | undefined]]>,
  ) => Map<Encoded.AccountAddress, [string, bigint | undefined]>;

  getRecord: () => { value: string; key: bigint; testOption?: string };
  setRecord: (s: { value: string; key: InputNumber; testOption?: string }) => void;

  intOption: (s?: InputNumber | null) => bigint | undefined;
  listOption: (s?: Array<[InputNumber, string]>) => Array<[bigint, string]> | undefined;

  testFn: (a: InputNumber[], b: boolean) => [bigint[], boolean];
  approve: (remote_contract: Encoded.ContractAddress) => Encoded.ContractAddress;

  hashFn: (s: Uint8Array | string) => Uint8Array;
  signatureFn: (s: Uint8Array | string) => Uint8Array;
  bytesFn: (s: Uint8Array | string) => Uint8Array;

  bitsFn: (s: InputNumber) => bigint;

  usingExternalLib: (s: InputNumber) => bigint;

  datTypeFn: (s: DateUnit) => DateUnit;
  datTypeGFn: (s: OneOrBoth<InputNumber, string>) => bigint;

  chainTtlFn: (t: ChainTtl) => ChainTtl;

  recursion: (t: string) => string;
}

describe('Contract instance', () => {
  let aeSdk: AeSdk;
  let testContract: Contract<TestContractApi>;
  let testContractAddress: Encoded.ContractAddress;
  let testContractAci: Aci;
  let testContractBytecode: Encoded.ContractBytearray;

  before(async () => {
    aeSdk = await getSdk(2);
    const res = await aeSdk.compilerApi.compileBySourceCode(testContractSourceCode, fileSystem);
    testContractAci = res.aci;
    testContractBytecode = res.bytecode;
  });

  it('generates by source code', async () => {
    aeSdk._options.gasPrice = 100;
    testContract = await Contract.initialize<TestContractApi>({
      ...aeSdk.getContext(),
      sourceCode: testContractSourceCode,
      fileSystem,
      ttl: 0,
      gasLimit: 15000,
    });
    delete aeSdk._options.gasPrice;
    expect(testContract.$options.gasPrice).to.be.equal(100);
    delete testContract.$options.gasPrice;
    testContract.should.have.property('$compile');
    testContract.should.have.property('$call');
    testContract.should.have.property('$deploy');
    expect(testContract.$options.ttl).to.be.equal(0);
    testContract.$options.should.have.property('sourceCode');
    testContract.$options.should.have.property('bytecode');
    assertNotNull(testContract.$options.fileSystem);
    testContract.$options.fileSystem.should.have.property('testLib');
    const contractAci = testContract._aci[testContract._aci.length - 1]?.contract;
    assertNotNull(contractAci);
    contractAci.functions.forEach(({ name }) => expect(testContract).to.have.property(name));
  });

  it('compiles', async () => {
    await testContract.$compile();
    expect(testContract.$options.bytecode).to.satisfy((b: string) => b.startsWith('cb_'));
  });

  it('compiles contract by sourceCodePath', async () => {
    const ctr = await Contract.initialize({
      ...aeSdk.getContext(),
      aci: includesAci,
      sourceCodePath: './test/integration/contracts/Includes.aes',
    });
    expect(ctr.$options.bytecode).to.equal(undefined);
    expect(await ctr.$compile()).to.satisfy((b: string) => b.startsWith('cb_'));
  });

  it('fails on calling without deployment', () => expect(testContract.intFn(2))
    .to.be.rejectedWith(MissingContractAddressError, 'Can\'t dry-run contract without address'));

  it('deploys', async () => {
    const deployInfo = await testContract.$deploy(['test', 1, 'hahahaha'], {
      amount: 42,
      denomination: AE_AMOUNT_FORMATS.AETTOS,
      gasLimit: 16000,
      deposit: 0,
      ttl: 0,
      gasPrice: '1e9',
      strategy: 'max',
    });
    expect(deployInfo.address).to.satisfy((b: string) => b.startsWith('ct_'));
    assertNotNull(deployInfo.txData.tx);
    expect(deployInfo.txData.tx.gas).to.be.equal(16000);
    expect(deployInfo.txData.tx.amount).to.be.equal(42n);
    assertNotNull(deployInfo.result);
    expect(deployInfo.result.gasUsed).to.be.equal(209);
    expect(deployInfo.result.gasPrice).to.be.equal(1000000000n);
    expect(deployInfo.txData.tx.deposit).to.be.equal(0n);
    expect(testContract.$options.bytecode).to.satisfy((b: string) => b.startsWith('cb_'));
    assertNotNull(deployInfo.address);
    testContractAddress = deployInfo.address;
  });

  it('can be deployed by source code path', async () => {
    const contract = await Contract.initialize<{}>({
      ...aeSdk.getContext(),
      sourceCodePath: './test/integration/contracts/Includes.aes',
    });
    await contract.$deploy([]);
  });

  it('calls', async () => {
    const res = await testContract.intFn(2);
    expect(res.decodedResult).to.be.equal(2n);
    ensureEqual<Tag.ContractCallTx>(res.tx.tag, Tag.ContractCallTx);
    expect(res.tx.fee).to.be.equal('182000000000000');
  });

  it('calls with fallback account if onAccount is not provided', async () => {
    const account = testContract.$options.onAccount;
    delete testContract.$options.onAccount;
    const res = await testContract.intFn(2);
    expect(res.decodedResult).to.be.equal(2n);
    testContract.$options.onAccount = account;
  });

  it('calls on chain', async () => {
    const res = await testContract.intFn(2, { callStatic: false });
    expect(res.decodedResult).to.be.equal(2n);
    ensureEqual<Tag.SignedTx>(res.tx.tag, Tag.SignedTx);
    ensureEqual<Tag.ContractCallTx>(res.tx.encodedTx.tag, Tag.ContractCallTx);
    expect(res.tx.encodedTx.fee).to.be.equal('182000000000000');
  });

  it('calls without waitMined and get result later', async () => {
    const { hash: txHash } = await testContract
      .stringFn('test', { callStatic: false, waitMined: false });
    await aeSdk.poll(txHash);
    const { decodedResult } = await testContract.$getCallResultByTxHash(txHash, 'stringFn');
    expect(decodedResult).to.be.equal('test');
  });

  it('calls with correct nonce if transaction stuck in mempool', async () => {
    const sdk = await getSdk();
    await sdk.transferFunds(1, aeSdk.address);

    await sdk.spend(1, sdk.address, { waitMined: false, verify: false });
    const [nonce, nextNonce] = await Promise.all([
      sdk.getAccount(sdk.address).then((res) => res.nonce),
      sdk.api.getAccountNextNonce(sdk.address).then((res) => res.nextNonce),
    ]);
    expect(nonce + 2).to.be.equal(nextNonce);

    const contract = await Contract.initialize({
      ...sdk.getContext(), aci: testContractAci, address: testContract.$options.address,
    });
    await contract.intFn(2, { callStatic: true });
  });

  it('gets actual options from AeSdkBase', async () => {
    const [address1, address2] = aeSdk.addresses();
    let { result } = await testContract.intFn(2);
    assertNotNull(result);
    expect(result.callerId).to.be.equal(address1);
    aeSdk.selectAccount(address2);
    result = (await testContract.intFn(2)).result;
    assertNotNull(result);
    expect(result.callerId).to.be.equal(address2);
    aeSdk.selectAccount(address1);
  });

  it('generates by aci', async () => Contract.initialize({
    ...aeSdk.getContext(), aci: testContractAci, address: testContractAddress,
  }));

  it('fails on trying to generate with not existing contract address', () => expect(
    Contract.initialize({
      ...aeSdk.getContext(),
      sourceCode: identityContractSourceCode,
      address: notExistingContractAddress,
    }),
  ).to.be.rejectedWith(`v3/contracts/${notExistingContractAddress} error: Contract not found`));

  it('fails on trying to generate with invalid address', () => expect(
    Contract.initialize({
      ...aeSdk.getContext(), sourceCode: identityContractSourceCode, address: 'ct_asdasdasd',
    }),
  ).to.be.rejectedWith(InvalidAensNameError, 'Invalid name or address: ct_asdasdasd'));

  it('fails on trying to generate by aci without address', () => expect(
    Contract.initialize({ ...aeSdk.getContext(), aci: testContractAci }),
  ).to.be.rejectedWith(MissingContractAddressError, 'Can\'t create instance by ACI without address'));

  it('generates by bytecode and aci', async () => Contract.initialize({
    ...aeSdk.getContext(), bytecode: testContractBytecode, aci: testContractAci,
  }));

  it('fails on generation without arguments', () => expect(Contract.initialize(aeSdk.getContext()))
    .to.be.rejectedWith(MissingContractDefError, 'Either ACI or sourceCode or sourceCodePath is required'));

  it('calls by aci', async () => {
    const contract = await Contract.initialize<TestContractApi>({
      ...aeSdk.getContext(), aci: testContractAci, address: testContract.$options.address,
    });
    expect((await contract.intFn(3)).decodedResult).to.be.equal(3n);
  });

  it('deploys and calls by bytecode and aci', async () => {
    const contract = await Contract.initialize<TestContractApi>({
      ...aeSdk.getContext(), bytecode: testContractBytecode, aci: testContractAci,
    });
    await contract.$deploy(['test', 1]);
    expect((await contract.intFn(3)).decodedResult).to.be.equal(3n);
  });

  it('supports contract interfaces polymorphism', async () => {
    const contract = await Contract.initialize<{
      soundByDog: () => string;
      soundByCat: () => string;
    }>({
          ...aeSdk.getContext(),
          sourceCode: ''
            + 'include "String.aes"\n'
            + '\n'
            + 'contract interface Animal =\n'
            + '  entrypoint sound : () => string\n'
            + ''
            + 'contract Cat: Animal =\n'
            + '  entrypoint sound() = "meow"\n'
            + ''
            + 'contract Dog: Animal =\n'
            + '  entrypoint sound() = "bark"\n'
            + ''
            + 'main contract Main =\n'
            + '  entrypoint soundByAnimal(a: Animal): string =\n'
            + '    String.concat("animal sound: ", a.sound())\n'
            + '\n'
            + '  stateful entrypoint soundByDog(): string = soundByAnimal(Chain.create(): Dog)\n'
            + '\n'
            + '  stateful entrypoint soundByCat(): string = soundByAnimal(Chain.create(): Cat)\n',
        });

    await contract.$deploy([]);
    expect((await contract.soundByDog()).decodedResult).to.be.equal('animal sound: bark');
    expect((await contract.soundByCat()).decodedResult).to.be.equal('animal sound: meow');
  });

  it('accepts matching source code with enabled validation', async () => Contract.initialize({
    ...aeSdk.getContext(),
    sourceCode: testContractSourceCode,
    fileSystem,
    address: testContractAddress,
    validateBytecode: true,
  }));

  it('rejects not matching source code with enabled validation', () => expect(Contract.initialize({
    ...aeSdk.getContext(),
    sourceCode: identityContractSourceCode,
    address: testContractAddress,
    validateBytecode: true,
  })).to.be.rejectedWith(BytecodeMismatchError, 'Contract source code do not correspond to the bytecode deployed on the chain'));

  it('accepts matching bytecode with enabled validation', async () => Contract.initialize({
    ...aeSdk.getContext(),
    bytecode: testContractBytecode,
    aci: testContractAci,
    address: testContractAddress,
    validateBytecode: true,
  }));

  it('rejects not matching bytecode with enabled validation', async () => expect(
    Contract.initialize({
      ...aeSdk.getContext(),
      ...await aeSdk.compilerApi.compileBySourceCode(identityContractSourceCode),
      address: testContractAddress,
      validateBytecode: true,
    }),
  ).to.be.rejectedWith(BytecodeMismatchError, 'Contract bytecode do not correspond to the bytecode deployed on the chain'));

  it('dry-runs init function', async () => {
    const { result, decodedResult } = await testContract
      .init('test', 1, 'hahahaha', { callStatic: true });
    assertNotNull(result);
    result.should.have.property('gasUsed');
    result.should.have.property('returnType');
    expect(decodedResult).to.be.equal(undefined);
  });

  it('dry-runs init function on specific account', async () => {
    const onAccount = aeSdk.accounts[aeSdk.addresses()[1]];
    const { result } = await testContract
      .init('test', 1, 'hahahaha', { onAccount, callStatic: true });
    assertNotNull(result);
    result.callerId.should.be.equal(onAccount.address);
  });

  it('fails on paying to not payable function', async () => {
    const amount = 100;
    await expect(testContract.intFn(1, { amount, callStatic: false }))
      .to.be.rejectedWith(NotPayableFunctionError, `You try to pay "${amount}" to function "intFn" which is not payable. Only payable function can accept coins`);
  });

  it('pays to payable function', async () => {
    assertNotNull(testContract.$options.address);
    const contractBalance = await aeSdk.getBalance(testContract.$options.address);
    await testContract.stringFn('test', { amount: 100, callStatic: false });
    const balanceAfter = await aeSdk.getBalance(testContract.$options.address);
    balanceAfter.should.be.equal(`${+contractBalance + 100}`);
  });

  it('pays to payable function using BigInt', async () => {
    assertNotNull(testContract.$options.address);
    const contractBalance = await aeSdk.getBalance(testContract.$options.address);
    // bigint is not assignable to amount
    await testContract.stringFn('test', { amount: 100n as unknown as string, callStatic: false });
    const balanceAfter = await aeSdk.getBalance(testContract.$options.address);
    balanceAfter.should.be.equal(`${+contractBalance + 100}`);
  });

  it('calls on specific account', async () => {
    const onAccount = aeSdk.accounts[aeSdk.addresses()[1]];
    const { result } = await testContract.intFn(123, { onAccount });
    assertNotNull(result);
    result.callerId.should.be.equal(onAccount.address);
  });

  it('can be inherited', async () => {
    const contractOptions = await aeSdk.compilerApi.compileBySourceCode(identityContractSourceCode);
    interface TestApi extends ContractMethodsBase {
      getArg: (x: bigint | number) => bigint;
    }
    type OmitCompiler<Options> = Omit<Options, 'aci' | 'bytecode' | 'sourceCode' | 'onCompiler'>;

    class TestContract extends Contract<TestApi> {
      constructor(options: OmitCompiler<ConstructorParameters<typeof Contract<TestApi>>[0]>) {
        super({ ...options, ...contractOptions });
      }

      static override async initialize<M extends ContractMethodsBase = TestApi>(
        options: OmitCompiler<Parameters<typeof Contract<TestApi>['initialize']>[0]>,
      ): Promise<Contract<M>> {
        return Contract.initialize<M>({ ...options, ...contractOptions });
      }
    }

    const contract1 = new TestContract(aeSdk.getContext());
    expect(contract1._aci).to.be.an('array');
    expect(contract1.$options).to.be.an('object');
    await contract1.$deploy([]);
    expect((await contract1.getArg(42)).decodedResult).to.be.equal(42n);

    const contract2 = await TestContract.initialize({
      ...aeSdk.getContext(),
      address: contract1.$options.address,
    });
    expect(contract2._aci).to.be.an('array');
    expect(contract2.$options).to.be.an('object');
    expect((await contract2.getArg(42)).decodedResult).to.be.equal(42n);
  });

  describe('Gas', () => {
    let contract: Contract<TestContractApi>;

    before(async () => {
      contract = await Contract.initialize({
        ...aeSdk.getContext(), sourceCode: testContractSourceCode, fileSystem,
      });
    });

    it('estimates gas by default for contract deployments', async () => {
      const { txData: { tx }, result } = (await contract.$deploy(['test', 42]));
      assertNotNull(tx);
      assertNotNull(result);
      expect(result.gasUsed).to.be.equal(160);
      expect(tx.gas).to.be.equal(200);
    });

    it('overrides gas through Contract options for contract deployments', async () => {
      const ct = await Contract.initialize<TestContractApi>({
        ...aeSdk.getContext(), sourceCode: testContractSourceCode, fileSystem, gasLimit: 300,
      });
      const { txData: { tx }, result } = await ct.$deploy(['test', 42]);
      assertNotNull(tx);
      assertNotNull(result);
      expect(result.gasUsed).to.be.equal(160);
      expect(tx.gas).to.be.equal(300);
    });

    it('estimates gas by default for contract calls', async () => {
      const { txData: { tx }, result } = await contract.setKey(2);
      assertNotNull(tx);
      assertNotNull(result);
      expect(result.gasUsed).to.be.equal(61);
      expect(tx.gas).to.be.equal(76);
    });

    it('overrides gas through options for contract calls', async () => {
      const { txData: { tx }, result } = await contract.setKey(3, { gasLimit: 100 });
      assertNotNull(tx);
      assertNotNull(result);
      expect(result.gasUsed).to.be.equal(61);
      expect(tx.gas).to.be.equal(100);
    });

    it('runs out of gasLimit with correct message', async () => {
      await expect(contract.setKey(42, { gasLimit: 10, callStatic: true }))
        .to.be.rejectedWith('Invocation failed: "Out of gas"');
      await expect(contract.setKey(42, { gasLimit: 10 }))
        .to.be.rejectedWith('Invocation failed');
      await expect(contract.recursion('infinite'))
        .to.be.rejectedWith('Invocation failed: "Out of gas"');
    });

    it('validates gas limit for contract calls', async () => {
      await expect(contract.setKey(4, { gasLimit: 7e6 }))
        .to.be.rejectedWith(IllegalArgumentError, 'Gas limit 7000000 must be less or equal to 5818100');
    });

    it('sets maximum possible gas limit for dry-run contract calls', async () => {
      const { tx } = await contract.intFn(4);
      ensureEqual<Tag.ContractCallTx>(tx.tag, Tag.ContractCallTx);
      const { gasLimit } = tx;
      expect(gasLimit).to.be.equal(5817980);
      await expect(contract.intFn(4, { gasLimit: gasLimit + 1 }))
        .to.be.rejectedWith(IllegalArgumentError, 'Gas limit 5817981 must be less or equal to 5817980');
      await expect(contract.intFn(4, { gasLimit: gasLimit + 1, gasMax: 6e6 + 1 }))
        .to.be.rejectedWith('v3/dry-run error: Over the gas limit');
    });
  });

  describe('Events parsing', () => {
    let remoteContract: Contract<{}>;
    let contract: Contract<{
      emitEvents: (remote: Encoded.ContractAddress, duplicate: boolean) => void;
    }>;
    let deployResult: Awaited<ReturnType<Contract<{}>['$deploy']>>;
    let eventResult: Awaited<ReturnType<Contract<{}>['$call']>>;
    type Events = Parameters<Contract<{}>['$decodeEvents']>[0];
    let eventResultLog: Events;

    before(async () => {
      remoteContract = await Contract.initialize({
        ...aeSdk.getContext(),
        sourceCode: 'contract Remote =\n'
          + '  datatype event = RemoteEvent1(int) | RemoteEvent2(string, int) | Duplicate(int) | DuplicateSameType(int)\n'
          + '\n'
          + '  stateful entrypoint emitEvents(duplicate: bool) : unit =\n'
          + '    Chain.event(RemoteEvent2("test-string", 43))\n'
          + '    switch(duplicate)\n'
          + '      true => Chain.event(Duplicate(0))\n'
          + '      false => ()\n',
      });
      await remoteContract.$deploy([]);
      assertNotNull(remoteContract.$options.address);
      contract = await Contract.initialize({
        ...aeSdk.getContext(),
        sourceCode: 'contract interface RemoteI =\n'
          + '  datatype event = RemoteEvent1(int) | RemoteEvent2(string, int) | Duplicate(int) | DuplicateSameType(int)\n'
          + '  entrypoint emitEvents : (bool) => unit\n'
          + '\n'
          + 'contract StateContract =\n'
          + '  datatype event = TheFirstEvent(int) | AnotherEvent(string, address) | AnotherEvent2(bool, string, int) | Duplicate(string) | DuplicateSameType(int)\n'
          + '  entrypoint init() =\n'
          + '    Chain.event(TheFirstEvent(42))\n'
          + '    Chain.event(AnotherEvent("This is not indexed", ak_ptREMvyDbSh1d38t4WgYgac5oLsa2v9xwYFnG7eUWR8Er5cmT))\n'
          + '    Chain.event(AnotherEvent2(true, "This is not indexed", 1))\n'
          + '\n'
          + '  stateful entrypoint emitEvents(remote: RemoteI, duplicate: bool) : unit =\n'
          + '    Chain.event(TheFirstEvent(42))\n'
          + '    Chain.event(AnotherEvent("This is not indexed", ak_ptREMvyDbSh1d38t4WgYgac5oLsa2v9xwYFnG7eUWR8Er5cmT))\n'
          + '    remote.emitEvents(duplicate)\n'
          + '    Chain.event(AnotherEvent2(true, "This is not indexed", 1))\n',
      });
      deployResult = await contract.$deploy([]);
      eventResult = await contract.emitEvents(remoteContract.$options.address, false);
      assertNotNull(eventResult.result);
      eventResultLog = eventResult.result.log as Events;
    });

    it('decodes events', () => {
      expect(eventResult.decodedEvents).to.be.eql([{
        name: 'AnotherEvent2',
        args: [true, 'This is not indexed', 1n],
        contract: {
          name: 'StateContract',
          address: contract.$options.address,
        },
      }, {
        name: 'RemoteEvent2',
        args: [
          'test-string',
          43n,
        ],
        contract: {
          name: 'RemoteI',
          address: remoteContract.$options.address,
        },
      }, {
        name: 'AnotherEvent',
        args: [
          'This is not indexed',
          'ak_ptREMvyDbSh1d38t4WgYgac5oLsa2v9xwYFnG7eUWR8Er5cmT',
        ],
        contract: {
          name: 'StateContract',
          address: contract.$options.address,
        },
      }, {
        name: 'TheFirstEvent',
        args: [42n],
        contract: {
          name: 'StateContract',
          address: contract.$options.address,
        },
      }]);
    });

    it('parses events on deploy', () => {
      assertNotNull(eventResult.decodedEvents);
      const events = [...eventResult.decodedEvents];
      events.splice(1, 1);
      expect(deployResult.decodedEvents).to.be.eql(events);
    });

    it('decodes events using decodeEvents', () => {
      expect(contract.$decodeEvents(eventResultLog)).to.be.eql(eventResult.decodedEvents);
    });

    it('throws error if can\'t find event definition', () => {
      const event = eventResultLog[0];
      event.topics[0] = event.topics[0].toString().replace('0', '1');
      expect(() => contract.$decodeEvents([event])).to.throw(
        MissingEventDefinitionError,
        'Can\'t find definition of 7165442193418278913262533136158148486147352807284929017531784742205476270109'
        + ` event emitted by ${contract.$options.address}`
        + ' (use omitUnknown option to ignore events like this)',
      );
    });

    it('omits events without definition using omitUnknown option', () => {
      const event = eventResultLog[0];
      event.topics[0] = event.topics[0].toString().replace('0', '1');
      expect(contract.$decodeEvents([event], { omitUnknown: true })).to.be.eql([]);
    });

    const getDuplicateLog = (eventName: string): ContractCallObject['log'] => {
      assertNotNull(remoteContract.$options.address);
      return [{
        address: remoteContract.$options.address,
        data: 'cb_Xfbg4g==',
        topics: [
          BigInt(`0x${hash(eventName).toString('hex')}`).toString(),
          '0',
        ],
      }];
    };

    it('throws error if found multiple event definitions', () => {
      expect(() => contract.$decodeEvents(getDuplicateLog('Duplicate'))).to.throw(
        AmbiguousEventDefinitionError,
        'Found multiple definitions of "Duplicate" event with different types emitted by'
        + ` ${remoteContract.$options.address ?? ''} in "RemoteI", "StateContract" contracts`
        + ' (use contractAddressToName option to specify contract name corresponding to address)',
      );
    });

    it('multiple event definitions resolved using contractAddressToName', () => {
      expect(
        contract.$decodeEvents(
          getDuplicateLog('Duplicate'),
          { contractAddressToName: { [remoteContract.$options.address ?? '']: 'RemoteI' } },
        ),
      ).to.be.eql([{
        name: 'Duplicate',
        args: [0n],
        contract: {
          address: remoteContract.$options.address,
          name: 'RemoteI',
        },
      }]);
    });

    it('don\'t throws error if found multiple event definitions with the same type', () => {
      expect(contract.$decodeEvents(getDuplicateLog('DuplicateSameType'))).to.be.eql([{
        name: 'DuplicateSameType',
        args: [0n],
        contract: {
          address: remoteContract.$options.address,
          name: 'RemoteI',
        },
      }]);
    });

    it('calls a contract that emits events with no defined events', async () => {
      const c = await Contract.initialize<{ emitEvents: (f: boolean) => [] }>({
        ...aeSdk.getContext(),
        sourceCode:
          'contract FooContract =\n'
          + '  entrypoint emitEvents(f: bool) = ()',
        address: remoteContract.$options.address,
      });
      const result = await c.emitEvents(false, { omitUnknown: true });
      expect(result.decodedEvents).to.be.eql([]);
    });
  });

  describe('Arguments Validation and Casting', () => {
    describe('UNIT', () => {
      it('Invalid', async () => {
        await expect(testContract.unitFn('asd' as any))
          .to.be.rejectedWith('Fate tuple must be an Array, got asd instead');
      });

      it('Valid', async () => {
        const { decodedResult } = await testContract.unitFn([]);
        expect(decodedResult).to.be.eql([]);
      });
    });

    describe('INT', () => {
      it('Invalid', async () => {
        await expect(testContract.intFn('asd'))
          .to.be.rejectedWith('Cannot convert asd to a BigInt');
      });

      it('Valid', async () => {
        const { decodedResult } = await testContract.intFn(1);
        expect(decodedResult).to.be.equal(1n);
      });

      const unsafeInt = BigInt(`${Number.MAX_SAFE_INTEGER.toString()}0`);
      it('Supports unsafe integer', async () => {
        const { decodedResult } = await testContract.intFn(unsafeInt);
        expect(decodedResult).to.be.equal(unsafeInt);
      });

      it('Supports BigNumber', async () => {
        const { decodedResult } = await testContract
          .intFn(new BigNumber(unsafeInt.toString()));
        expect(decodedResult).to.be.equal(unsafeInt);
      });
    });

    describe('BOOL', () => {
      it('Accepts empty object as true', async () => {
        const { decodedResult } = await testContract.boolFn({} as any);
        decodedResult.should.be.equal(true);
      });

      it('Valid', async () => {
        const { decodedResult } = await testContract.boolFn(true);
        decodedResult.should.be.equal(true);
      });
    });

    describe('STRING', () => {
      it('Accepts array as joined string', async () => {
        const arr = [1, 2, 3];
        const { decodedResult } = await testContract.stringFn(arr as any);
        decodedResult.should.be.equal(arr.join(','));
      });

      it('Accepts number as string', async () => {
        const { decodedResult } = await testContract.stringFn(123 as any);
        decodedResult.should.be.equal('123');
      });

      it('Valid', async () => {
        const { decodedResult } = await testContract.stringFn('test-string');
        decodedResult.should.be.equal('test-string');
      });
    });

    describe('ADDRESS', () => {
      it('Invalid address', async () => {
        await expect(testContract.addressFn('asdasasd' as any))
          .to.be.rejectedWith('Account pubkey should start with ak_, got asdasasd instead');
      });

      it('Invalid address type', async () => {
        await expect(testContract.addressFn(333 as any)).to.be
          .rejectedWith('data.substring is not a function');
      });

      it('Return address', async () => {
        const { decodedResult } = await testContract.addressFn(aeSdk.address);
        decodedResult.should.be.equal(aeSdk.address);
      });

      it('Valid', async () => {
        const { decodedResult } = await testContract.addressFn('ak_2ct6nMwmRnyGX6jPhraFPedZ5bYp1GXqpvnAq5LXeL5TTPfFif');
        decodedResult.should.be.equal('ak_2ct6nMwmRnyGX6jPhraFPedZ5bYp1GXqpvnAq5LXeL5TTPfFif');
      });
    });

    describe('TUPLE', () => {
      it('Invalid type', async () => {
        await expect(testContract.tupleFn('asdasasd' as any))
          .to.be.rejectedWith('Fate tuple must be an Array, got asdasasd instead');
      });

      it('Invalid tuple prop type', async () => {
        await expect(testContract.tupleFn([1, 'test-string'] as any))
          .to.be.rejectedWith('Cannot convert test-string to a BigInt');
      });

      it('Required tuple prop', async () => {
        await expect(testContract.tupleFn([1] as any))
          .to.be.rejectedWith('Cannot convert undefined to a BigInt');
      });

      it('Wrong type in list inside tuple', async () => {
        await expect(testContract.tupleWithList([['test-string'], 1] as any))
          .to.be.rejectedWith('Cannot convert test-string to a BigInt');
      });

      it('Wrong type in tuple inside tuple', async () => {
        await expect(testContract.tupleInTupleFn([['str', 'test-string'], 1] as any))
          .to.be.rejectedWith('Cannot convert test-string to a BigInt');
      });

      it('Valid', async () => {
        const { decodedResult } = await testContract.tupleFn(['test', 1]);
        decodedResult.should.be.eql(['test', 1n]);
      });
    });

    describe('LIST', () => {
      it('Invalid type', async () => {
        await expect(testContract.listFn('asdasasd' as any))
          .to.be.rejectedWith('Fate list must be an Array, got asdasasd instead');
      });

      it('Invalid list element type', async () => {
        await expect(testContract.listFn([1, 'test-string'] as any))
          .to.be.rejectedWith('Cannot convert test-string to a BigInt');
      });

      it('Invalid list element type nested', async () => {
        await expect(testContract.listInListFn([['childListWronmgElement'], 'parentListWrongElement'] as any))
          .to.be.rejectedWith('Cannot convert childListWronmgElement to a BigInt');
      });

      it('Valid', async () => {
        const { decodedResult } = await testContract.listInListFn([[1, 2], [3, 4]]);
        decodedResult.should.be.eql([[1n, 2n], [3n, 4n]]);
      });
    });

    describe('MAP', () => {
      const address: Encoded.AccountAddress = 'ak_gvxNbZf5CuxYVfcUFoKAP4geZatWaC2Yy4jpx5vZoCKank4Gc';

      it('Valid', async () => {
        const mapArg = new Map([[address, ['someStringV', 324n]]] as const);
        const { decodedResult } = await testContract.mapFn(mapArg);
        decodedResult.should.be.eql(mapArg);
      });

      it('Map With Option Value', async () => {
        const mapWithSomeValue = new Map([[address, ['someStringV', 123n]]] as const);
        const mapWithNoneValue = new Map([[address, ['someStringV', undefined]]] as const);
        let result = await testContract.mapOptionFn(mapWithSomeValue);
        result.decodedResult.should.be.eql(mapWithSomeValue);
        result = await testContract.mapOptionFn(mapWithNoneValue);
        result.decodedResult.should.be.eql(mapWithNoneValue);
      });

      it('Cast from string to int', async () => {
        const mapArg = new Map([[address, ['someStringV', '324']]] as const);
        const result = await testContract.mapFn(mapArg);
        result.decodedResult.should.be.eql(new Map([[address, ['someStringV', 324n]]] as const));
      });

      it('Cast from array to map', async () => {
        const mapArg = [[address, ['someStringV', 324n]]] as const;
        const { decodedResult } = await testContract.mapFn(mapArg);
        decodedResult.should.be.eql(new Map(mapArg));
      });
    });

    describe('RECORD/STATE', () => {
      it('Valid Set Record (Cast from JS object)', async () => {
        await testContract.setRecord({ value: 'qwe', key: 1234, testOption: 'test' });
        const state = await testContract.getRecord();
        state.decodedResult.should.be.eql({ value: 'qwe', key: 1234n, testOption: 'test' });
      });

      it('Get Record(Convert to JS object)', async () => {
        const result = await testContract.getRecord();
        result.decodedResult.should.be.eql({ value: 'qwe', key: 1234n, testOption: 'test' });
      });

      it('Get Record With Option (Convert to JS object)', async () => {
        await testContract.setRecord({ key: 1234, value: 'qwe', testOption: 'resolved string' });
        const result = await testContract.getRecord();
        result.decodedResult.should.be.eql({ value: 'qwe', key: 1234n, testOption: 'resolved string' });
      });

      it('Invalid value type', async () => {
        await expect(testContract.setRecord({ value: 123, key: 'test' } as any))
          .to.be.rejectedWith('Cannot convert test to a BigInt');
      });
    });

    describe('OPTION', () => {
      it('Set Some Option Value(Cast from JS value/Convert result to JS)', async () => {
        const optionRes = await testContract.intOption(123);
        optionRes.decodedResult.should.be.equal(123n);
      });

      it('Set Some Option List Value(Cast from JS value/Convert result to JS)', async () => {
        const optionRes = await testContract.listOption([[1, 'testString']]);
        optionRes.decodedResult.should.be.eql([[1n, 'testString']]);
      });

      it('Set None Option Value(Cast from JS value/Convert to JS)', async () => {
        const optionRes = await testContract.intOption(null);
        expect(optionRes.decodedResult).to.be.equal(undefined);
      });

      it('Invalid option type', async () => {
        await expect(testContract.intOption('test-string' as any))
          .to.be.rejectedWith('Cannot convert test-string to a BigInt');
      });
    });

    describe('NAMESPACES', () => {
      it('Use namespace in function body', async () => {
        const res = await testContract.usingExternalLib(2);
        res.decodedResult.should.be.equal(4n);
      });
    });

    describe('DATATYPE', () => {
      it('Invalid type', async () => {
        await expect(testContract.datTypeFn({} as any))
          .to.be.rejectedWith('Variant should be an object mapping constructor to array of values, got "[object Object]" instead');
      });

      it('Call generic datatype', async () => {
        const res = await testContract.datTypeGFn({ Left: [2] });
        res.decodedResult.should.be.equal(2n);
      });

      it('Invalid arguments length', async () => {
        await expect(testContract.datTypeGFn(...[] as any))
          .to.be.rejectedWith('Non matching number of arguments. datTypeGFn expects between 1 and 1 number of arguments but got 0');
      });

      it('Invalid variant', async () => {
        await expect(testContract.datTypeFn({ asdcxz: [] } as any))
          .to.be.rejectedWith('Unknown variant constructor: asdcxz');
      });

      it('Valid', async () => {
        const res = await testContract.datTypeFn({ Year: [] });
        res.decodedResult.should.be.eql({ Year: [] });
      });
    });

    describe('Hash', () => {
      it('Invalid type', async () => {
        await expect(testContract.hashFn({} as any))
          .to.be.rejectedWith('Should be one of: Array, ArrayBuffer, hex string, Number, BigInt; got [object Object] instead');
      });

      it('Invalid length', async () => {
        await expect(testContract.hashFn(decode(aeSdk.address).slice(1)))
          .to.be.rejectedWith('Invalid length: got 31 bytes instead of 32 bytes');
      });

      it('Valid', async () => {
        const decoded = decode(aeSdk.address);
        const hashAsBuffer = await testContract.hashFn(decoded);
        const hashAsHex = await testContract.hashFn(decoded.toString('hex'));
        hashAsBuffer.decodedResult.should.be.eql(decoded);
        hashAsHex.decodedResult.should.be.eql(decoded);
      });
    });

    describe('Signature', () => {
      it('Invalid type', async () => {
        await expect(testContract.signatureFn({} as any))
          .to.be.rejectedWith('Should be one of: Array, ArrayBuffer, hex string, Number, BigInt; got [object Object] instead');
      });

      it('Invalid length', async () => {
        await expect(testContract.signatureFn(decode(aeSdk.address)))
          .to.be.rejectedWith('Invalid length: got 32 bytes instead of 64 bytes');
      });

      it('Valid', async () => {
        const fakeSignature = Buffer.from(await aeSdk.sign(decode(aeSdk.address)));
        const hashAsBuffer = await testContract.signatureFn(fakeSignature);
        const hashAsHex = await testContract.signatureFn(fakeSignature.toString('hex'));
        hashAsBuffer.decodedResult.should.be.eql(fakeSignature);
        hashAsHex.decodedResult.should.be.eql(fakeSignature);
      });
    });

    describe('Bytes', () => {
      it('Invalid type', async () => {
        await expect(testContract.bytesFn({} as any))
          .to.be.rejectedWith('Should be one of: Array, ArrayBuffer, hex string, Number, BigInt; got [object Object] instead');
      });

      it('Invalid length', async () => {
        const decoded = decode(aeSdk.address);
        await expect(testContract.bytesFn(Buffer.from([...decoded, 2])))
          .to.be.rejectedWith('is not of type [{bytes,32}]');
      });

      it('Valid', async () => {
        const decoded = decode(aeSdk.address);
        const hashAsBuffer = await testContract.bytesFn(decoded);
        const hashAsHex = await testContract.bytesFn(decoded.toString('hex'));
        hashAsBuffer.decodedResult.should.be.eql(decoded);
        hashAsHex.decodedResult.should.be.eql(decoded);
      });
    });

    describe('Bits', () => {
      it('Invalid', async () => {
        await expect(testContract.bitsFn({} as any))
          .to.be.rejectedWith('Cannot convert [object Object] to a BigInt');
      });

      it('Valid', async () => {
        (await Promise.all([0, -1n, 0b101n]
          .map(async (value) => [value, (await testContract.bitsFn(value)).decodedResult])))
          .forEach(([v1, v2]) => expect(v2).to.be.equal(BigInt(v1)));
      });
    });

    describe('Chain.ttl variant', () => {
      it('Invalid', async () => {
        await expect(testContract.chainTtlFn(50 as any))
          .to.be.rejectedWith('Variant should be an object mapping constructor to array of values, got "50" instead');
      });

      it('Valid', async () => {
        const value: ChainTtl = { FixedTTL: [50n] };
        expect((await testContract.chainTtlFn(value)).decodedResult).to.be.eql(value);
      });
    });
  });

  describe('Call contract', () => {
    it('Call contract using using js type arguments', async () => {
      const res = await testContract.listFn([1, 2]);
      expect(res.decodedResult).to.be.eql([1n, 2n]);
    });

    it('Call contract with contract type argument', async () => {
      const result = await testContract.approve('ct_AUUhhVZ9de4SbeRk8ekos4vZJwMJohwW5X8KQjBMUVduUmoUh');
      expect(result.decodedResult).to.be.equal('ct_AUUhhVZ9de4SbeRk8ekos4vZJwMJohwW5X8KQjBMUVduUmoUh');
    });
  });
});
