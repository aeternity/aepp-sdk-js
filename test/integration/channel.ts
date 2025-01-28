import { describe, it, before, after, beforeEach, afterEach } from 'mocha';
import { expect, should } from 'chai';
import * as sinon from 'sinon';
import { getSdk, networkId } from '.';
import {
  unpackTx,
  Encoded,
  Tag,
  IllegalArgumentError,
  InsufficientBalanceError,
  ChannelConnectionError,
  ChannelIncomingMessageError,
  UnknownChannelStateError,
  AeSdk,
  Channel,
  buildTx,
  MemoryAccount,
} from '../../src';
import { notify, SignTx, SignTxWithTag } from '../../src/channel/internal';
import { assertNotNull, ensureEqual, ensureInstanceOf } from '../utils';
import {
  waitForChannel,
  sharedParams,
  initializeChannels,
  recreateAccounts,
} from './channel-utils';

should();

describe('Channel', () => {
  let aeSdk: AeSdk;
  let initiator: MemoryAccount;
  let responder: MemoryAccount;
  let initiatorCh: Channel;
  let responderCh: Channel;
  let responderShouldRejectUpdate: number | boolean;
  const initiatorSign = sinon.spy(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async (tx: Encoded.Transaction, o?: Parameters<SignTx>[1]): Promise<Encoded.Transaction> =>
      initiator.signTransaction(tx, { networkId }),
  );
  const responderSign = sinon.spy(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async (tx: Encoded.Transaction, o?: Parameters<SignTx>[1]): Promise<Encoded.Transaction> =>
      responder.signTransaction(tx, { networkId }),
  );
  const initiatorSignTag = sinon.spy<SignTxWithTag>(async (_tag, tx: Encoded.Transaction) =>
    initiatorSign(tx),
  );
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
    sign: initiatorSignTag,
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
    initiatorSign.resetHistory();
    responderSign.resetHistory();
    initiatorSignTag.resetHistory();
    responderSignTag.resetHistory();
  });

  it('can open a channel', async () => {
    [initiatorCh, responderCh] = await initializeChannels(initiatorParams, responderParams);

    expect(initiatorCh.round()).to.equal(1);
    expect(responderCh.round()).to.equal(1);

    sinon.assert.calledOnce(initiatorSignTag);
    sinon.assert.calledWithExactly(initiatorSignTag, 'initiator_sign', sinon.match.string);
    sinon.assert.calledOnce(responderSignTag);
    sinon.assert.calledWithExactly(responderSignTag, 'responder_sign', sinon.match.string);
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
    expect(() => {
      throw error.handlerError;
    }).to.throw(UnknownChannelStateError, 'State Channels FSM entered unknown state');
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
    sinon.assert.calledWithExactly(responderSignTag, 'update_ack', sinon.match.string, {
      updates: [
        {
          amount,
          from: initiator.address,
          to: responder.address,
          op: 'OffChainTransfer',
        },
      ],
    });
    sinon.assert.calledOnce(initiatorSign);
    sinon.assert.calledWithExactly(initiatorSign, sinon.match.string, {
      updates: [
        {
          amount,
          from: initiator.address,
          to: responder.address,
          op: 'OffChainTransfer',
        },
      ],
    });
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
    sinon.assert.calledWithExactly(responderSignTag, 'update_ack', sinon.match.string, {
      updates: [
        {
          amount,
          from: responder.address,
          to: initiator.address,
          op: 'OffChainTransfer',
        },
      ],
    });
    sinon.assert.calledOnce(initiatorSign);
    sinon.assert.calledWithExactly(initiatorSign, sinon.match.string, {
      updates: [
        {
          amount,
          from: responder.address,
          to: initiator.address,
          op: 'OffChainTransfer',
        },
      ],
    });
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
    const result = await initiatorCh.update(initiator.address, responder.address, 100, async () =>
      Promise.resolve(errorCode),
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
    await initiatorCh.update(initiator.address, responder.address, 100, initiatorSign, [meta]);
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
    expect(initiatorPoi.accounts[0].isEqual(responderPoi.accounts[0])).to.be.equal(true);
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
    const result = await initiatorCh.withdraw(amount, initiatorSign, {
      onOnChainTx,
      onOwnWithdrawLocked,
      onWithdrawLocked,
    });
    result.should.eql({ accepted: true, signedTx: await initiatorSignedTx() });
    expect(initiatorCh.round()).to.equal(roundBefore + 1);
    sinon.assert.called(onOnChainTx);
    sinon.assert.calledWithExactly(onOnChainTx, sinon.match.string);
    sinon.assert.calledOnce(onOwnWithdrawLocked);
    sinon.assert.calledOnce(onWithdrawLocked);
    sinon.assert.notCalled(initiatorSignTag);
    sinon.assert.calledOnce(responderSignTag);
    sinon.assert.calledWithExactly(responderSignTag, 'withdraw_ack', sinon.match.string, {
      updates: [
        {
          amount,
          op: 'OffChainWithdrawal',
          to: initiator.address,
        },
      ],
    });
    sinon.assert.calledOnce(initiatorSign);
    sinon.assert.calledWithExactly(initiatorSign, sinon.match.string, {
      updates: [
        {
          amount,
          op: 'OffChainWithdrawal',
          to: initiator.address,
        },
      ],
    });
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
    const result = await initiatorCh.withdraw(amount, initiatorSign, {
      onOnChainTx,
      onOwnWithdrawLocked,
      onWithdrawLocked,
    });
    expect(initiatorCh.round()).to.equal(roundBefore);
    result.should.eql({ ...result, accepted: false });
    sinon.assert.notCalled(onOnChainTx);
    sinon.assert.notCalled(onOwnWithdrawLocked);
    sinon.assert.notCalled(onWithdrawLocked);
    sinon.assert.notCalled(initiatorSignTag);
    sinon.assert.calledOnce(responderSignTag);
    sinon.assert.calledWithExactly(responderSignTag, 'withdraw_ack', sinon.match.string, {
      updates: [
        {
          amount,
          op: 'OffChainWithdrawal',
          to: initiator.address,
        },
      ],
    });
    sinon.assert.calledOnce(initiatorSign);
    sinon.assert.calledWithExactly(initiatorSign, sinon.match.string, {
      updates: [
        {
          amount,
          op: 'OffChainWithdrawal',
          to: initiator.address,
        },
      ],
    });
    const tx = unpackTx(initiatorSign.firstCall.args[0]);
    ensureEqual<Tag.ChannelWithdrawTx>(tx.tag, Tag.ChannelWithdrawTx);
    expect(tx.toId).to.be.equal(initiator.address);
    expect(tx.amount).to.be.equal(amount.toString());
  });

  it('can abort withdraw sign request', async () => {
    const errorCode = 12345;
    const result = await initiatorCh.withdraw(100, async () => Promise.resolve(errorCode));
    result.should.eql({ accepted: false });
  });

  it('can abort withdraw with custom error code', async () => {
    responderShouldRejectUpdate = 12345;
    const result = await initiatorCh.withdraw(100, initiatorSign);
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
    const result = await initiatorCh.deposit(amount, initiatorSign, {
      onOnChainTx,
      onOwnDepositLocked,
      onDepositLocked,
    });
    result.should.eql({ accepted: true, signedTx: await initiatorSignedTx() });
    expect(initiatorCh.round()).to.equal(roundBefore + 1);
    sinon.assert.called(onOnChainTx);
    sinon.assert.calledWithExactly(onOnChainTx, sinon.match.string);
    sinon.assert.calledOnce(onOwnDepositLocked);
    sinon.assert.calledOnce(onDepositLocked);
    sinon.assert.notCalled(initiatorSignTag);
    sinon.assert.calledOnce(responderSignTag);
    sinon.assert.calledWithExactly(responderSignTag, 'deposit_ack', sinon.match.string, {
      updates: [
        {
          amount: amount.toString(),
          op: 'OffChainDeposit',
          from: initiator.address,
        },
      ],
    });
    sinon.assert.calledOnce(initiatorSign);
    sinon.assert.calledWithExactly(initiatorSign, sinon.match.string, {
      updates: [
        {
          amount: amount.toString(),
          op: 'OffChainDeposit',
          from: initiator.address,
        },
      ],
    });
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
    const result = await initiatorCh.deposit(amount, initiatorSign, {
      onOnChainTx,
      onOwnDepositLocked,
      onDepositLocked,
    });
    expect(initiatorCh.round()).to.equal(roundBefore);
    result.should.eql({ ...result, accepted: false });
    sinon.assert.notCalled(onOnChainTx);
    sinon.assert.notCalled(onOwnDepositLocked);
    sinon.assert.notCalled(onDepositLocked);
    sinon.assert.notCalled(initiatorSignTag);
    sinon.assert.calledOnce(responderSignTag);
    sinon.assert.calledWithExactly(responderSignTag, 'deposit_ack', sinon.match.string, {
      updates: [
        {
          amount: amount.toString(),
          op: 'OffChainDeposit',
          from: initiator.address,
        },
      ],
    });
    const tx = unpackTx(initiatorSign.firstCall.args[0]);
    ensureEqual<Tag.ChannelDepositTx>(tx.tag, Tag.ChannelDepositTx);
    expect(tx.fromId).to.be.equal(initiator.address);
    expect(tx.amount).to.be.equal(amount.toString());
  });

  it('can abort deposit sign request', async () => {
    const errorCode = 12345;
    const result = await initiatorCh.deposit(100, async () => Promise.resolve(errorCode));
    result.should.eql({ accepted: false });
  });

  it('can abort deposit with custom error code', async () => {
    responderShouldRejectUpdate = 12345;
    const result = await initiatorCh.deposit(100, initiatorSign);
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

  it('can leave a channel', async () => {
    initiatorCh.disconnect();
    responderCh.disconnect();
    [initiatorCh, responderCh] = await initializeChannels(initiatorParams, responderParams);
    await initiatorCh.update(initiator.address, responder.address, 100, initiatorSign);
    const result = await initiatorCh.leave();
    expect(result.channelId).to.satisfy((t: string) => t.startsWith('ch_'));
    expect(result.signedTx).to.satisfy((t: string) => t.startsWith('tx_'));
  });

  // https://github.com/aeternity/protocol/blob/d634e7a3f3110657900759b183d0734e61e5803a/node/api/channels_api_usage.md#reestablish
  it('can reestablish a channel', async () => {
    expect(initiatorCh.round()).to.be.equal(2);
    initiatorCh = await Channel.initialize({
      ...sharedParams,
      ...initiatorParams,
      reestablish: true,
      existingChannelId: initiatorCh.id(),
      existingFsmId: initiatorCh.fsmId(),
    });
    await waitForChannel(initiatorCh, ['open']);
    expect(initiatorCh.round()).to.be.equal(2);
    sinon.assert.notCalled(initiatorSignTag);
    sinon.assert.notCalled(responderSignTag);
    await initiatorCh.update(initiator.address, responder.address, 100, initiatorSign);
    expect(initiatorCh.round()).to.be.equal(3);
  });

  describe('throws errors', () => {
    before(async () => {
      initiatorCh.disconnect();
      responderCh.disconnect();
      [initiatorCh, responderCh] = await initializeChannels(initiatorParams, responderParams);
    });

    after(() => {
      initiatorCh.disconnect();
      responderCh.disconnect();
    });

    async function update({
      from,
      amount,
    }: {
      from?: Encoded.AccountAddress;
      amount?: number;
    }): ReturnType<typeof initiatorCh.update> {
      return initiatorCh.update(
        from ?? initiator.address,
        responder.address,
        amount ?? 1,
        initiatorSign,
      );
    }

    it('when posting an update with negative amount', async () => {
      await update({ amount: -10 }).should.eventually.be.rejectedWith(
        IllegalArgumentError,
        'Amount cannot be negative',
      );
    });

    it('when posting an update with insufficient balance', async () => {
      await update({ amount: 999e18 }).should.eventually.be.rejectedWith(
        InsufficientBalanceError,
        'Insufficient balance',
      );
    });

    it('when posting an update with incorrect address', async () => {
      await update({ from: 'ak_123' }).should.eventually.be.rejectedWith(
        ChannelConnectionError,
        'Rejected',
      );
    });
  });
});
