import { describe, it, before, after, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import * as sinon from 'sinon';
import { getSdk, networkId } from '.';
import {
  buildTxHash,
  encode,
  decode,
  Encoded,
  Encoding,
  Tag,
  AbiVersion,
  VmVersion,
  AeSdk,
  Contract,
  Channel,
  buildTx,
  MemoryAccount,
} from '../../src';
import { SignTxWithTag } from '../../src/channel/internal';
import { assertNotNull } from '../utils';
import { initializeChannels, recreateAccounts } from './channel-utils';

const contractSourceCode = `
contract Identity =
  entrypoint getArg(x : int) : int = x
`;

describe('Channel contracts', () => {
  let aeSdk: AeSdk;
  let initiator: MemoryAccount;
  let responder: MemoryAccount;
  let initiatorCh: Channel;
  let responderCh: Channel;
  let responderShouldRejectUpdate: number | boolean;
  let contractAddress: Encoded.ContractAddress;
  let callerNonce: number;
  let contract: Contract<{}>;
  const initiatorSign = async (tx: Encoded.Transaction): Promise<Encoded.Transaction> =>
    initiator.signTransaction(tx, { networkId });
  const responderSign = async (tx: Encoded.Transaction): Promise<Encoded.Transaction> =>
    responder.signTransaction(tx, { networkId });
  const responderSignTag = sinon.spy<SignTxWithTag>(async (_tag, tx: Encoded.Transaction) => {
    if (typeof responderShouldRejectUpdate === 'number') {
      return responderShouldRejectUpdate as unknown as Encoded.Transaction;
    }
    if (responderShouldRejectUpdate) {
      return null as unknown as Encoded.Transaction;
    }
    return responderSign(tx);
  });
  const initiatorSignedTx = async (): Promise<Encoded.Transaction> => {
    const { signedTx } = await initiatorCh.state();
    assertNotNull(signedTx);
    return buildTx(signedTx);
  };
  const initiatorParams = {
    role: 'initiator',
    host: 'localhost',
    sign: async (_tag: string, tx: Encoded.Transaction) => initiatorSign(tx),
  } as const;
  const responderParams = {
    role: 'responder',
    sign: responderSignTag,
  } as const;

  before(async () => {
    aeSdk = await getSdk();
    [initiator, responder] = await recreateAccounts(aeSdk);
  });

  after(() => {
    initiatorCh.disconnect();
    responderCh.disconnect();
  });

  beforeEach(() => {
    responderShouldRejectUpdate = false;
  });

  afterEach(() => {
    responderSignTag.resetHistory();
  });

  it('can create a contract and accept', async () => {
    [initiatorCh, responderCh] = await initializeChannels(initiatorParams, responderParams);
    contract = await Contract.initialize({ ...aeSdk.getContext(), sourceCode: contractSourceCode });
    const initiatorNewContract = sinon.spy();
    initiatorCh.on('newContract', initiatorNewContract);
    const responderNewContract = sinon.spy();
    responderCh.on('newContract', responderNewContract);
    const roundBefore = initiatorCh.round();
    assertNotNull(roundBefore);
    const callData = contract._calldata.encode('Identity', 'init', []);
    const result = await initiatorCh.createContract(
      {
        code: await contract.$compile(),
        callData,
        deposit: 1000,
        vmVersion: VmVersion.Fate,
        abiVersion: AbiVersion.Fate,
      },
      initiatorSign,
    );
    result.should.eql({
      accepted: true,
      address: result.address,
      signedTx: await initiatorSignedTx(),
    });
    expect(initiatorCh.round()).to.equal(roundBefore + 1);
    sinon.assert.calledTwice(responderSignTag);
    sinon.assert.calledWithExactly(responderSignTag, 'update_ack', sinon.match.string, {
      updates: [
        {
          abi_version: AbiVersion.Fate,
          call_data: callData,
          code: await contract.$compile(),
          deposit: 1000,
          op: 'OffChainNewContract',
          owner: sinon.match.string,
          vm_version: VmVersion.Fate,
        },
      ],
    });
    async function getContractAddresses(channel: Channel): Promise<Encoded.ContractAddress[]> {
      return Object.keys((await channel.state()).trees.contracts) as Encoded.ContractAddress[];
    }
    expect(initiatorNewContract.callCount).to.equal(1);
    expect(initiatorNewContract.firstCall.args).to.eql([result.address]);
    expect(responderNewContract.callCount).to.equal(1);
    expect(responderNewContract.firstCall.args).to.eql([result.address]);
    expect(await getContractAddresses(initiatorCh)).to.eql([result.address]);
    expect(await getContractAddresses(responderCh)).to.eql([result.address]);
    contractAddress = result.address;

    await responderCh.createContract(
      {
        code: await contract.$compile(),
        callData: contract._calldata.encode('Identity', 'init', []),
        deposit: 1e14,
        vmVersion: VmVersion.Fate,
        abiVersion: AbiVersion.Fate,
      },
      responderSign,
    );
    const contracts = await getContractAddresses(initiatorCh);
    expect(contracts.length).to.equal(2);
    expect(await getContractAddresses(responderCh)).to.eql(contracts);
    const secondContract = contracts.filter((c) => c !== result.address);
    expect(initiatorNewContract.callCount).to.equal(2);
    expect(initiatorNewContract.secondCall.args).to.eql(secondContract);
    expect(responderNewContract.callCount).to.equal(2);
    expect(responderNewContract.secondCall.args).to.eql(secondContract);
  });

  it('can create a contract and reject', async () => {
    responderShouldRejectUpdate = true;
    const roundBefore = initiatorCh.round();
    const result = await initiatorCh.createContract(
      {
        code: await contract.$compile(),
        callData: contract._calldata.encode('Identity', 'init', []),
        deposit: 1e14,
        vmVersion: VmVersion.Fate,
        abiVersion: AbiVersion.Fate,
      },
      initiatorSign,
    );
    expect(initiatorCh.round()).to.equal(roundBefore);
    result.should.eql({ ...result, accepted: false });
  });

  it('can abort contract sign request', async () => {
    const errorCode = 12345;
    const result = await initiatorCh.createContract(
      {
        code: await contract.$compile(),
        callData: contract._calldata.encode('Identity', 'init', []),
        deposit: 1e14,
        vmVersion: VmVersion.Fate,
        abiVersion: AbiVersion.Fate,
      },
      async () => Promise.resolve(errorCode),
    );
    result.should.eql({ accepted: false });
  });

  it('can abort contract with custom error code', async () => {
    responderShouldRejectUpdate = 12345;
    const result = await initiatorCh.createContract(
      {
        code: await contract.$compile(),
        callData: contract._calldata.encode('Identity', 'init', []),
        deposit: 1e14,
        vmVersion: VmVersion.Fate,
        abiVersion: AbiVersion.Fate,
      },
      initiatorSign,
    );
    result.should.eql({
      accepted: false,
      errorCode: responderShouldRejectUpdate,
      errorMessage: 'user-defined',
    });
  });

  it('can get balances', async () => {
    const contractAddr = encode(decode(contractAddress), Encoding.AccountAddress);
    const addresses = [initiator.address, responder.address, contractAddr];
    const balances = await initiatorCh.balances(addresses);
    balances.should.be.an('object');
    // TODO: use the same type not depending on value after fixing https://github.com/aeternity/aepp-sdk-js/issues/1926
    balances[initiator.address].should.be.a('number');
    balances[responder.address].should.be.a('number');
    balances[contractAddr].should.be.equal(1000);
    expect(balances).to.eql(await responderCh.balances(addresses));
  });

  it('can call a contract and accept', async () => {
    const roundBefore = initiatorCh.round();
    assertNotNull(roundBefore);
    const result = await initiatorCh.callContract(
      {
        amount: 0,
        callData: contract._calldata.encode('Identity', 'getArg', [42]),
        contract: contractAddress,
        abiVersion: AbiVersion.Fate,
      },
      initiatorSign,
    );
    result.should.eql({ accepted: true, signedTx: await initiatorSignedTx() });
    const round = initiatorCh.round();
    assertNotNull(round);
    expect(round).to.equal(roundBefore + 1);
    callerNonce = round;
  });

  it('can call a force progress', async () => {
    const forceTx = await initiatorCh.forceProgress(
      {
        amount: 0,
        callData: contract._calldata.encode('Identity', 'getArg', [42]),
        contract: contractAddress,
        abiVersion: AbiVersion.Fate,
      },
      initiatorSign,
    );
    const hash = buildTxHash(forceTx.tx);
    const { callInfo } = await aeSdk.api.getTransactionInfoByHash(hash);
    assertNotNull(callInfo);
    expect(callInfo.returnType).to.be.equal('ok');
  });

  it('can call a contract and reject', async () => {
    responderShouldRejectUpdate = true;
    const roundBefore = initiatorCh.round();
    const result = await initiatorCh.callContract(
      {
        amount: 0,
        callData: contract._calldata.encode('Identity', 'getArg', [42]),
        contract: contractAddress,
        abiVersion: AbiVersion.Fate,
      },
      initiatorSign,
    );
    expect(initiatorCh.round()).to.equal(roundBefore);
    result.should.eql({ ...result, accepted: false });
  });

  it('can abort contract call sign request', async () => {
    const errorCode = 12345;
    const result = await initiatorCh.callContract(
      {
        amount: 0,
        callData: contract._calldata.encode('Identity', 'getArg', [42]),
        contract: contractAddress,
        abiVersion: AbiVersion.Fate,
      },
      async () => Promise.resolve(errorCode),
    );
    result.should.eql({ accepted: false });
  });

  it('can abort contract call with custom error code', async () => {
    responderShouldRejectUpdate = 12345;
    const result = await initiatorCh.callContract(
      {
        amount: 0,
        callData: contract._calldata.encode('Identity', 'getArg', [42]),
        contract: contractAddress,
        abiVersion: AbiVersion.Fate,
      },
      initiatorSign,
    );
    result.should.eql({
      accepted: false,
      errorCode: responderShouldRejectUpdate,
      errorMessage: 'user-defined',
    });
  });

  it('can get contract call', async () => {
    const result = await initiatorCh.getContractCall({
      caller: initiator.address,
      contract: contractAddress,
      round: callerNonce,
    });
    result.should.eql({
      callerId: initiator.address,
      callerNonce,
      contractId: contractAddress,
      gasPrice: result.gasPrice,
      gasUsed: result.gasUsed,
      height: result.height,
      log: result.log,
      returnType: 'ok',
      returnValue: result.returnValue,
    });
    expect(result.returnType).to.be.equal('ok');
    expect(
      contract._calldata.decode('Identity', 'getArg', result.returnValue).toString(),
    ).to.be.equal('42');
  });

  it('can call a contract using dry-run', async () => {
    const result = await initiatorCh.callContractStatic({
      amount: 0,
      callData: contract._calldata.encode('Identity', 'getArg', [42]),
      contract: contractAddress,
      abiVersion: AbiVersion.Fate,
    });
    result.should.eql({
      callerId: initiator.address,
      callerNonce: result.callerNonce,
      contractId: contractAddress,
      gasPrice: result.gasPrice,
      gasUsed: result.gasUsed,
      height: result.height,
      log: result.log,
      returnType: 'ok',
      returnValue: result.returnValue,
    });
    expect(result.returnType).to.be.equal('ok');
    expect(
      contract._calldata.decode('Identity', 'getArg', result.returnValue).toString(),
    ).to.be.equal('42');
  });

  it('can clean contract calls', async () => {
    await initiatorCh.cleanContractCalls();
    await initiatorCh.getContractCall({
      caller: initiator.address,
      contract: contractAddress,
      round: callerNonce,
    }).should.eventually.be.rejected;
  });

  it('can get contract state', async () => {
    const result = await initiatorCh.getContractState(contractAddress);
    result.should.eql({
      contract: {
        abiVersion: AbiVersion.Fate,
        active: true,
        deposit: 1000,
        id: contractAddress,
        ownerId: initiator.address,
        referrerIds: [],
        vmVersion: VmVersion.Fate,
      },
      contractState: result.contractState,
    });
    // TODO: contractState deserialization
  });

  it.skip('can post snapshot solo transaction', async () => {
    const snapshotSoloTx = await aeSdk.buildTx({
      tag: Tag.ChannelSnapshotSoloTx,
      channelId: initiatorCh.id(),
      fromId: initiator.address,
      payload: await initiatorSignedTx(),
    });
    // TODO: fix this, error: invalid_at_protocol
    await aeSdk.sendTransaction(snapshotSoloTx, { onAccount: initiator });
  });
});
