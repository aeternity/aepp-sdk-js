import { describe, it, before, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import BigNumber from 'bignumber.js';
import { getSdk, networkId, timeoutBlock } from '.';
import { unpackTx, Encoded, Tag, AeSdk, Channel, MemoryAccount } from '../../src';
import { appendSignature } from '../../src/channel/handlers';
import { assertNotNull } from '../utils';
import {
  waitForChannel,
  sharedParams,
  initializeChannels,
  recreateAccounts,
} from './channel-utils';

describe('Channel other', () => {
  let aeSdk: AeSdk;
  let initiator: MemoryAccount;
  let responder: MemoryAccount;
  let initiatorCh: Channel;
  let responderCh: Channel;
  const initiatorSign = async (tx: Encoded.Transaction): Promise<Encoded.Transaction> =>
    initiator.signTransaction(tx, { networkId });
  const responderSign = async (tx: Encoded.Transaction): Promise<Encoded.Transaction> =>
    responder.signTransaction(tx, { networkId });
  const initiatorParams = {
    role: 'initiator',
    host: 'localhost',
    sign: async (_tag: string, tx: Encoded.Transaction) => initiatorSign(tx),
  } as const;
  const responderParams = {
    role: 'responder',
    sign: async (_tag: string, tx: Encoded.Transaction) => responderSign(tx),
  } as const;

  async function getBalances(): Promise<[string, string]> {
    const [bi, br] = await Promise.all(
      [initiator.address, responder.address].map(async (a) => aeSdk.getBalance(a)),
    );
    return [bi, br];
  }

  before(async () => {
    aeSdk = await getSdk(3);
    await Promise.all(
      aeSdk
        .addresses()
        .slice(1)
        .map(async (onAccount) => aeSdk.transferFunds(1, aeSdk.address, { onAccount })),
    );
  });

  beforeEach(async () => {
    [initiator, responder] = await recreateAccounts(aeSdk);
    [initiatorCh, responderCh] = await initializeChannels(initiatorParams, responderParams);
  });

  afterEach(() => {
    initiatorCh.disconnect();
    responderCh.disconnect();
  });

  it('can solo close a channel', async () => {
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
      channelId: initiatorCh.id(),
      fromId: initiator.address,
      poi,
      payload: signedTx,
    });
    const closeSoloTxFee = unpackTx(closeSoloTx, Tag.ChannelCloseSoloTx).fee;
    await aeSdk.sendTransaction(closeSoloTx, { onAccount: initiator });

    const settleTx = await aeSdk.buildTx({
      tag: Tag.ChannelSettleTx,
      channelId: initiatorCh.id(),
      fromId: initiator.address,
      initiatorAmountFinal: balances[initiator.address],
      responderAmountFinal: balances[responder.address],
    });
    const settleTxFee = unpackTx(settleTx, Tag.ChannelSettleTx).fee;
    await aeSdk.sendTransaction(settleTx, { onAccount: initiator });

    const [initiatorBalanceAfterClose, responderBalanceAfterClose] = await getBalances();
    expect(
      new BigNumber(initiatorBalanceAfterClose)
        .minus(initiatorBalanceBeforeClose)
        .plus(closeSoloTxFee)
        .plus(settleTxFee)
        .isEqualTo(balances[initiator.address]),
    ).to.equal(true);
    expect(
      new BigNumber(responderBalanceAfterClose)
        .minus(responderBalanceBeforeClose)
        .isEqualTo(balances[responder.address]),
    ).to.equal(true);
  }).timeout(timeoutBlock);

  it('can dispute via slash tx', async () => {
    const [initiatorBalanceBeforeClose, responderBalanceBeforeClose] = await getBalances();
    const oldUpdate = await initiatorCh.update(
      initiator.address,
      responder.address,
      100,
      initiatorSign,
    );
    const oldPoi = await initiatorCh.poi({
      accounts: [initiator.address, responder.address],
    });
    const recentUpdate = await initiatorCh.update(
      initiator.address,
      responder.address,
      100,
      initiatorSign,
    );
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
    expect(
      new BigNumber(initiatorBalanceAfterClose)
        .minus(initiatorBalanceBeforeClose)
        .plus(closeSoloTxFee)
        .isEqualTo(recentBalances[initiator.address]),
    ).to.equal(true);
    expect(
      new BigNumber(responderBalanceAfterClose)
        .minus(responderBalanceBeforeClose)
        .plus(slashTxFee)
        .plus(settleTxFee)
        .isEqualTo(recentBalances[responder.address]),
    ).to.equal(true);
  }).timeout(timeoutBlock);

  it('can reconnect a channel without leave', async () => {
    expect(initiatorCh.round()).to.equal(1);
    await initiatorCh.update(initiator.address, responder.address, 100, initiatorSign);
    expect(initiatorCh.round()).to.equal(2);
    const channelId = initiatorCh.id();
    const fsmId = initiatorCh.fsmId();
    initiatorCh.disconnect();
    await waitForChannel(initiatorCh, ['disconnected']);
    const ch = await Channel.initialize({
      ...sharedParams,
      ...initiatorParams,
      existingChannelId: channelId,
      existingFsmId: fsmId,
    });
    await waitForChannel(ch, ['open']);
    expect(ch.fsmId()).to.equal(fsmId);
    expect(ch.round()).to.equal(2);
    const state = await ch.state();
    assertNotNull(state.signedTx);
    expect(state.signedTx.encodedTx.tag).to.equal(Tag.ChannelOffChainTx);
    await ch.update(initiator.address, responder.address, 100, initiatorSign);
    expect(ch.round()).to.equal(3);
    ch.disconnect();
  });

  it('can post backchannel update', async () => {
    expect(responderCh.round()).to.equal(1);
    initiatorCh.disconnect();
    const { accepted } = await responderCh.update(
      initiator.address,
      responder.address,
      100,
      responderSign,
    );
    expect(accepted).to.equal(false);
    expect(responderCh.round()).to.equal(1);
    const result = await responderCh.update(
      initiator.address,
      responder.address,
      100,
      async (transaction) => appendSignature(await responderSign(transaction), initiatorSign),
    );
    expect(result.accepted).to.equal(true);
    expect(responderCh.round()).to.equal(2);
    expect(result.signedTx).to.be.a('string');
  });
});
