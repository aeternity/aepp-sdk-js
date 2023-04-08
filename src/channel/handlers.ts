/* eslint-disable consistent-return */
/* eslint-disable default-case */
/* eslint-disable @typescript-eslint/no-use-before-define */
import {
  ChannelState,
  changeStatus,
  changeState,
  notify,
  emit,
  disconnect,
  ChannelMessage,
  ChannelFsm,
  SignTx,
  ChannelStatus,
  ChannelEvents,
} from './internal';
import { unpackTx, buildTx } from '../tx/builder';
import { decode, Encoded } from '../utils/encoder';
import {
  IllegalArgumentError,
  InsufficientBalanceError,
  ChannelConnectionError,
  UnexpectedChannelMessageError,
  ChannelError,
} from '../utils/errors';
import type Channel from './Base';
import { Tag } from '../tx/builder/constants';
import { snakeToPascal } from '../utils/string';

export async function appendSignature(
  tx: Encoded.Transaction,
  signFn: SignTx,
): Promise<Encoded.Transaction | number | null> {
  const { signatures, encodedTx } = unpackTx(tx, Tag.SignedTx);
  const payloadTx = buildTx(encodedTx);
  const result = await signFn(payloadTx);
  if (typeof result === 'string') {
    const { signatures: signatures2 } = unpackTx(result, Tag.SignedTx);
    return buildTx({
      tag: Tag.SignedTx,
      signatures: signatures.concat(signatures2),
      encodedTx: decode(payloadTx),
    });
  }
  return result;
}

export async function signAndNotify(
  channel: Channel,
  method: string,
  data: {
    tx?: Encoded.Transaction;
    signed_tx?: Encoded.Transaction;
  },
  signFn: SignTx,
): Promise<boolean> {
  let signedTx;
  if (data.tx != null) signedTx = await signFn(data.tx);
  else if (data.signed_tx != null) signedTx = await appendSignature(data.signed_tx, signFn);
  else throw new ChannelError('Can\'t find transaction in message');
  const isError = typeof signedTx !== 'string';
  const key = data.tx != null ? 'tx' : 'signed_tx';
  notify(channel, method, isError ? { error: signedTx ?? 1 } : { [key]: signedTx });
  return isError;
}

export function handleUnexpectedMessage(
  _channel: Channel,
  message: ChannelMessage,
  state: ChannelState,
): ChannelFsm {
  state?.reject?.(Object.assign(
    new UnexpectedChannelMessageError(`Unexpected message received:\n\n${JSON.stringify(message)}`),
    { wsMessage: message },
  ));
  return { handler: channelOpen };
}

export function awaitingCompletion(
  channel: Channel,
  message: ChannelMessage,
  state: ChannelState,
  onSuccess?: typeof handleUnexpectedMessage,
): ChannelFsm {
  if (onSuccess != null && message.method === 'channels.update') {
    return onSuccess(channel, message, state);
  }
  if (message.method === 'channels.conflict') {
    state.resolve({
      accepted: false,
      errorCode: message.params.data.error_code,
      errorMessage: message.params.data.error_msg,
    });
    return { handler: channelOpen };
  }
  if (message.method === 'channels.info') {
    if (message.params.data.event === 'aborted_update') {
      state.resolve({ accepted: false });
      return { handler: channelOpen };
    }
  }
  if (message.error != null) {
    const codes = message.error.data.map((d) => d.code);
    if (codes.includes(1001)) {
      state.reject(new InsufficientBalanceError('Insufficient balance'));
    } else if (codes.includes(1002)) {
      state.reject(new IllegalArgumentError('Amount cannot be negative'));
    } else {
      state.reject(new ChannelConnectionError(message.error.message));
    }
    return { handler: channelOpen };
  }
  return handleUnexpectedMessage(channel, message, state);
}

export function awaitingConnection(
  channel: Channel,
  message: ChannelMessage,
): ChannelFsm | undefined {
  if (message.method === 'channels.info') {
    const channelInfoStatus: string = message.params.data.event;

    let nextStatus: ChannelStatus | null = null;
    if (channelInfoStatus === 'channel_accept') nextStatus = 'accepted';
    if (channelInfoStatus === 'funding_created') nextStatus = 'halfSigned';
    if (nextStatus != null) {
      changeStatus(channel, nextStatus);
      return { handler: awaitingChannelCreateTx };
    }

    if (message.params.data.event === 'channel_reestablished') {
      return { handler: awaitingOpenConfirmation };
    }
    if (message.params.data.event === 'fsm_up') {
      channel._fsmId = message.params.data.fsm_id;
      return { handler: awaitingConnection };
    }
    return { handler: awaitingConnection };
  }
  if (message.method === 'channels.error') {
    emit(channel, 'error', new ChannelConnectionError(message?.payload?.message));
    return { handler: channelClosed };
  }
}

export async function awaitingReconnection(
  channel: Channel,
  message: ChannelMessage,
  state: ChannelState,
): Promise<ChannelFsm> {
  if (message.method === 'channels.info') {
    if (message.params.data.event === 'fsm_up') {
      channel._fsmId = message.params.data.fsm_id;
      const { signedTx } = await channel.state();
      changeState(channel, signedTx == null ? '' : buildTx(signedTx));
      return { handler: channelOpen };
    }
  }
  return handleUnexpectedMessage(channel, message, state);
}

export async function awaitingChannelCreateTx(
  channel: Channel,
  message: ChannelMessage,
): Promise<ChannelFsm | undefined> {
  const tag = channel._options.role === 'initiator' ? 'initiator_sign' : 'responder_sign';
  if (message.method === `channels.sign.${tag}`) {
    await signAndNotify(
      channel,
      `channels.${tag}`,
      message.params.data,
      async (tx) => channel._options.sign(tag, tx),
    );
    return { handler: awaitingOnChainTx };
  }
}

export function awaitingOnChainTx(
  channel: Channel,
  message: ChannelMessage,
): ChannelFsm | undefined {
  function awaitingBlockInclusion(_: Channel, message2: ChannelMessage): ChannelFsm | undefined {
    if (message2.method === 'channels.info') {
      switch (message2.params.data.event) {
        case 'funding_created':
        case 'own_funding_locked':
          return { handler: awaitingBlockInclusion };
        case 'funding_locked':
          return { handler: awaitingOpenConfirmation };
      }
    }
    if (message2.method === 'channels.on_chain_tx') {
      emit(channel, 'onChainTx', message2.params.data.tx, {
        info: message2.params.data.info,
        type: message2.params.data.type,
      });
      return { handler: awaitingBlockInclusion };
    }
  }

  if (message.method === 'channels.on_chain_tx') {
    const { info } = message.params.data;
    const { role } = channel._options;
    if ((info === 'funding_signed' && role === 'initiator')
      || (info === 'funding_created' && role === 'responder')) {
      return { handler: awaitingBlockInclusion };
    }
  }
  if (
    message.method === 'channels.info'
    && message.params.data.event === 'funding_signed'
    && channel._options.role === 'initiator'
  ) {
    channel._channelId = message.params.channel_id;
    changeStatus(channel, 'signed');
    return { handler: awaitingOnChainTx };
  }
}

function awaitingOpenConfirmation(
  channel: Channel,
  message: ChannelMessage,
): ChannelFsm | undefined {
  if (message.method === 'channels.info' && message.params.data.event === 'open') {
    channel._channelId = message.params.channel_id;
    return {
      handler(_: Channel, message2: ChannelMessage): ChannelFsm | undefined {
        if (message2.method === 'channels.update') {
          changeState(channel, message2.params.data.state);
          return { handler: channelOpen };
        }
      },
    };
  }
}

export async function channelOpen(
  channel: Channel,
  message: ChannelMessage,
  state: ChannelState,
): Promise<ChannelFsm | undefined> {
  switch (message.method) {
    case 'channels.info':
      switch (message.params.data.event) {
        case 'update':
        case 'withdraw_created':
        case 'deposit_created':
          return { handler: awaitingTxSignRequest };
        case 'own_withdraw_locked':
        case 'withdraw_locked':
        case 'own_deposit_locked':
        case 'deposit_locked':
        case 'peer_disconnected':
        case 'channel_reestablished':
        case 'open':
          // TODO: Better handling of peer_disconnected event.
          //
          //       We should enter intermediate state where offchain transactions
          //       are blocked until channel is reestablished.
          emit(channel, snakeToPascal(message.params.data.event) as keyof ChannelEvents);
          return { handler: channelOpen };
        case 'fsm_up':
          channel._fsmId = message.params.data.fsm_id;
          return { handler: channelOpen };
        case 'timeout':
        case 'close_mutual':
          return { handler: channelOpen };
        case 'closing':
          changeStatus(channel, 'closing');
          return { handler: channelOpen };
        case 'closed_confirmed':
          changeStatus(channel, 'closed');
          return { handler: channelClosed };
        case 'died':
          changeStatus(channel, 'died');
          return { handler: channelClosed };
        case 'shutdown':
          return { handler: channelOpen };
      }
      break;
    case 'channels.on_chain_tx':
      emit(channel, 'onChainTx', message.params.data.tx, {
        info: message.params.data.info,
        type: message.params.data.type,
      });
      return { handler: channelOpen };
    case 'channels.leave':
      // TODO: emit event
      return { handler: channelOpen };
    case 'channels.update':
      changeState(channel, message.params.data.state);
      return { handler: channelOpen };
    case 'channels.sign.shutdown_sign_ack':
      return awaitingTxSignRequest(channel, message, state);
  }
}
channelOpen.enter = (channel: Channel) => {
  changeStatus(channel, 'open');
};

async function awaitingTxSignRequest(
  channel: Channel,
  message: ChannelMessage,
  state: ChannelState,
): Promise<ChannelFsm> {
  const [, tag] = message.method.match(/^channels\.sign\.([^.]+)$/) ?? [];
  if (tag == null) return handleUnexpectedMessage(channel, message, state);
  const isError = await signAndNotify(
    channel,
    `channels.${tag}`,
    message.params.data,
    async (tx) => channel._options.sign(tag, tx, { updates: message.params.data.updates }),
  );

  function awaitingUpdateConflict(_: Channel, message2: ChannelMessage): ChannelFsm {
    if (message2.error != null) {
      return { handler: awaitingUpdateConflict, state };
    }
    if (message2.method === 'channels.conflict') {
      return { handler: channelOpen };
    }
    return handleUnexpectedMessage(channel, message2, state);
  }
  return isError ? { handler: awaitingUpdateConflict, state } : { handler: channelOpen };
}

export async function awaitingShutdownTx(
  channel: Channel,
  message: ChannelMessage,
  state: ChannelState,
): Promise<ChannelFsm> {
  if (message.method !== 'channels.sign.shutdown_sign') {
    return handleUnexpectedMessage(channel, message, state);
  }
  await signAndNotify(
    channel,
    'channels.shutdown_sign',
    message.params.data,
    async (tx) => state.sign(tx),
  );
  return {
    handler(_: Channel, message2: ChannelMessage): ChannelFsm {
      if (message2.method !== 'channels.on_chain_tx') {
        return handleUnexpectedMessage(channel, message2, state);
      }
      // state.resolve(message.params.data.tx)
      return { handler: channelClosed, state };
    },
    state,
  };
}

export function awaitingLeave(
  channel: Channel,
  message: ChannelMessage,
  state: ChannelState,
): ChannelFsm {
  if (message.method === 'channels.leave') {
    state.resolve({ channelId: message.params.channel_id, signedTx: message.params.data.state });
    disconnect(channel);
    return { handler: channelClosed };
  }
  if (message.method === 'channels.error') {
    state.reject(new ChannelConnectionError(message.data.message));
    return { handler: channelOpen };
  }
  return handleUnexpectedMessage(channel, message, state);
}

export function channelClosed(
  _channel: Channel,
  message: ChannelMessage,
  state: ChannelState,
): ChannelFsm {
  if (state == null) return { handler: channelClosed };
  if (message.params.data.event === 'closing') return { handler: channelClosed, state };
  if (message.params.data.info === 'channel_closed') {
    state.closeTx = message.params.data.tx;
    return { handler: channelClosed, state };
  }
  if (message.params.data.event === 'closed_confirmed') {
    state.resolve(state.closeTx);
    return { handler: channelClosed };
  }
  return { handler: channelClosed, state };
}
