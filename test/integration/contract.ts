import { expect } from 'chai';
import { before, describe, it } from 'mocha';
import { assertNotNull, InputNumber } from '../utils';
import { getSdk } from '.';
import {
  ArgumentError, NodeInvocationError, Encoded, DRY_RUN_ACCOUNT,
  messageToHash, UnexpectedTsError, AeSdk, Contract, ContractMethodsBase, isAddressValid, Encoding,
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
    identityContract = await aeSdk
      .initializeContract({ bytecode, sourceCode: identitySourceCode });
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
    const signContract = await aeSdk.initializeContract<{
      verify: (data: Uint8Array, pub: Encoded.AccountAddress, sig: Uint8Array) => boolean;
    }>({
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
    const signContract = await aeSdk.initializeContract<{
      message_to_hash: (message: string) => Uint8Array;
      verify: (message: string, pub: Encoded.AccountAddress, sig: Uint8Array) => boolean;
    }>({
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
    const ct = await aeSdk.initializeContract({
      sourceCode:
        'contract Foo =\n'
        + '  entrypoint init() = abort("CustomErrorMessage")',
    });
    await expect(ct.$deploy([])).to.be.rejectedWith(NodeInvocationError, 'Invocation failed: "CustomErrorMessage"');
  });

  it('throws errors on method call', async () => {
    const ct = await aeSdk.initializeContract<{
      failWithoutMessage: (x: Encoded.AccountAddress) => void;
      failWithMessage: () => void;
    }>({
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
    const contract = await sdk.initializeContract<IdentityContractApi>({
      sourceCode: identitySourceCode, address: deployed.address,
    });
    const { result } = await contract.getArg(42);
    assertNotNull(result);
    result.callerId.should.be.equal(DRY_RUN_ACCOUNT.pub);
  });

  it('Dry-run at specific height', async () => {
    const contract = await aeSdk.initializeContract<{ call: () => void }>({
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
    expect(beforeKeyBlockHash).to.satisfy((s: string) => s.startsWith('kh_'));

    type BlockHash = Encoded.KeyBlockHash | Encoded.MicroBlockHash;
    const getMicroBlockHash = async (blockHash: BlockHash): Promise<Encoded.MicroBlockHash> => {
      if (isAddressValid(blockHash, Encoding.MicroBlockHash)) return blockHash;
      const hash = (await aeSdk.api.getKeyBlockByHash(blockHash)).prevHash as BlockHash;
      return getMicroBlockHash(hash);
    };
    const beforeMicroBlockHash = await getMicroBlockHash(topHeader.hash as BlockHash);
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
    const contract = await aeSdk.initializeContract<{
      init: (a: string) => void;
      retrieve: () => string;
    }>({
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
      contract = await aeSdk.initializeContract({
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
      await expect(aeSdk.initializeContract({ sourceCode: contractWithLibSourceCode }))
        .to.be.rejectedWith('Couldn\'t find include file');
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
});
