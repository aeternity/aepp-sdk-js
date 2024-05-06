import {
  describe, it, before, after, beforeEach, afterEach,
} from 'mocha';
import { expect } from 'chai';
import * as sinon from 'sinon';
import BigNumber from 'bignumber.js';
import { getSdk, networkId, channelUrl } from '.';
import {
  unpackTx,
  buildTxHash,
  encode, decode, Encoded, Encoding,
  Tag,
  AbiVersion,
  VmVersion,
  IllegalArgumentError,
  InsufficientBalanceError,
  ChannelConnectionError,
  ChannelIncomingMessageError,
  UnknownChannelStateError,
  AeSdk,
  Contract,
  Channel,
  buildTx,
  MemoryAccount,
} from '../../src';
import { notify, SignTx, SignTxWithTag } from '../../src/channel/internal';
import { appendSignature } from '../../src/channel/handlers';
import { assertNotNull, ensureEqual, ensureInstanceOf } from '../utils';

const contractSourceCode = `
contract Identity =
  entrypoint getArg(x : int) : int = x
`;

async function waitForChannel(channel: Channel): Promise<void> {
  return new Promise((resolve, reject) => {
    channel.on('statusChanged', (status: string) => {
      switch (status) {
        case 'open':
          resolve();
          break;
        case 'disconnected':
          reject(new Error('Unexpected SC status: disconnected'));
          break;
        default:
      }
    });
  });
}

(networkId === 'ae_dev' ? describe : describe.skip)('Channel', () => {
  let aeSdk: AeSdk;
  let initiator: MemoryAccount;
  let responder: MemoryAccount;
  let initiatorCh: Channel;
  let responderCh: Channel;
  let responderShouldRejectUpdate: number | boolean;
  let contractAddress: Encoded.ContractAddress;
  let callerNonce: number;
  let contract: Contract<{}>;
  const initiatorSign = sinon.spy(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async (tx: Encoded.Transaction, o?: Parameters<SignTx>[1]): Promise<Encoded.Transaction> => (
      initiator.signTransaction(tx, { networkId })
    ),
  );
  const responderSign = sinon.spy(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async (tx: Encoded.Transaction, o?: Parameters<SignTx>[1]): Promise<Encoded.Transaction> => (
      responder.signTransaction(tx, { networkId })
    ),
  );
  const initiatorSignTag = sinon.spy<SignTxWithTag>(async (_tag, tx: Encoded.Transaction) => (
    initiatorSign(tx)
  ));
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
  const sharedParams = {
    url: channelUrl,
    pushAmount: 1e13,
    initiatorAmount: 5e14,
    responderAmount: 5e14,
    channelReserve: 0,
    port: 3114,
    lockPeriod: 1,
    initiatorId: 'ak_' as Encoded.AccountAddress,
    responderId: 'ak_' as Encoded.AccountAddress,
    minimumDepth: 0,
  };
  const initiatorParams = {
    role: 'initiator',
    host: 'localhost',
    sign: initiatorSignTag,
  } as const;
  const responderParams = {
    role: 'responder',
    sign: responderSignTag,
  } as const;

  async function recreateAccounts(): Promise<void> {
    initiator = MemoryAccount.generate();
    responder = MemoryAccount.generate();
    await aeSdk.spend(3e15, initiator.address);
    await aeSdk.spend(3e15, responder.address);
    sharedParams.initiatorId = initiator.address;
    sharedParams.responderId = responder.address;
  }

  async function getBalances(): Promise<[string, string]> {
    const [bi, br] = await Promise.all(
      [initiator.address, responder.address].map(async (a) => aeSdk.getBalance(a)),
    );
    return [bi, br];
  }

  before(async () => {
    aeSdk = await getSdk();
    await recreateAccounts();
  });

  after(() => {
    initiatorCh.disconnect();
    responderCh.disconnect();
  });

  beforeEach(() => {
    responderShouldRejectUpdate = false;
  });

  afterEach(() => {
    initiatorSign.resetHistory();
    responderSign.resetHistory();
    initiatorSignTag.resetHistory();
    responderSignTag.resetHistory();
  });

  it('can open a channel', async () => {
    initiatorCh = await Channel.initialize({
      ...sharedParams,
      ...initiatorParams,
    });
    const initiatorChOpenPromise = waitForChannel(initiatorCh);
    responderCh = await Channel.initialize({
      ...sharedParams,
      ...responderParams,
    });
    const responderChOpenPromise = waitForChannel(responderCh);
    await Promise.all([initiatorChOpenPromise, responderChOpenPromise]);
    expect(initiatorCh.round()).to.equal(1);
    expect(responderCh.round()).to.equal(1);

    sinon.assert.calledOnce(initiatorSignTag);
    sinon.assert.calledWithExactly(
      initiatorSignTag,
      'initiator_sign',
      sinon.match.string,
    );
    sinon.assert.calledOnce(responderSignTag);
    sinon.assert.calledWithExactly(
      responderSignTag,
      'responder_sign',
      sinon.match.string,
    );
    const initiatorTx = unpackTx(initiatorSignTag.firstCall.args[1], Tag.ChannelCreateTx);
    const responderTx = unpackTx(responderSignTag.firstCall.args[1], Tag.ChannelCreateTx);
    const expectedParams = {
      channelReserve: '0',
      fee: '17680000000000',
      initiator: initiator.address,
      initiatorAmount: '500000000000000',
      initiatorDelegateIds: [],
      lockPeriod: '1',
      nonce: 1,
      responder: responder.address,
      responderAmount: '500000000000000',
      responderDelegateIds: [],
      stateHash: initiatorTx.stateHash,
      tag: Tag.ChannelCreateTx,
      ttl: 0,
      version: 2,
    };
    expect(initiatorTx).to.eql(expectedParams);
    expect(responderTx).to.eql(expectedParams);
  });

  it('emits error on handling incoming messages', async () => {
    const getError = new Promise<Error>((resolve) => {
      function handler(error: Error): void {
        resolve(error);
        initiatorCh.off('error', handler);
      }
      initiatorCh.on('error', handler);
    });
    notify(initiatorCh, 'not-existing-method');
    const error = await getError;
    ensureInstanceOf(error, ChannelIncomingMessageError);
    expect(error.incomingMessage.error.message).to.be.equal('Method not found');
    expect(() => { throw error.handlerError; })
      .to.throw(UnknownChannelStateError, 'State Channels FSM entered unknown state');
  });

  it('can post update and accept', async () => {
    responderShouldRejectUpdate = false;
    const roundBefore = initiatorCh.round();
    assertNotNull(roundBefore);
    const amount = 1e14;
    const result = await initiatorCh.update(
      initiator.address,
      responder.address,
      amount,
      initiatorSign,
    );
    expect(initiatorCh.round()).to.equal(roundBefore + 1);
    result.accepted.should.equal(true);
    expect(result.signedTx).to.be.a('string');
    sinon.assert.notCalled(initiatorSignTag);
    sinon.assert.calledOnce(responderSignTag);
    sinon.assert.calledWithExactly(
      responderSignTag,
      'update_ack',
      sinon.match.string,
      {
        updates: [{
          amount,
          from: initiator.address,
          to: responder.address,
          op: 'OffChainTransfer',
        }],
      },
    );
    sinon.assert.calledOnce(initiatorSign);
    sinon.assert.calledWithExactly(
      initiatorSign,
      sinon.match.string,
      {
        updates: [{
          amount,
          from: initiator.address,
          to: responder.address,
          op: 'OffChainTransfer',
        }],
      },
    );
    const tx = unpackTx(initiatorSign.firstCall.args[0]);
    ensureEqual<Tag.ChannelOffChainTx>(tx.tag, Tag.ChannelOffChainTx);

    expect(initiatorSign.firstCall.args[1]).to.eql({
      updates: [
        {
          amount,
          from: initiator.address,
          to: responder.address,
          op: 'OffChainTransfer',
        },
      ],
    });
  });

  it('can post update and reject', async () => {
    responderShouldRejectUpdate = true;
    const amount = 1;
    const roundBefore = initiatorCh.round();
    const result = await initiatorCh.update(
      responder.address,
      initiator.address,
      amount,
      initiatorSign,
    );
    result.accepted.should.equal(false);
    expect(initiatorCh.round()).to.equal(roundBefore);
    sinon.assert.notCalled(initiatorSignTag);
    sinon.assert.calledOnce(responderSignTag);
    sinon.assert.calledWithExactly(
      responderSignTag,
      'update_ack',
      sinon.match.string,
      {
        updates: [{
          amount,
          from: responder.address,
          to: initiator.address,
          op: 'OffChainTransfer',
        }],
      },
    );
    sinon.assert.calledOnce(initiatorSign);
    sinon.assert.calledWithExactly(
      initiatorSign,
      sinon.match.string,
      {
        updates: [{
          amount,
          from: responder.address,
          to: initiator.address,
          op: 'OffChainTransfer',
        }],
      },
    );
    const tx = unpackTx(initiatorSign.firstCall.args[0]);
    expect(tx.tag).to.be.equal(Tag.ChannelOffChainTx);
    expect(initiatorSign.firstCall.args[1]).to.eql({
      updates: [
        {
          amount,
          from: responder.address,
          to: initiator.address,
          op: 'OffChainTransfer',
        },
      ],
    });
  });

  it('can abort update sign request', async () => {
    const errorCode = 12345;
    const result = await initiatorCh.update(
      initiator.address,
      responder.address,
      100,
      async () => Promise.resolve(errorCode),
    );
    result.should.eql({ accepted: false });
  });

  it('can abort update with custom error code', async () => {
    responderShouldRejectUpdate = 1234;
    const result = await initiatorCh.update(
      initiator.address,
      responder.address,
      100,
      initiatorSign,
    );
    result.should.eql({
      accepted: false,
      errorCode: responderShouldRejectUpdate,
      errorMessage: 'user-defined',
    });
  });

  it('can post update with metadata', async () => {
    responderShouldRejectUpdate = true;
    const meta = 'meta 1';
    await initiatorCh.update(
      initiator.address,
      responder.address,
      100,
      initiatorSign,
      [meta],
    );
    assertNotNull(initiatorSign.firstCall.args[1]?.updates);
    initiatorSign.firstCall.args[1].updates.should.eql([
      initiatorSign.firstCall.args[1].updates[0],
      { data: meta, op: 'OffChainMeta' },
    ]);
    assertNotNull(responderSignTag.firstCall.args[2]?.updates);
    responderSignTag.firstCall.args[2].updates.should.eql([
      responderSignTag.firstCall.args[2].updates[0],
      { data: meta, op: 'OffChainMeta' },
    ]);
  });

  it('can get proof of inclusion', async () => {
    const params = { accounts: [initiator.address, responder.address] };
    const initiatorPoi = await initiatorCh.poi(params);
    const responderPoi = await responderCh.poi(params);
    expect(initiatorPoi).to.be.eql(responderPoi);
    expect(initiatorPoi.accounts[0].isEqual(responderPoi.accounts[0]))
      .to.be.equal(true);
  });

  it('can send a message', async () => {
    const info = 'hello world';
    initiatorCh.sendMessage(info, responder.address);
    const message = await new Promise((resolve) => {
      responderCh.on('message', resolve);
    });
    expect(message).to.eql({
      channel_id: initiatorCh.id(),
      from: initiator.address,
      to: responder.address,
      info,
    });
  });

  it('can request a withdraw and accept', async () => {
    const amount = 1e14;
    const onOnChainTx = sinon.spy();
    const onOwnWithdrawLocked = sinon.spy();
    const onWithdrawLocked = sinon.spy();
    responderShouldRejectUpdate = false;
    const roundBefore = initiatorCh.round();
    assertNotNull(roundBefore);
    const result = await initiatorCh.withdraw(
      amount,
      initiatorSign,
      { onOnChainTx, onOwnWithdrawLocked, onWithdrawLocked },
    );
    result.should.eql({ accepted: true, signedTx: await initiatorSignedTx() });
    expect(initiatorCh.round()).to.equal(roundBefore + 1);
    sinon.assert.called(onOnChainTx);
    sinon.assert.calledWithExactly(onOnChainTx, sinon.match.string);
    sinon.assert.calledOnce(onOwnWithdrawLocked);
    sinon.assert.calledOnce(onWithdrawLocked);
    sinon.assert.notCalled(initiatorSignTag);
    sinon.assert.calledOnce(responderSignTag);
    sinon.assert.calledWithExactly(
      responderSignTag,
      'withdraw_ack',
      sinon.match.string,
      {
        updates: [{
          amount,
          op: 'OffChainWithdrawal',
          to: initiator.address,
        }],
      },
    );
    sinon.assert.calledOnce(initiatorSign);
    sinon.assert.calledWithExactly(
      initiatorSign,
      sinon.match.string,
      {
        updates: [{
          amount,
          op: 'OffChainWithdrawal',
          to: initiator.address,
        }],
      },
    );
    const tx = unpackTx(initiatorSign.firstCall.args[0]);
    ensureEqual<Tag.ChannelWithdrawTx>(tx.tag, Tag.ChannelWithdrawTx);
    expect(tx.toId).to.be.equal(initiator.address);
    expect(tx.amount).to.be.equal(amount.toString());
  });

  it('can request a withdraw and reject', async () => {
    const amount = 1e14;
    const onOnChainTx = sinon.spy();
    const onOwnWithdrawLocked = sinon.spy();
    const onWithdrawLocked = sinon.spy();
    responderShouldRejectUpdate = true;
    const roundBefore = initiatorCh.round();
    const result = await initiatorCh.withdraw(
      amount,
      initiatorSign,
      { onOnChainTx, onOwnWithdrawLocked, onWithdrawLocked },
    );
    expect(initiatorCh.round()).to.equal(roundBefore);
    result.should.eql({ ...result, accepted: false });
    sinon.assert.notCalled(onOnChainTx);
    sinon.assert.notCalled(onOwnWithdrawLocked);
    sinon.assert.notCalled(onWithdrawLocked);
    sinon.assert.notCalled(initiatorSignTag);
    sinon.assert.calledOnce(responderSignTag);
    sinon.assert.calledWithExactly(
      responderSignTag,
      'withdraw_ack',
      sinon.match.string,
      {
        updates: [{
          amount,
          op: 'OffChainWithdrawal',
          to: initiator.address,
        }],
      },
    );
    sinon.assert.calledOnce(initiatorSign);
    sinon.assert.calledWithExactly(
      initiatorSign,
      sinon.match.string,
      {
        updates: [{
          amount,
          op: 'OffChainWithdrawal',
          to: initiator.address,
        }],
      },
    );
    const tx = unpackTx(initiatorSign.firstCall.args[0]);
    ensureEqual<Tag.ChannelWithdrawTx>(tx.tag, Tag.ChannelWithdrawTx);
    expect(tx.toId).to.be.equal(initiator.address);
    expect(tx.amount).to.be.equal(amount.toString());
  });

  it('can abort withdraw sign request', async () => {
    const errorCode = 12345;
    const result = await initiatorCh.withdraw(
      100,
      async () => Promise.resolve(errorCode),
    );
    result.should.eql({ accepted: false });
  });

  it('can abort withdraw with custom error code', async () => {
    responderShouldRejectUpdate = 12345;
    const result = await initiatorCh.withdraw(
      100,
      initiatorSign,
    );
    result.should.eql({
      accepted: false,
      errorCode: responderShouldRejectUpdate,
      errorMessage: 'user-defined',
    });
  });

  it('can request a deposit and accept', async () => {
    const amount = 1e15;
    const onOnChainTx = sinon.spy();
    const onOwnDepositLocked = sinon.spy();
    const onDepositLocked = sinon.spy();
    responderShouldRejectUpdate = false;
    const roundBefore = initiatorCh.round();
    assertNotNull(roundBefore);
    const result = await initiatorCh.deposit(
      amount,
      initiatorSign,
      { onOnChainTx, onOwnDepositLocked, onDepositLocked },
    );
    result.should.eql({ accepted: true, signedTx: await initiatorSignedTx() });
    expect(initiatorCh.round()).to.equal(roundBefore + 1);
    sinon.assert.called(onOnChainTx);
    sinon.assert.calledWithExactly(onOnChainTx, sinon.match.string);
    sinon.assert.calledOnce(onOwnDepositLocked);
    sinon.assert.calledOnce(onDepositLocked);
    sinon.assert.notCalled(initiatorSignTag);
    sinon.assert.calledOnce(responderSignTag);
    sinon.assert.calledWithExactly(
      responderSignTag,
      'deposit_ack',
      sinon.match.string,
      {
        updates: [{
          amount: amount.toString(),
          op: 'OffChainDeposit',
          from: initiator.address,
        }],
      },
    );
    sinon.assert.calledOnce(initiatorSign);
    sinon.assert.calledWithExactly(
      initiatorSign,
      sinon.match.string,
      {
        updates: [{
          amount: amount.toString(),
          op: 'OffChainDeposit',
          from: initiator.address,
        }],
      },
    );
    const tx = unpackTx(initiatorSign.firstCall.args[0]);
    ensureEqual<Tag.ChannelDepositTx>(tx.tag, Tag.ChannelDepositTx);
    expect(tx.fromId).to.be.equal(initiator.address);
    expect(tx.amount).to.be.equal(amount.toString());
  });

  it('can request a deposit and reject', async () => {
    const amount = 1e15;
    const onOnChainTx = sinon.spy();
    const onOwnDepositLocked = sinon.spy();
    const onDepositLocked = sinon.spy();
    responderShouldRejectUpdate = true;
    const roundBefore = initiatorCh.round();
    const result = await initiatorCh.deposit(
      amount,
      initiatorSign,
      { onOnChainTx, onOwnDepositLocked, onDepositLocked },
    );
    expect(initiatorCh.round()).to.equal(roundBefore);
    result.should.eql({ ...result, accepted: false });
    sinon.assert.notCalled(onOnChainTx);
    sinon.assert.notCalled(onOwnDepositLocked);
    sinon.assert.notCalled(onDepositLocked);
    sinon.assert.notCalled(initiatorSignTag);
    sinon.assert.calledOnce(responderSignTag);
    sinon.assert.calledWithExactly(
      responderSignTag,
      'deposit_ack',
      sinon.match.string,
      {
        updates: [{
          amount: amount.toString(),
          op: 'OffChainDeposit',
          from: initiator.address,
        }],
      },
    );
    const tx = unpackTx(initiatorSign.firstCall.args[0]);
    ensureEqual<Tag.ChannelDepositTx>(tx.tag, Tag.ChannelDepositTx);
    expect(tx.fromId).to.be.equal(initiator.address);
    expect(tx.amount).to.be.equal(amount.toString());
  });

  it('can abort deposit sign request', async () => {
    const errorCode = 12345;
    const result = await initiatorCh.deposit(
      100,
      async () => Promise.resolve(errorCode),
    );
    result.should.eql({ accepted: false });
  });

  it('can abort deposit with custom error code', async () => {
    responderShouldRejectUpdate = 12345;
    const result = await initiatorCh.deposit(
      100,
      initiatorSign,
    );
    result.should.eql({
      accepted: false,
      errorCode: responderShouldRejectUpdate,
      errorMessage: 'user-defined',
    });
  });

  it('can close a channel', async () => {
    const result = await initiatorCh.shutdown(initiatorSign);
    result.should.be.a('string');
    sinon.assert.notCalled(initiatorSignTag);
    sinon.assert.calledOnce(responderSignTag);
    sinon.assert.calledWithExactly(
      responderSignTag,
      'shutdown_sign_ack',
      sinon.match.string,
      sinon.match.any,
    );
    sinon.assert.calledOnce(initiatorSign);
    sinon.assert.calledWithExactly(initiatorSign, sinon.match.string);
    const tx = unpackTx(initiatorSign.firstCall.args[0]);
    ensureEqual<Tag.ChannelCloseMutualTx>(tx.tag, Tag.ChannelCloseMutualTx);
    expect(tx.fromId).to.be.equal(initiator.address);
    // TODO: check `initiatorAmountFinal` and `responderAmountFinal`
  });

  let existingChannelId: Encoded.Channel;
  let offchainTx: Encoded.Transaction;
  it('can leave a channel', async () => {
    initiatorCh.disconnect();
    responderCh.disconnect();
    initiatorCh = await Channel.initialize({
      ...sharedParams,
      ...initiatorParams,
    });
    responderCh = await Channel.initialize({
      ...sharedParams,
      ...responderParams,
    });
    await Promise.all([waitForChannel(initiatorCh), waitForChannel(responderCh)]);
    initiatorCh.round(); // existingChannelRound
    const result = await initiatorCh.leave();
    expect(result.channelId).to.satisfy((t: string) => t.startsWith('ch_'));
    expect(result.signedTx).to.satisfy((t: string) => t.startsWith('tx_'));
    existingChannelId = result.channelId;
    offchainTx = result.signedTx;
  });

  it('can reestablish a channel', async () => {
    initiatorCh = await Channel.initialize({
      ...sharedParams,
      ...initiatorParams,
      port: 3002,
      // @ts-expect-error TODO: use existingChannelId instead existingFsmId
      existingFsmId: existingChannelId,
      offchainTx,
    });
    await waitForChannel(initiatorCh);
    // TODO: why node doesn't return signed_tx when channel is reestablished?
    // initiatorCh.round().should.equal(existingChannelRound)
    sinon.assert.notCalled(initiatorSignTag);
    sinon.assert.notCalled(responderSignTag);
  });

  it('can solo close a channel', async () => {
    initiatorCh.disconnect();
    responderCh.disconnect();
    initiatorCh = await Channel.initialize({
      ...sharedParams,
      ...initiatorParams,
      port: 3003,
    });
    responderCh = await Channel.initialize({
      ...sharedParams,
      ...responderParams,
      port: 3003,
    });
    await Promise.all([waitForChannel(initiatorCh), waitForChannel(responderCh)]);

    const { signedTx } = await initiatorCh.update(
      initiator.address,
      responder.address,
      1e14,
      initiatorSign,
    );
    assertNotNull(signedTx);
    const poi = await initiatorCh.poi({
      accounts: [initiator.address, responder.address],
    });
    const balances = await initiatorCh.balances([initiator.address, responder.address]);
    const [initiatorBalanceBeforeClose, responderBalanceBeforeClose] = await getBalances();
    const closeSoloTx = await aeSdk.buildTx({
      tag: Tag.ChannelCloseSoloTx,
      channelId: await initiatorCh.id(),
      fromId: initiator.address,
      poi,
      payload: signedTx,
    });
    const closeSoloTxFee = unpackTx(closeSoloTx, Tag.ChannelCloseSoloTx).fee;
    await aeSdk.sendTransaction(closeSoloTx, { onAccount: initiator });
    const settleTx = await aeSdk.buildTx({
      tag: Tag.ChannelSettleTx,
      channelId: await initiatorCh.id(),
      fromId: initiator.address,
      initiatorAmountFinal: balances[initiator.address],
      responderAmountFinal: balances[responder.address],
    });
    const settleTxFee = unpackTx(settleTx, Tag.ChannelSettleTx).fee;
    await aeSdk.sendTransaction(settleTx, { onAccount: initiator });
    const [initiatorBalanceAfterClose, responderBalanceAfterClose] = await getBalances();
    new BigNumber(initiatorBalanceAfterClose)
      .minus(initiatorBalanceBeforeClose)
      .plus(closeSoloTxFee)
      .plus(settleTxFee)
      .isEqualTo(balances[initiator.address])
      .should.be.equal(true);
    new BigNumber(responderBalanceAfterClose)
      .minus(responderBalanceBeforeClose)
      .isEqualTo(balances[responder.address])
      .should.be.equal(true);
  });

  it('can dispute via slash tx', async () => {
    initiatorCh.disconnect();
    responderCh.disconnect();
    initiatorCh = await Channel.initialize({
      ...sharedParams,
      ...initiatorParams,
      lockPeriod: 2,
      port: 3004,
    });
    responderCh = await Channel.initialize({
      ...sharedParams,
      ...responderParams,
      lockPeriod: 2,
      port: 3004,
    });
    await Promise.all([waitForChannel(initiatorCh), waitForChannel(responderCh)]);
    const [initiatorBalanceBeforeClose, responderBalanceBeforeClose] = await getBalances();
    const oldUpdate = await initiatorCh
      .update(initiator.address, responder.address, 100, initiatorSign);
    const oldPoi = await initiatorCh.poi({
      accounts: [initiator.address, responder.address],
    });
    const recentUpdate = await initiatorCh
      .update(initiator.address, responder.address, 100, initiatorSign);
    const recentPoi = await responderCh.poi({
      accounts: [initiator.address, responder.address],
    });
    const recentBalances = await responderCh.balances([initiator.address, responder.address]);
    assertNotNull(oldUpdate.signedTx);
    const closeSoloTx = await aeSdk.buildTx({
      tag: Tag.ChannelCloseSoloTx,
      channelId: initiatorCh.id(),
      fromId: initiator.address,
      poi: oldPoi,
      payload: oldUpdate.signedTx,
    });
    const closeSoloTxFee = unpackTx(closeSoloTx, Tag.ChannelCloseSoloTx).fee;
    await aeSdk.sendTransaction(closeSoloTx, { onAccount: initiator });
    assertNotNull(recentUpdate.signedTx);
    const slashTx = await aeSdk.buildTx({
      tag: Tag.ChannelSlashTx,
      channelId: responderCh.id(),
      fromId: responder.address,
      poi: recentPoi,
      payload: recentUpdate.signedTx,
    });
    const slashTxFee = unpackTx(slashTx, Tag.ChannelSlashTx).fee;
    await aeSdk.sendTransaction(slashTx, { onAccount: responder });
    const settleTx = await aeSdk.buildTx({
      tag: Tag.ChannelSettleTx,
      channelId: responderCh.id(),
      fromId: responder.address,
      initiatorAmountFinal: recentBalances[initiator.address],
      responderAmountFinal: recentBalances[responder.address],
    });
    const settleTxFee = unpackTx(settleTx, Tag.ChannelSettleTx).fee;
    await aeSdk.sendTransaction(settleTx, { onAccount: responder });
    const [initiatorBalanceAfterClose, responderBalanceAfterClose] = await getBalances();
    new BigNumber(initiatorBalanceAfterClose)
      .minus(initiatorBalanceBeforeClose)
      .plus(closeSoloTxFee)
      .isEqualTo(recentBalances[initiator.address])
      .should.be.equal(true);
    new BigNumber(responderBalanceAfterClose)
      .minus(responderBalanceBeforeClose)
      .plus(slashTxFee)
      .plus(settleTxFee)
      .isEqualTo(recentBalances[responder.address])
      .should.be.equal(true);
  });

  it('can create a contract and accept', async () => {
    initiatorCh.disconnect();
    responderCh.disconnect();
    initiatorCh = await Channel.initialize({
      ...sharedParams,
      ...initiatorParams,
      port: 3005,
    });
    responderCh = await Channel.initialize({
      ...sharedParams,
      ...responderParams,
      port: 3005,
    });
    await Promise.all([waitForChannel(initiatorCh), waitForChannel(responderCh)]);
    contract = await Contract.initialize({ ...aeSdk.getContext(), sourceCode: contractSourceCode });
    const initiatorNewContract = sinon.spy();
    initiatorCh.on('newContract', initiatorNewContract);
    const responderNewContract = sinon.spy();
    responderCh.on('newContract', responderNewContract);
    const roundBefore = initiatorCh.round();
    assertNotNull(roundBefore);
    const callData = contract._calldata.encode('Identity', 'init', []);
    const result = await initiatorCh.createContract({
      code: await contract.$compile(),
      callData,
      deposit: 1000,
      vmVersion: VmVersion.Fate,
      abiVersion: AbiVersion.Fate,
    }, initiatorSign);
    result.should.eql({
      accepted: true, address: result.address, signedTx: await initiatorSignedTx(),
    });
    expect(initiatorCh.round()).to.equal(roundBefore + 1);
    sinon.assert.calledTwice(responderSignTag);
    sinon.assert.calledWithExactly(
      responderSignTag,
      'update_ack',
      sinon.match.string,
      {
        updates: [{
          abi_version: AbiVersion.Fate,
          call_data: callData,
          code: await contract.$compile(),
          deposit: 1000,
          op: 'OffChainNewContract',
          owner: sinon.match.string,
          vm_version: VmVersion.Fate,
        }],
      },
    );
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

    await responderCh.createContract({
      code: await contract.$compile(),
      callData: contract._calldata.encode('Identity', 'init', []),
      deposit: 1e14,
      vmVersion: VmVersion.Fate,
      abiVersion: AbiVersion.Fate,
    }, responderSign);
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
    const result = await initiatorCh.createContract({
      code: await contract.$compile(),
      callData: contract._calldata.encode('Identity', 'init', []),
      deposit: 1e14,
      vmVersion: VmVersion.Fate,
      abiVersion: AbiVersion.Fate,
    }, initiatorSign);
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
    const result = await initiatorCh.createContract({
      code: await contract.$compile(),
      callData: contract._calldata.encode('Identity', 'init', []),
      deposit: 1e14,
      vmVersion: VmVersion.Fate,
      abiVersion: AbiVersion.Fate,
    }, initiatorSign);
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
    const result = await initiatorCh.callContract({
      amount: 0,
      callData: contract._calldata.encode('Identity', 'getArg', [42]),
      contract: contractAddress,
      abiVersion: AbiVersion.Fate,
    }, initiatorSign);
    result.should.eql({ accepted: true, signedTx: await initiatorSignedTx() });
    const round = initiatorCh.round();
    assertNotNull(round);
    expect(round).to.equal(roundBefore + 1);
    callerNonce = round;
  });

  it('can call a force progress', async () => {
    const forceTx = await initiatorCh.forceProgress({
      amount: 0,
      callData: contract._calldata.encode('Identity', 'getArg', [42]),
      contract: contractAddress,
      abiVersion: AbiVersion.Fate,
    }, initiatorSign);
    const hash = buildTxHash(forceTx.tx);
    const { callInfo } = await aeSdk.api.getTransactionInfoByHash(hash);
    assertNotNull(callInfo);
    expect(callInfo.returnType).to.be.equal('ok');
  });

  it('can call a contract and reject', async () => {
    responderShouldRejectUpdate = true;
    const roundBefore = initiatorCh.round();
    const result = await initiatorCh.callContract({
      amount: 0,
      callData: contract._calldata.encode('Identity', 'getArg', [42]),
      contract: contractAddress,
      abiVersion: AbiVersion.Fate,
    }, initiatorSign);
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
    const result = await initiatorCh.callContract({
      amount: 0,
      callData: contract._calldata.encode('Identity', 'getArg', [42]),
      contract: contractAddress,
      abiVersion: AbiVersion.Fate,
    }, initiatorSign);
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
    expect(contract._calldata.decode('Identity', 'getArg', result.returnValue).toString()).to.be.equal('42');
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
    expect(contract._calldata.decode('Identity', 'getArg', result.returnValue).toString()).to.be.equal('42');
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
  // TODO fix this
  it.skip('can post snapshot solo transaction', async () => {
    const snapshotSoloTx = await aeSdk.buildTx({
      tag: Tag.ChannelSnapshotSoloTx,
      channelId: initiatorCh.id(),
      fromId: initiator.address,
      payload: await initiatorSignedTx(),
    });
    await aeSdk.sendTransaction(snapshotSoloTx, { onAccount: initiator });
  });

  // https://github.com/aeternity/protocol/blob/d634e7a3f3110657900759b183d0734e61e5803a/node/api/channels_api_usage.md#reestablish
  it('can reconnect', async () => {
    initiatorCh.disconnect();
    responderCh.disconnect();
    initiatorCh = await Channel.initialize({
      ...sharedParams,
      ...initiatorParams,
      port: 3006,
    });
    responderCh = await Channel.initialize({
      ...sharedParams,
      ...responderParams,
      port: 3006,
    });
    await Promise.all([waitForChannel(initiatorCh), waitForChannel(responderCh)]);
    const result = await initiatorCh.update(
      initiator.address,
      responder.address,
      100,
      initiatorSign,
    );
    expect(result.accepted).to.equal(true);
    const channelId = await initiatorCh.id();
    const fsmId = initiatorCh.fsmId();
    initiatorCh.disconnect();
    const ch = await Channel.initialize({
      ...sharedParams,
      ...initiatorParams,
      port: 3006,
      existingChannelId: channelId,
      existingFsmId: fsmId,
    });
    await waitForChannel(ch);
    ch.fsmId().should.equal(fsmId);
    const state = await ch.state();
    assertNotNull(state.signedTx);
    expect(state.signedTx.encodedTx.tag).to.be.equal(Tag.ChannelOffChainTx);
  });

  it('can post backchannel update', async () => {
    initiatorCh.disconnect();
    responderCh.disconnect();
    initiatorCh = await Channel.initialize({
      ...sharedParams,
      ...initiatorParams,
      port: 3007,
    });
    responderCh = await Channel.initialize({
      ...sharedParams,
      ...responderParams,
      port: 3007,
    });
    await Promise.all([waitForChannel(initiatorCh), waitForChannel(responderCh)]);
    initiatorCh.disconnect();
    const { accepted } = await responderCh.update(
      initiator.address,
      responder.address,
      100,
      responderSign,
    );
    expect(accepted).to.equal(false);
    const result = await responderCh.update(
      initiator.address,
      responder.address,
      100,
      async (transaction) => (
        appendSignature(await responderSign(transaction), initiatorSign)
      ),
    );
    result.accepted.should.equal(true);
    expect(result.signedTx).to.be.a('string');
    initiatorCh.disconnect();
    initiatorCh.disconnect();
  });

  describe('throws errors', () => {
    before(async () => {
      initiatorCh.disconnect();
      responderCh.disconnect();
      initiatorCh = await Channel.initialize({
        ...sharedParams,
        ...initiatorParams,
        port: 3008,
      });
      responderCh = await Channel.initialize({
        ...sharedParams,
        ...responderParams,
        port: 3008,
      });
      await Promise.all([waitForChannel(initiatorCh), waitForChannel(responderCh)]);
    });

    after(() => {
      initiatorCh.disconnect();
      responderCh.disconnect();
    });

    async function update(
      { from, amount }: {
        from?: Encoded.AccountAddress;
        amount?: number | BigNumber;
      },
    ): Promise<{
        accepted: boolean;
        signedTx?: string;
        errorCode?: number;
        errorMessage?: string;
      }> {
      return initiatorCh.update(
        from ?? initiator.address,
        responder.address,
        amount ?? 1,
        initiatorSign,
      );
    }

    it('when posting an update with negative amount', async () => {
      await update({ amount: -10 }).should.eventually.be.rejectedWith(IllegalArgumentError, 'Amount cannot be negative');
    });

    it('when posting an update with insufficient balance', async () => {
      await update({ amount: 999e18 }).should.eventually.be.rejectedWith(InsufficientBalanceError, 'Insufficient balance');
    });

    it('when posting an update with incorrect address', async () => {
      await update({ from: 'ak_123' }).should.eventually.be.rejectedWith(ChannelConnectionError, 'Rejected');
    });
  });
});
