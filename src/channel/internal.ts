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
import { EventEmitter } from 'events';
import BigNumber from 'bignumber.js';
import type Channel from '.';
import JsonBig from '../utils/json-big';
import { pascalToSnake } from '../utils/string';
import { Encoded } from '../utils/encoder';
import {
  BaseError, ChannelCallError, ChannelPingTimedOutError, UnknownChannelStateError,
} from '../utils/errors';

interface ChannelAction {
  guard: (channel: Channel, state?: ChannelFsm) => boolean;
  action: (channel: Channel, state?: ChannelFsm) => ChannelFsm;
}

export type SignTxWithTag = (tag: string, tx: Encoded.Transaction, options?: object) => (
  Promise<Encoded.Transaction>
);
// TODO: SignTx shouldn't return number or null
export type SignTx = (tx: Encoded.Transaction, options?: object) => (
  Promise<Encoded.Transaction | number | null>
);

export interface ChannelOptions {
  existingFsmId?: string;
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
  signedTx: any;
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
  jsonrpc: string;
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
export const status = new WeakMap<Channel, string>();
export const state = new WeakMap<Channel, Encoded.Transaction>();
const fsm = new WeakMap<Channel, ChannelFsm>();
const websockets = new WeakMap<Channel, W3CWebSocket>();
export const eventEmitters = new WeakMap<Channel, EventEmitter>();
const messageQueue = new WeakMap<Channel, string[]>();
const messageQueueLocked = new WeakMap<Channel, boolean>();
const actionQueue = new WeakMap<Channel, ChannelAction[]>();
const actionQueueLocked = new WeakMap<Channel, boolean>();
const sequence = new WeakMap<Channel, number>();
export const channelId = new WeakMap<Channel, string>();
const rpcCallbacks = new WeakMap<Channel, Map<number, Function>>();
const pingTimeoutId = new WeakMap<Channel, NodeJS.Timeout>();
const pongTimeoutId = new WeakMap<Channel, NodeJS.Timeout>();
export const fsmId = new WeakMap<Channel, string>();

export function emit(channel: Channel, ...args: any[]): void {
  const [eventName, ...rest] = args;
  eventEmitters.get(channel)?.emit(eventName, ...rest);
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

export function changeStatus(channel: Channel, newStatus: string): void {
  const prevStatus = status.get(channel);
  if (newStatus !== prevStatus) {
    status.set(channel, newStatus);
    emit(channel, 'statusChanged', newStatus);
  }
}

export function changeState(channel: Channel, newState: Encoded.Transaction): void {
  state.set(channel, newState);
  emit(channel, 'stateChanged', newState);
}

export function send(channel: Channel, message: ChannelMessage): void {
  const debug: boolean = options.get(channel)?.debug ?? false;
  if (debug) console.log('Send message: ', message);

  websockets.get(channel)?.send(JsonBig.stringify(message));
}

async function dequeueAction(channel: Channel): Promise<void> {
  const locked = actionQueueLocked.get(channel);
  const queue = actionQueue.get(channel) ?? [];
  if (Boolean(locked) || queue.length === 0) {
    return;
  }
  const singleFsm = fsm.get(channel);
  if (singleFsm == null) return;
  const index = queue.findIndex((action: ChannelAction) => action.guard(channel, singleFsm));
  if (index === -1) {
    return;
  }
  actionQueue.set(channel, queue.filter((_: ChannelAction, i: number) => index !== i));
  actionQueueLocked.set(channel, true);
  const nextState: ChannelFsm = await Promise.resolve(queue[index].action(channel, singleFsm));
  actionQueueLocked.set(channel, false);
  enterState(channel, nextState);
}

export function enqueueAction(
  channel: Channel,
  guard: ChannelAction['guard'],
  action: ChannelAction['action'],
): void {
  const queue = actionQueue.get(channel) ?? [];
  actionQueue.set(channel, [
    ...queue,
    { guard, action },
  ]);
  void dequeueAction(channel);
}

async function handleMessage(channel: Channel, message: string): Promise<void> {
  const fsmState = fsm.get(channel);
  if (fsmState == null) throw new UnknownChannelStateError();
  const { handler, state: st } = fsmState;
  enterState(channel, await Promise.resolve(handler(channel, message, st)));
}

async function dequeueMessage(channel: Channel): Promise<void> {
  const locked: boolean = messageQueueLocked.get(channel) ?? false;
  if (locked) return;
  const messages: string[] = messageQueue.get(channel) ?? [];
  if (messages.length === 0) return;
  messageQueueLocked.set(channel, true);
  while (messages.length > 0) {
    const message: string = messages.shift() ?? '';
    try {
      await handleMessage(channel, message);
    } catch (error) {
      console.error('Error handling incoming message:');
      console.error(message);
      console.error(error);
    }
  }
  messageQueueLocked.set(channel, false);
}

export function disconnect(channel: Channel): void {
  websockets.get(channel)?.close();
  const pingTimeoutIdValue = pingTimeoutId.get(channel);
  const pongTimeoutIdValue = pongTimeoutId.get(channel);
  if (pingTimeoutIdValue != null) clearTimeout(pingTimeoutIdValue);
  if (pongTimeoutIdValue != null) clearTimeout(pongTimeoutIdValue);
}

function ping(channel: Channel): void {
  const pingTimeoutIdValue = pingTimeoutId.get(channel);
  const pongTimeoutIdValue = pongTimeoutId.get(channel);
  if (pingTimeoutIdValue != null) clearTimeout(pingTimeoutIdValue);
  if (pongTimeoutIdValue != null) clearTimeout(pongTimeoutIdValue);
  pingTimeoutId.set(channel, setTimeout(() => {
    send(channel, {
      jsonrpc: '2.0',
      method: 'channels.system',
      params: {
        action: 'ping',
      },
    });
    pongTimeoutId.set(channel, setTimeout(() => {
      disconnect(channel);
      emit(channel, 'error', new ChannelPingTimedOutError());
    }, PONG_TIMEOUT_MS));
  }, PING_TIMEOUT_MS));
}

function onMessage(channel: Channel, data: string): void {
  const message = JsonBig.parse(data);
  const debug: boolean = options.get(channel)?.debug ?? false;
  if (debug) console.log('Receive message: ', message);
  if (message.id != null) {
    const callback = rpcCallbacks.get(channel)?.get(message.id);
    try {
      callback?.(message);
    } finally {
      rpcCallbacks.get(channel)?.delete(message.id);
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
  messageQueue.get(channel)?.push(message);
  void dequeueMessage(channel);
}

export async function call(channel: Channel, method: string, params: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const currentSequence: number = sequence.get(channel) ?? 0;
    const id = sequence.set(channel, currentSequence + 1).get(channel) ?? 1;
    rpcCallbacks.get(channel)?.set(
      id,
      (message: { result: PromiseLike<any>; error?: ChannelMessageError }) => {
        if (message.error != null) {
          const [{ message: details } = { message: '' }] = message.error.data ?? [];
          return reject(new ChannelCallError(message.error.message + details));
        }
        return resolve(message.result);
      },
    );
    send(channel, {
      jsonrpc: '2.0', method, id, params,
    });
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
  eventEmitters.set(channel, new EventEmitter());
  sequence.set(channel, 0);
  rpcCallbacks.set(channel, new Map());
  messageQueue.set(channel, []);

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
        const pingTimeoutIdValue = pingTimeoutId.get(channel);
        const pongTimeoutIdValue = pongTimeoutId.get(channel);
        if (pingTimeoutIdValue != null) clearTimeout(pingTimeoutIdValue);
        if (pongTimeoutIdValue != null) clearTimeout(pongTimeoutIdValue);
      },
      onmessage: ({ data }: { data: string }) => onMessage(channel, data),
    });
  });
  websockets.set(channel, ws);
}
