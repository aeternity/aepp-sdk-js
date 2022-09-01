/*
 * ISC License (ISC)
 * Copyright (c) 2018 aeternity developers
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

import { w3cwebsocket as W3CWebSocket } from 'websocket';
import BigNumber from 'bignumber.js';
import type Channel from '.';
import JsonBig from '../utils/json-big';
import { pascalToSnake } from '../utils/string';
import { Encoded } from '../utils/encoder';
import {
  BaseError,
  ChannelCallError,
  ChannelPingTimedOutError,
  UnexpectedTsError,
  UnknownChannelStateError,
  ChannelIncomingMessageError,
  ChannelError,
} from '../utils/errors';

export interface ChannelAction {
  guard: (channel: Channel, state?: ChannelFsm) => boolean;
  action: (channel: Channel, state?: ChannelFsm) => ChannelFsm;
}

interface SignOptions {
  updates?: any[];
  [k: string]: any;
}
export type SignTxWithTag = (tag: string, tx: Encoded.Transaction, options?: SignOptions) => (
  Promise<Encoded.Transaction>
);
// TODO: SignTx shouldn't return number or null
export type SignTx = (tx: Encoded.Transaction, options?: SignOptions) => (
  Promise<Encoded.Transaction | number | null>
);

export interface ChannelOptions {
  existingFsmId?: Encoded.Bytearray;
  url: string;
  role: 'initiator' | 'responder';
  initiatorId: Encoded.AccountAddress;
  responderId: Encoded.AccountAddress;
  pushAmount: number;
  initiatorAmount: BigNumber;
  responderAmount: BigNumber;
  channelReserve?: BigNumber | number;
  signedTx?: string;
  ttl?: number;
  host: string;
  port: number;
  lockPeriod: number;
  existingChannelId?: string;
  offChainTx?: string;
  reconnectTx?: string;
  timeoutIdle?: number;
  timeoutFundingCreate?: number;
  timeoutFundingSign?: number;
  timeoutFundingLock?: number;
  timeoutSign?: number;
  timeoutAccept?: number;
  timeoutInitialized?: number;
  timeoutAwaitingOpen?: number;
  statePassword?: string;
  debug: boolean;
  sign: SignTxWithTag;
  offchainTx?: string;
}

export interface ChannelHandler extends Function {
  enter?: Function;
}

export interface ChannelState {
  signedTx: Encoded.Transaction;
  resolve: (r?: any) => void;
  reject: (e: BaseError) => void;
  sign: SignTx;
  handler?: ChannelHandler;
  onOnChainTx?: (tx: Encoded.Transaction) => void;
  onOwnWithdrawLocked?: () => void;
  onWithdrawLocked?: () => void;
  onOwnDepositLocked?: () => void;
  onDepositLocked?: () => void;
  closeTx?: string;
}

export interface ChannelFsm {
  handler: ChannelHandler;
  state?: ChannelState | {
    resolve: Function;
    reject: Function;
  };
}

export interface ChannelMessage {
  id?: number;
  method: string;
  params: any;
  payload?: any;
  data?: any;
  error?: ChannelMessageError;
}

interface ChannelMessageError {
  code: number;
  message: string;
  data: [{
    message: string;
    code: number;
  }];
  request: ChannelMessage;
}

// Send ping message every 10 seconds
const PING_TIMEOUT_MS = 10000;
// Close connection if pong message is not received within 5 seconds
const PONG_TIMEOUT_MS = 5000;

// TODO: move to Channel instance to avoid is-null checks and for easier debugging
export const options = new WeakMap<Channel, ChannelOptions>();
export const state = new WeakMap<Channel, Encoded.Transaction>();
const fsm = new WeakMap<Channel, ChannelFsm>();
const websockets = new WeakMap<Channel, W3CWebSocket>();
export const channelId = new WeakMap<Channel, Encoded.Channel>();

export function emit(channel: Channel, ...args: any[]): void {
  const [eventName, ...rest] = args;
  channel._eventEmitter.emit(eventName, ...rest);
}

function enterState(channel: Channel, nextState: ChannelFsm): void {
  if (nextState == null) {
    throw new UnknownChannelStateError();
  }
  fsm.set(channel, nextState);
  if (nextState?.handler?.enter != null) {
    nextState.handler.enter(channel);
  }
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  void dequeueAction(channel);
}

// TODO: rewrite to enum
export type ChannelStatus = 'connecting' | 'connected' | 'accepted' | 'halfSigned' | 'signed'
| 'open' | 'closing' | 'closed' | 'died' | 'disconnected';

export function changeStatus(channel: Channel, newStatus: ChannelStatus): void {
  if (newStatus === channel._status) return;
  channel._status = newStatus;
  emit(channel, 'statusChanged', newStatus);
}

export function changeState(channel: Channel, newState: Encoded.Transaction): void {
  state.set(channel, newState);
  emit(channel, 'stateChanged', newState);
}

function send(channel: Channel, message: ChannelMessage): void {
  const debug: boolean = options.get(channel)?.debug ?? false;
  if (debug) console.log('Send message: ', message);

  const websocket = websockets.get(channel);
  if (websocket == null) throw new UnexpectedTsError();
  websocket.send(JsonBig.stringify({ jsonrpc: '2.0', ...message }));
}

export function notify(channel: Channel, method: string, params: object = {}): void {
  send(channel, { method, params });
}

async function dequeueAction(channel: Channel): Promise<void> {
  if (channel._isActionQueueLocked) return;
  const queue = channel._actionQueue;
  if (queue.length === 0) return;
  const singleFsm = fsm.get(channel);
  if (singleFsm == null) return;
  const index = queue.findIndex((action) => action.guard(channel, singleFsm));
  if (index === -1) return;
  channel._actionQueue = queue.filter((_, i) => index !== i);
  channel._isActionQueueLocked = true;
  const nextState: ChannelFsm = await queue[index].action(channel, singleFsm);
  channel._isActionQueueLocked = false;
  enterState(channel, nextState);
}

export async function enqueueAction(
  channel: Channel,
  guard: ChannelAction['guard'],
  action: () => { handler: ChannelHandler; state?: Partial<ChannelState> },
): Promise<any> {
  const promise = new Promise((resolve, reject) => {
    channel._actionQueue.push({
      guard,
      action() {
        const res = action();
        return { ...res, state: { ...res.state, resolve, reject } };
      },
    });
  });
  void dequeueAction(channel);
  return promise;
}

async function handleMessage(channel: Channel, message: object): Promise<void> {
  const fsmState = fsm.get(channel);
  if (fsmState == null) throw new UnknownChannelStateError();
  const { handler, state: st } = fsmState;
  enterState(channel, await Promise.resolve(handler(channel, message, st)));
}

async function dequeueMessage(channel: Channel): Promise<void> {
  if (channel._isMessageQueueLocked) return;
  channel._isMessageQueueLocked = true;
  while (channel._messageQueue.length > 0) {
    const message = channel._messageQueue.shift();
    if (message == null) throw new UnexpectedTsError();
    try {
      await handleMessage(channel, message);
    } catch (error) {
      emit(channel, 'error', new ChannelIncomingMessageError(error, message));
    }
  }
  channel._isMessageQueueLocked = false;
}

export function disconnect(channel: Channel): void {
  websockets.get(channel)?.close();
  clearTimeout(channel._pingTimeoutId);
}

function ping(channel: Channel): void {
  clearTimeout(channel._pingTimeoutId);
  channel._pingTimeoutId = setTimeout(() => {
    notify(channel, 'channels.system', { action: 'ping' });
    channel._pingTimeoutId = setTimeout(() => {
      disconnect(channel);
      emit(channel, 'error', new ChannelPingTimedOutError());
    }, PONG_TIMEOUT_MS);
  }, PING_TIMEOUT_MS);
}

function onMessage(channel: Channel, data: string): void {
  const message = JsonBig.parse(data);
  const debug: boolean = options.get(channel)?.debug ?? false;
  if (debug) console.log('Receive message: ', message);
  if (message.id != null) {
    const callback = channel._rpcCallbacks.get(message.id);
    if (callback == null) {
      emit(channel, 'error', new ChannelError(`Can't find callback by id: ${message.id}`));
      return;
    }
    try {
      callback(message);
    } finally {
      channel._rpcCallbacks.delete(message.id);
    }
    return;
  }
  if (message.method === 'channels.message') {
    emit(channel, 'message', message.params.data.message);
    return;
  }
  if (message.method === 'channels.system.pong') {
    if (
      (message.params.channel_id === channelId.get(channel))
      // Skip channelId check if channelId is not known yet
      || (channelId.get(channel) == null)
    ) {
      ping(channel);
    }
    return;
  }
  channel._messageQueue.push(message);
  void dequeueMessage(channel);
}

export async function call(channel: Channel, method: string, params: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const id = channel._nextRpcMessageId;
    channel._nextRpcMessageId += 1;
    channel._rpcCallbacks.set(id, (
      message: { result: PromiseLike<any>; error?: ChannelMessageError },
    ) => {
      if (message.error != null) {
        const details = message.error.data[0].message ?? '';
        reject(new ChannelCallError(message.error.message + details));
      } else resolve(message.result);
    });
    send(channel, { method, id, params });
  });
}

export async function initialize(
  channel: Channel,
  connectionHandler: Function,
  openHandler: Function,
  { url, ...channelOptions }: ChannelOptions,
): Promise<void> {
  options.set(channel, { url, ...channelOptions });
  fsm.set(channel, { handler: connectionHandler });

  const wsUrl = new URL(url);
  Object.entries(channelOptions)
    .filter(([key]) => !['sign', 'debug'].includes(key))
    .forEach(([key, value]) => wsUrl.searchParams.set(pascalToSnake(key), value));
  wsUrl.searchParams.set('protocol', 'json-rpc');
  changeStatus(channel, 'connecting');
  const ws = new W3CWebSocket(wsUrl.toString());
  await new Promise<void>((resolve, reject) => {
    Object.assign(ws, {
      onerror: reject,
      onopen: async () => {
        resolve();
        changeStatus(channel, 'connected');
        if (channelOptions.reconnectTx != null) {
          enterState(channel, { handler: openHandler });
          const signedTx = (await call(channel, 'channels.get.offchain_state', {})).signed_tx;
          changeState(channel, signedTx);
        }
        ping(channel);
      },
      onclose: () => {
        changeStatus(channel, 'disconnected');
        clearTimeout(channel._pingTimeoutId);
      },
      onmessage: ({ data }: { data: string }) => onMessage(channel, data),
    });
  });
  websockets.set(channel, ws);
}
