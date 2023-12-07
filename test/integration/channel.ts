import {
  describe, it, before, after, beforeEach, afterEach,
} from 'mocha';
import { expect } from 'chai';
import * as sinon from 'sinon';
import BigNumber from 'bignumber.js';
import { getSdk } from '.';
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
import { pause } from '../../src/utils/other';
import {
  ChannelOptions, notify, SignTx, SignTxWithTag,
} from '../../src/channel/internal';
import { appendSignature } from '../../src/channel/handlers';
import { assertNotNull, ensureEqual } from '../utils';

const wsUrl = process.env.TEST_WS_URL ?? 'ws://localhost:3014/channel';

const contractSourceCode = `
contract Identity =
  entrypoint getArg(x : int) : int = x
`;

async function waitForChannel(channel: Channel): Promise<void> {
  return new Promise((resolve) => {
    channel.on('statusChanged', (status: string) => {
      if (status === 'open') {
        resolve();
      }
    });
  });
}

describe('Channel', () => {
  let aeSdkInitiatior: AeSdk;
  let aeSdkResponder: AeSdk;
  let initiatorCh: Channel;
  let responderCh: Channel;
  let responderShouldRejectUpdate: number | boolean;
  let existingChannelId: Encoded.Bytearray;
  let offchainTx: string;
  let contractAddress: Encoded.ContractAddress;
  let callerNonce: number;
  let contract: Contract<{}>;
  const initiatorSign = sinon.spy(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async (tx: Encoded.Transaction, o?: Parameters<SignTx>[1]): Promise<Encoded.Transaction> => (
      aeSdkInitiatior.signTransaction(tx)
    ),
  );
  const responderSign = sinon.spy(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async (tx: Encoded.Transaction, o?: Parameters<SignTx>[1]): Promise<Encoded.Transaction> => (
      aeSdkResponder.signTransaction(tx)
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
  const sharedParams: Omit<ChannelOptions, 'sign'> = {
    url: wsUrl,
    pushAmount: 3,
    initiatorAmount: new BigNumber('100e18'),
    responderAmount: new BigNumber('100e18'),
    channelReserve: 0,
    ttl: 10000,
    host: 'localhost',
    port: 3001,
    lockPeriod: 1,
    statePassword: 'correct horse battery staple',
    debug: false,
    initiatorId: 'ak_',
    responderId: 'ak_',
    role: 'initiator',
  };

  before(async () => {
    aeSdkInitiatior = await getSdk();
    aeSdkResponder = await getSdk(0);
    aeSdkResponder.addAccount(MemoryAccount.generate(), { select: true });
    sharedParams.initiatorId = aeSdkInitiatior.address;
    sharedParams.responderId = aeSdkResponder.address;
    await aeSdkInitiatior.spend(new BigNumber('500e18').toString(), aeSdkResponder.address);
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
      role: 'initiator',
      sign: initiatorSignTag,
    });
    responderCh = await Channel.initialize({
      ...sharedParams,
      role: 'responder',
      sign: responderSignTag,
    });
    await Promise.all([waitForChannel(initiatorCh), waitForChannel(responderCh)]);
    expect(initiatorCh.round()).to.equal(1);
    expect(responderCh.round()).to.equal(1);

    sinon.assert.calledOnce(initiatorSignTag);
    sinon.assert.calledWithExactly(
      initiatorSignTag,
      sinon.match('initiator_sign'),
      sinon.match.string,
    );
    sinon.assert.calledOnce(responderSignTag);
    sinon.assert.calledWithExactly(
      responderSignTag,
      sinon.match('responder_sign'),
      sinon.match.string,
    );
    const expectedTxParams = {
      initiator: aeSdkInitiatior.address,
      responder: aeSdkResponder.address,
      initiatorAmount: sharedParams.initiatorAmount.toString(),
      responderAmount: sharedParams.responderAmount.toString(),
      channelReserve: sharedParams?.channelReserve?.toString(),
      lockPeriod: sharedParams.lockPeriod.toString(),
    };
    const initiatorTx = unpackTx(initiatorSignTag.firstCall.args[1]);
    const responderTx = unpackTx(responderSignTag.firstCall.args[1]);
    expect(initiatorTx.tag).to.be.equal(Tag.ChannelCreateTx);
    initiatorTx.should.eql({ ...initiatorTx, ...expectedTxParams });
    expect(responderTx.tag).to.be.equal(Tag.ChannelCreateTx);
    responderTx.should.eql({ ...responderTx, ...expectedTxParams });
  });

  it('emits error on handling incoming messages', async () => {
    const getError = new Promise<ChannelIncomingMessageError>((resolve) => {
      function handler(error: ChannelIncomingMessageError): void {
        resolve(error);
        initiatorCh.off('error', handler);
      }
      initiatorCh.on('error', handler);
    });
    notify(initiatorCh, 'not-existing-method');
    const error = await getError;
    expect(error.incomingMessage.error.message).to.be.equal('Method not found');
    expect(() => { throw error.handlerError; })
      .to.throw(UnknownChannelStateError, 'State Channels FSM entered unknown state');
  });

  it('can post update and accept', async () => {
    responderShouldRejectUpdate = false;
    const roundBefore = initiatorCh.round();
    assertNotNull(roundBefore);
    const amount = new BigNumber('10e18');
    const result = await initiatorCh.update(
      aeSdkInitiatior.address,
      aeSdkResponder.address,
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
      sinon.match('update_ack'),
      sinon.match.string,
      sinon.match({
        updates: sinon.match([{
          amount: sinon.match(amount.toString()),
          from: sinon.match(aeSdkInitiatior.address),
          to: sinon.match(aeSdkResponder.address),
          op: sinon.match('OffChainTransfer'),
        }]),
      }),
    );
    sinon.assert.calledOnce(initiatorSign);
    sinon.assert.calledWithExactly(
      initiatorSign,
      sinon.match.string,
      sinon.match({
        updates: sinon.match([{
          amount: sinon.match(amount.toString()),
          from: sinon.match(aeSdkInitiatior.address),
          to: sinon.match(aeSdkResponder.address),
          op: sinon.match('OffChainTransfer'),
        }]),
      }),
    );
    const tx = unpackTx(initiatorSign.firstCall.args[0]);
    ensureEqual<Tag.ChannelOffChainTx>(tx.tag, Tag.ChannelOffChainTx);

    expect(initiatorSign.firstCall.args[1]).to.eql({
      updates: [
        {
          amount: amount.toString(),
          from: aeSdkInitiatior.address,
          to: aeSdkResponder.address,
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
      aeSdkResponder.address,
      aeSdkInitiatior.address,
      amount,
      initiatorSign,
    );
    result.accepted.should.equal(false);
    expect(initiatorCh.round()).to.equal(roundBefore);
    sinon.assert.notCalled(initiatorSignTag);
    sinon.assert.calledOnce(responderSignTag);
    sinon.assert.calledWithExactly(
      responderSignTag,
      sinon.match('update_ack'),
      sinon.match.string,
      sinon.match({
        updates: sinon.match([{
          amount: sinon.match(amount),
          from: sinon.match(aeSdkResponder.address),
          to: sinon.match(aeSdkInitiatior.address),
          op: sinon.match('OffChainTransfer'),
        }]),
      }),
    );
    sinon.assert.calledOnce(initiatorSign);
    sinon.assert.calledWithExactly(
      initiatorSign,
      sinon.match.string,
      sinon.match({
        updates: sinon.match([{
          amount: sinon.match(amount),
          from: sinon.match(aeSdkResponder.address),
          to: sinon.match(aeSdkInitiatior.address),
          op: sinon.match('OffChainTransfer'),
        }]),
      }),
    );
    const tx = unpackTx(initiatorSign.firstCall.args[0]);
    expect(tx.tag).to.be.equal(Tag.ChannelOffChainTx);
    expect(initiatorSign.firstCall.args[1]).to.eql({
      updates: [
        {
          amount,
          from: aeSdkResponder.address,
          to: aeSdkInitiatior.address,
          op: 'OffChainTransfer',
        },
      ],
    });
  });

  it('can abort update sign request', async () => {
    const errorCode = 12345;
    const result = await initiatorCh.update(
      aeSdkInitiatior.address,
      aeSdkResponder.address,
      100,
      async () => Promise.resolve(errorCode),
    );
    result.should.eql({ accepted: false });
  });

  it('can abort update with custom error code', async () => {
    responderShouldRejectUpdate = 1234;
    const result = await initiatorCh.update(
      aeSdkInitiatior.address,
      aeSdkResponder.address,
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
      aeSdkInitiatior.address,
      aeSdkResponder.address,
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
    const initiatorAddr = aeSdkInitiatior.address;
    const responderAddr = aeSdkResponder.address;
    const params = { accounts: [initiatorAddr, responderAddr] };
    const initiatorPoi = await initiatorCh.poi(params);
    const responderPoi = await responderCh.poi(params);
    expect(initiatorPoi).to.be.eql(responderPoi);
    expect(initiatorPoi.accounts[0].isEqual(responderPoi.accounts[0]))
      .to.be.equal(true);
  });

  it('can send a message', async () => {
    const sender = aeSdkInitiatior.address;
    const recipient = aeSdkResponder.address;
    const info = 'hello world';
    initiatorCh.sendMessage(info, recipient);
    const message = await new Promise((resolve) => {
      responderCh.on('message', resolve);
    });
    expect(message).to.eql({
      channel_id: initiatorCh.id(),
      from: sender,
      to: recipient,
      info,
    });
  });

  it('can request a withdraw and accept', async () => {
    const amount = new BigNumber('2e18');
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
      sinon.match('withdraw_ack'),
      sinon.match.string,
      sinon.match({
        updates: [{
          amount: amount.toString(),
          op: 'OffChainWithdrawal',
          to: aeSdkInitiatior.address,
        }],
      }),
    );
    sinon.assert.calledOnce(initiatorSign);
    sinon.assert.calledWithExactly(
      initiatorSign,
      sinon.match.string,
      sinon.match({
        updates: [{
          amount: amount.toString(),
          op: 'OffChainWithdrawal',
          to: aeSdkInitiatior.address,
        }],
      }),
    );
    const tx = unpackTx(initiatorSign.firstCall.args[0]);
    ensureEqual<Tag.ChannelWithdrawTx>(tx.tag, Tag.ChannelWithdrawTx);
    expect(tx.toId).to.be.equal(aeSdkInitiatior.address);
    expect(tx.amount).to.be.equal(amount.toString());
  });

  it('can request a withdraw and reject', async () => {
    const amount = new BigNumber('2e18');
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
      sinon.match('withdraw_ack'),
      sinon.match.string,
      sinon.match({
        updates: [{
          amount: amount.toString(),
          op: 'OffChainWithdrawal',
          to: aeSdkInitiatior.address,
        }],
      }),
    );
    sinon.assert.calledOnce(initiatorSign);
    sinon.assert.calledWithExactly(
      initiatorSign,
      sinon.match.string,
      sinon.match({
        updates: [{
          amount: amount.toString(),
          op: 'OffChainWithdrawal',
          to: aeSdkInitiatior.address,
        }],
      }),
    );
    const tx = unpackTx(initiatorSign.firstCall.args[0]);
    ensureEqual<Tag.ChannelWithdrawTx>(tx.tag, Tag.ChannelWithdrawTx);
    expect(tx.toId).to.be.equal(aeSdkInitiatior.address);
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
    const amount = new BigNumber('2e18');
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
      sinon.match('deposit_ack'),
      sinon.match.string,
      sinon.match({
        updates: sinon.match([{
          amount: amount.toString(),
          op: 'OffChainDeposit',
          from: aeSdkInitiatior.address,
        }]),
      }),
    );
    sinon.assert.calledOnce(initiatorSign);
    sinon.assert.calledWithExactly(
      initiatorSign,
      sinon.match.string,
      sinon.match({
        updates: sinon.match([{
          amount: amount.toString(),
          op: 'OffChainDeposit',
          from: aeSdkInitiatior.address,
        }]),
      }),
    );
    const tx = unpackTx(initiatorSign.firstCall.args[0]);
    ensureEqual<Tag.ChannelDepositTx>(tx.tag, Tag.ChannelDepositTx);
    expect(tx.fromId).to.be.equal(aeSdkInitiatior.address);
    expect(tx.amount).to.be.equal(amount.toString());
  });

  it('can request a deposit and reject', async () => {
    const amount = new BigNumber('2e18');
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
      sinon.match('deposit_ack'),
      sinon.match.string,
      sinon.match({
        updates: [{
          amount: amount.toString(),
          op: 'OffChainDeposit',
          from: aeSdkInitiatior.address,
        }],
      }),
    );
    const tx = unpackTx(initiatorSign.firstCall.args[0]);
    ensureEqual<Tag.ChannelDepositTx>(tx.tag, Tag.ChannelDepositTx);
    expect(tx.fromId).to.be.equal(aeSdkInitiatior.address);
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
      sinon.match('shutdown_sign_ack'),
      sinon.match.string,
      sinon.match.any,
    );
    sinon.assert.calledOnce(initiatorSign);
    sinon.assert.calledWithExactly(initiatorSign, sinon.match.string);
    const tx = unpackTx(initiatorSign.firstCall.args[0]);
    ensureEqual<Tag.ChannelCloseMutualTx>(tx.tag, Tag.ChannelCloseMutualTx);
    expect(tx.fromId).to.be.equal(aeSdkInitiatior.address);
    // TODO: check `initiatorAmountFinal` and `responderAmountFinal`
  });

  it('can leave a channel', async () => {
    initiatorCh.disconnect();
    responderCh.disconnect();
    initiatorCh = await Channel.initialize({
      ...sharedParams,
      role: 'initiator',
      sign: initiatorSignTag,
    });
    responderCh = await Channel.initialize({
      ...sharedParams,
      role: 'responder',
      sign: responderSignTag,
    });

    await Promise.all([waitForChannel(initiatorCh), waitForChannel(responderCh)]);
    initiatorCh.round(); // existingChannelRound
    const result = await initiatorCh.leave();
    result.channelId.should.be.a('string');
    result.signedTx.should.be.a('string');
    existingChannelId = result.channelId;
    offchainTx = result.signedTx;
  });

  it('can reestablish a channel', async () => {
    initiatorCh = await Channel.initialize({
      ...sharedParams,
      role: 'initiator',
      port: 3002,
      existingFsmId: existingChannelId,
      offchainTx,
      sign: initiatorSignTag,
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
      role: 'initiator',
      port: 3003,
      sign: initiatorSignTag,
    });
    responderCh = await Channel.initialize({
      ...sharedParams,
      role: 'responder',
      port: 3003,
      sign: responderSignTag,
    });
    await Promise.all([waitForChannel(initiatorCh), waitForChannel(responderCh)]);

    const initiatorAddr = aeSdkInitiatior.address;
    const responderAddr = aeSdkResponder.address;
    const { signedTx } = await initiatorCh.update(
      initiatorAddr,
      responderAddr,
      new BigNumber('3e18'),
      initiatorSign,
    );
    assertNotNull(signedTx);
    const poi = await initiatorCh.poi({
      accounts: [initiatorAddr, responderAddr],
    });
    const balances = await initiatorCh.balances([initiatorAddr, responderAddr]);
    const initiatorBalanceBeforeClose = await aeSdkInitiatior.getBalance(initiatorAddr);
    const responderBalanceBeforeClose = await aeSdkResponder.getBalance(responderAddr);
    const closeSoloTx = await aeSdkInitiatior.buildTx({
      tag: Tag.ChannelCloseSoloTx,
      channelId: await initiatorCh.id(),
      fromId: initiatorAddr,
      poi,
      payload: signedTx,
    });
    const closeSoloTxFee = unpackTx(closeSoloTx, Tag.ChannelCloseSoloTx).fee;
    await aeSdkInitiatior.sendTransaction(closeSoloTx);
    const settleTx = await aeSdkInitiatior.buildTx({
      tag: Tag.ChannelSettleTx,
      channelId: await initiatorCh.id(),
      fromId: initiatorAddr,
      initiatorAmountFinal: balances[initiatorAddr],
      responderAmountFinal: balances[responderAddr],
    });
    const settleTxFee = unpackTx(settleTx, Tag.ChannelSettleTx).fee;
    await aeSdkInitiatior.sendTransaction(settleTx);
    const initiatorBalanceAfterClose = await aeSdkInitiatior.getBalance(initiatorAddr);
    const responderBalanceAfterClose = await aeSdkResponder.getBalance(responderAddr);
    new BigNumber(initiatorBalanceAfterClose)
      .minus(initiatorBalanceBeforeClose)
      .plus(closeSoloTxFee)
      .plus(settleTxFee)
      .isEqualTo(balances[initiatorAddr])
      .should.be.equal(true);
    new BigNumber(responderBalanceAfterClose)
      .minus(responderBalanceBeforeClose)
      .isEqualTo(balances[responderAddr])
      .should.be.equal(true);
  });

  it('can dispute via slash tx', async () => {
    const initiatorAddr = aeSdkInitiatior.address;
    const responderAddr = aeSdkResponder.address;
    initiatorCh.disconnect();
    responderCh.disconnect();
    initiatorCh = await Channel.initialize({
      ...sharedParams,
      lockPeriod: 2,
      role: 'initiator',
      sign: initiatorSignTag,
      port: 3004,
    });
    responderCh = await Channel.initialize({
      ...sharedParams,
      lockPeriod: 2,
      role: 'responder',
      sign: responderSignTag,
      port: 3004,
    });
    await Promise.all([waitForChannel(initiatorCh), waitForChannel(responderCh)]);
    const initiatorBalanceBeforeClose = await aeSdkInitiatior.getBalance(initiatorAddr);
    const responderBalanceBeforeClose = await aeSdkResponder.getBalance(responderAddr);
    const oldUpdate = await initiatorCh.update(initiatorAddr, responderAddr, 100, initiatorSign);
    const oldPoi = await initiatorCh.poi({
      accounts: [initiatorAddr, responderAddr],
    });
    const recentUpdate = await initiatorCh.update(initiatorAddr, responderAddr, 100, initiatorSign);
    const recentPoi = await responderCh.poi({
      accounts: [initiatorAddr, responderAddr],
    });
    const recentBalances = await responderCh.balances([initiatorAddr, responderAddr]);
    assertNotNull(oldUpdate.signedTx);
    const closeSoloTx = await aeSdkInitiatior.buildTx({
      tag: Tag.ChannelCloseSoloTx,
      channelId: initiatorCh.id(),
      fromId: initiatorAddr,
      poi: oldPoi,
      payload: oldUpdate.signedTx,
    });
    const closeSoloTxFee = unpackTx(closeSoloTx, Tag.ChannelCloseSoloTx).fee;
    await aeSdkInitiatior.sendTransaction(closeSoloTx);
    assertNotNull(recentUpdate.signedTx);
    const slashTx = await aeSdkResponder.buildTx({
      tag: Tag.ChannelSlashTx,
      channelId: responderCh.id(),
      fromId: responderAddr,
      poi: recentPoi,
      payload: recentUpdate.signedTx,
    });
    const slashTxFee = unpackTx(slashTx, Tag.ChannelSlashTx).fee;
    await aeSdkResponder.sendTransaction(slashTx);
    const settleTx = await aeSdkResponder.buildTx({
      tag: Tag.ChannelSettleTx,
      channelId: responderCh.id(),
      fromId: responderAddr,
      initiatorAmountFinal: recentBalances[initiatorAddr],
      responderAmountFinal: recentBalances[responderAddr],
    });
    const settleTxFee = unpackTx(settleTx, Tag.ChannelSettleTx).fee;
    await aeSdkResponder.sendTransaction(settleTx);
    const initiatorBalanceAfterClose = await aeSdkInitiatior.getBalance(initiatorAddr);
    const responderBalanceAfterClose = await aeSdkResponder.getBalance(responderAddr);
    new BigNumber(initiatorBalanceAfterClose)
      .minus(initiatorBalanceBeforeClose)
      .plus(closeSoloTxFee)
      .isEqualTo(recentBalances[initiatorAddr])
      .should.be.equal(true);
    new BigNumber(responderBalanceAfterClose)
      .minus(responderBalanceBeforeClose)
      .plus(slashTxFee)
      .plus(settleTxFee)
      .isEqualTo(recentBalances[responderAddr])
      .should.be.equal(true);
  });

  it('can create a contract and accept', async () => {
    initiatorCh.disconnect();
    responderCh.disconnect();
    initiatorCh = await Channel.initialize({
      ...sharedParams,
      role: 'initiator',
      port: 3005,
      sign: initiatorSignTag,
    });
    responderCh = await Channel.initialize({
      ...sharedParams,
      role: 'responder',
      port: 3005,
      sign: responderSignTag,
    });
    await Promise.all([waitForChannel(initiatorCh), waitForChannel(responderCh)]);
    contract = await Contract.initialize({
      ...aeSdkInitiatior.getContext(), sourceCode: contractSourceCode,
    });
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
      sinon.match('update_ack'),
      sinon.match.string,
      sinon.match({
        updates: sinon.match([{
          abi_version: AbiVersion.Fate,
          call_data: callData,
          code: await contract.$compile(),
          deposit: 1000,
          op: 'OffChainNewContract',
          owner: sinon.match.string,
          vm_version: VmVersion.Fate,
        }]),
      }),
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
      deposit: new BigNumber('10e18'),
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
      deposit: new BigNumber('10e18'),
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
        deposit: new BigNumber('10e18'),
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
      deposit: new BigNumber('10e18'),
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
    const addresses = [aeSdkInitiatior.address, aeSdkResponder.address, contractAddr];
    const balances = await initiatorCh.balances(addresses);
    balances.should.be.an('object');
    balances[aeSdkInitiatior.address].should.be.a('string');
    balances[aeSdkResponder.address].should.be.a('string');
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
    const { callInfo } = await aeSdkInitiatior.api.getTransactionInfoByHash(hash);
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
      caller: aeSdkInitiatior.address,
      contract: contractAddress,
      round: callerNonce,
    });
    result.should.eql({
      callerId: aeSdkInitiatior.address,
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
      callerId: aeSdkInitiatior.address,
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
      caller: aeSdkInitiatior.address,
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
        ownerId: aeSdkInitiatior.address,
        referrerIds: [],
        vmVersion: VmVersion.Fate,
      },
      contractState: result.contractState,
    });
    // TODO: contractState deserialization
  });
  // TODO fix this
  it.skip('can post snapshot solo transaction', async () => {
    const snapshotSoloTx = await aeSdkInitiatior.buildTx({
      tag: Tag.ChannelSnapshotSoloTx,
      channelId: initiatorCh.id(),
      fromId: aeSdkInitiatior.address,
      payload: await initiatorSignedTx(),
    });
    await aeSdkInitiatior.sendTransaction(snapshotSoloTx);
  });

  it('can reconnect', async () => {
    initiatorCh.disconnect();
    responderCh.disconnect();
    initiatorCh = await Channel.initialize({
      ...sharedParams,
      role: 'initiator',
      port: 3006,
      sign: initiatorSignTag,
    });

    responderCh = await Channel.initialize({
      ...sharedParams,
      role: 'responder',
      port: 3006,
      sign: responderSignTag,
    });
    await Promise.all([waitForChannel(initiatorCh), waitForChannel(responderCh)]);
    const result = await initiatorCh.update(
      aeSdkInitiatior.address,
      aeSdkResponder.address,
      100,
      initiatorSign,
    );
    expect(result.accepted).to.equal(true);
    const channelId = await initiatorCh.id();
    const fsmId = initiatorCh.fsmId();
    initiatorCh.disconnect();
    const ch = await Channel.initialize({
      ...sharedParams,
      url: sharedParams.url,
      host: sharedParams.host,
      port: 3006,
      role: 'initiator',
      existingChannelId: channelId,
      existingFsmId: fsmId,
      sign: responderSignTag,
    });
    await waitForChannel(ch);
    ch.fsmId().should.equal(fsmId);
    // TODO: why node doesn't return signed_tx when channel is reestablished?
    // await new Promise((resolve) => {
    //   const checkRound = () => {
    //     ch.round().should.equal(round)
    //     // TODO: enable line below
    //     // ch.off('stateChanged', checkRound)
    //     resolve()
    //   }
    //   ch.on('stateChanged', checkRound)
    // })
    await ch.state().should.eventually.be.fulfilled;
    await pause(10 * 1000);
  }).timeout(80000);

  it('can post backchannel update', async () => {
    initiatorCh.disconnect();
    responderCh.disconnect();
    initiatorCh = await Channel.initialize({
      ...sharedParams,
      role: 'initiator',
      port: 3007,
      sign: initiatorSignTag,
    });
    responderCh = await Channel.initialize({
      ...sharedParams,
      role: 'responder',
      port: 3007,
      sign: responderSignTag,
    });
    await Promise.all([waitForChannel(initiatorCh), waitForChannel(responderCh)]);
    initiatorCh.disconnect();
    const { accepted } = await responderCh.update(
      aeSdkInitiatior.address,
      aeSdkResponder.address,
      100,
      responderSign,
    );
    expect(accepted).to.equal(false);
    const result = await responderCh.update(
      aeSdkInitiatior.address,
      aeSdkResponder.address,
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
        role: 'initiator',
        port: 3008,
        sign: initiatorSignTag,
      });
      responderCh = await Channel.initialize({
        ...sharedParams,
        role: 'responder',
        port: 3008,
        sign: responderSignTag,
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
        from ?? aeSdkInitiatior.address,
        aeSdkResponder.address,
        amount ?? 1,
        initiatorSign,
      );
    }

    it('when posting an update with negative amount', async () => {
      await update({ amount: -10 }).should.eventually.be.rejectedWith(IllegalArgumentError, 'Amount cannot be negative');
    });

    it('when posting an update with insufficient balance', async () => {
      await update({ amount: new BigNumber('999e18') }).should.eventually.be.rejectedWith(InsufficientBalanceError, 'Insufficient balance');
    });

    it('when posting an update with incorrect address', async () => {
      await update({ from: 'ak_123' }).should.eventually.be.rejectedWith(ChannelConnectionError, 'Rejected');
    });
  });
});
