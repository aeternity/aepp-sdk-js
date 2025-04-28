import { default as websocket, ICloseEvent } from 'websocket';
import { BigNumber } from 'bignumber.js';
import type Channel from './Base.js';
import JsonBig from '../utils/json-big.js';
import { pascalToSnake } from '../utils/string.js';
import { Encoded } from '../utils/encoder.js';
import {
  BaseError,
  ChannelCallError,
  ChannelPingTimedOutError,
  UnexpectedTsError,
  UnknownChannelStateError,
  ChannelIncomingMessageError,
  ChannelError,
} from '../utils/errors.js';
import { buildContractId } from '../tx/builder/helpers.js';
import { ensureError } from '../utils/other.js';

const { w3cwebsocket: W3CWebSocket } = websocket;

export interface ChannelEvents {
  statusChanged: (status: ChannelStatus) => void;
  stateChanged: (tx: Encoded.Transaction | '') => void;
  depositLocked: () => void;
  ownDepositLocked: () => void;
  withdrawLocked: () => void;
  ownWithdrawLocked: () => void;
  peerDisconnected: () => void;
  channelReestablished: () => void;
  error: (error: Error) => void;
  onChainTx: (tx: Encoded.Transaction, details: { info: string; type: string }) => void;
  message: (message: string | Object) => void;
  newContract: (contractAddress: Encoded.ContractAddress) => void;
}

export interface ChannelAction {
  guard: (channel: Channel, state?: ChannelFsm) => boolean;
  action: (channel: Channel, state?: ChannelFsm) => ChannelFsm;
}

interface SignOptions {
  updates?: any[];
  [k: string]: any;
}
export type SignTxWithTag = (
  tag: string,
  tx: Encoded.Transaction,
  options?: SignOptions,
) => Promise<Encoded.Transaction>;
// TODO: SignTx shouldn't return number or null
export type SignTx = (
  tx: Encoded.Transaction,
  options?: SignOptions,
) => Promise<Encoded.Transaction | number | null>;

/**
 * @see {@link https://github.com/aeternity/protocol/blob/6734de2e4c7cce7e5e626caa8305fb535785131d/node/api/channels_api_usage.md#channel-establishing-parameters}
 */
interface CommonChannelOptions {
  /**
   * Channel url (for example: "ws://localhost:3001")
   */
  url: string;

  /**
   * Initiator's public key
   */
  initiatorId: Encoded.AccountAddress;
  /**
   * Responder's public key
   */
  responderId: Encoded.AccountAddress;
  /**
   * Amount of blocks for disputing a solo close
   */
  lockPeriod: number;
  /**
   * Initial deposit in favour of the responder by the initiator
   */
  pushAmount: BigNumber | number;
  /**
   * Amount of coins the initiator has committed to the channel
   */
  initiatorAmount: BigNumber | number;
  /**
   * Amount of coins the responder has committed to the channel
   */
  responderAmount: BigNumber | number;
  /**
   * The minimum amount both peers need to maintain
   */
  channelReserve?: BigNumber | number;
  /**
   * Minimum block height to include the channel_create_tx
   */
  ttl?: number;
  /**
   * The port of the responder's node
   */
  port: number;
  /**
   * How to calculate minimum depth (default: txfee)
   */
  minimumDepthStrategy?: 'txfee' | 'plain';
  /**
   * The minimum amount of blocks to be mined
   */
  minimumDepth?: number;
  /**
   * The fee to be used for the channel open transaction
   */
  fee?: BigNumber | number;
  /**
   * Used for the fee computation of the channel open transaction
   */
  gasPrice?: BigNumber | number;

  signedTx?: Encoded.Transaction;
  /**
   * Existing channel id (required if reestablishing a channel)
   */
  existingChannelId?: Encoded.Channel;
  /**
   * Existing FSM id (required if reestablishing a channel)
   */
  existingFsmId?: Encoded.Bytearray;
  /**
   * Needs to be provided if reconnecting with calling `leave` before
   */
  // TODO: remove after solving https://github.com/aeternity/aeternity/issues/4399
  reestablish?: boolean;
  /**
   * The time waiting for a new event to be initiated (default: 600000)
   */
  timeoutIdle?: number;
  /**
   * The time waiting for the initiator to produce the create channel transaction after the noise
   * session had been established (default: 120000)
   */
  timeoutFundingCreate?: number;
  /**
   * The time frame the other client has to sign an off-chain update after our client had initiated
   * and signed it. This applies only for double signed on-chain intended updates: channel create
   * transaction, deposit, withdrawal and etc. (default: 120000)
   */
  timeoutFundingSign?: number;
  /**
   * The time frame the other client has to confirm an on-chain transaction reaching maturity
   * (passing minimum depth) after the local node has detected this. This applies only for double
   * signed on-chain intended updates: channel create transaction, deposit, withdrawal and etc.
   * (default: 360000)
   */
  timeoutFundingLock?: number;
  /**
   * The time frame the client has to return a signed off-chain update or to decline it.
   * This applies for all off-chain updates (default: 500000)
   */
  timeoutSign?: number;
  /**
   * The time frame the other client has to react to an event. This applies for all off-chain
   * updates that are not meant to land on-chain, as well as some special cases: opening a noise
   * connection, mutual closing acknowledgement and reestablishing an existing channel
   * (default: 120000)
   */
  timeoutAccept?: number;
  /**
   * the time frame the responder has to accept an incoming noise session.
   * Applicable only for initiator (default: timeout_accept's value)
   */
  timeoutInitialized?: number;
  /**
   * The time frame the initiator has to start an outgoing noise session to the responder's node.
   * Applicable only for responder (default: timeout_idle's value)
   */
  timeoutAwaitingOpen?: number;
  /**
   * Log websocket communication and state changes
   */
  debug?: boolean;
  /**
   * Function which verifies and signs transactions
   */
  sign: SignTxWithTag;
}

export type ChannelOptions = CommonChannelOptions &
  (
    | {
        /**
         * Participant role
         */
        role: 'initiator';
        /**
         * Host of the responder's node
         */
        host: string;
      }
    | {
        /**
         * Participant role
         */
        role: 'responder';
      }
  );

export interface ChannelHandler extends Function {
  enter?: Function;
}

export interface ChannelState {
  signedTx: Encoded.Transaction;
  resolve: (r?: any) => void;
  reject: (e: BaseError) => void;
  sign: SignTx;
  handler?: ChannelHandler;
  /**
   * Called when transaction has been posted on chain
   */
  onOnChainTx?: (tx: Encoded.Transaction) => void;
  onOwnWithdrawLocked?: () => void;
  onWithdrawLocked?: () => void;
  onOwnDepositLocked?: () => void;
  onDepositLocked?: () => void;
  closeTx?: string;
}

export interface ChannelFsm {
  handler: ChannelHandler;
  state?:
    | ChannelState
    | {
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
  data: [
    {
      message: string;
      code: number;
    },
  ];
  request: ChannelMessage;
}

// Send ping message every 10 seconds
const PING_TIMEOUT_MS = 10000;
// Close connection if pong message is not received within 15 seconds
const PONG_TIMEOUT_MS = 15000;

export function emit<E extends keyof ChannelEvents>(
  channel: Channel,
  ...args: [E, ...Parameters<ChannelEvents[E]>]
): void {
  const [eventName, ...rest] = args;
  channel._eventEmitter.emit(eventName, ...rest);
}

function enterState(channel: Channel, nextState: ChannelFsm): void {
  if (nextState == null) {
    throw new UnknownChannelStateError();
  }
  channel._debug('enter state', nextState.handler.name);
  channel._fsm = nextState;
  if (nextState?.handler?.enter != null) {
    nextState.handler.enter(channel);
  }
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  void dequeueAction(channel);
}

// TODO: rewrite to enum
export type ChannelStatus =
  | 'connecting'
  | 'connected'
  | 'accepted'
  | 'halfSigned'
  | 'signed'
  | 'open'
  | 'closing'
  | 'closed'
  | 'died'
  | 'disconnected';

export function changeStatus(channel: Channel, newStatus: ChannelStatus, debug?: unknown): void {
  channel._debug(newStatus, `(prev. ${channel._status})`, debug ?? '');
  if (newStatus === channel._status) return;
  channel._status = newStatus;
  emit(channel, 'statusChanged', newStatus);
}

export function changeState(channel: Channel, newState: Encoded.Transaction | ''): void {
  channel._state = newState;
  emit(channel, 'stateChanged', newState);
}

function send(channel: Channel, message: ChannelMessage): void {
  channel._debug('send message', message.method, message.params);
  channel._websocket.send(JsonBig.stringify({ jsonrpc: '2.0', ...message }));
}

export function notify(channel: Channel, method: string, params: object = {}): void {
  send(channel, { method, params });
}

async function dequeueAction(channel: Channel): Promise<void> {
  if (channel._isActionQueueLocked) return;
  const queue = channel._actionQueue;
  if (queue.length === 0) return;
  const index = queue.findIndex((action) => action.guard(channel, channel._fsm));
  if (index === -1) return;
  channel._actionQueue = queue.filter((_, i) => index !== i);
  channel._isActionQueueLocked = true;
  const nextState: ChannelFsm = await queue[index].action(channel, channel._fsm);
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

async function handleMessage(channel: Channel, message: ChannelMessage): Promise<void> {
  const { handler, state: st } = channel._fsm;
  const nextState = await Promise.resolve(handler(channel, message, st));
  enterState(channel, nextState);
  // TODO: emit message and handler name (?) to move this code to Contract constructor
  if (
    message?.params?.data?.updates?.[0]?.op === 'OffChainNewContract' &&
    // if name is channelOpen, the contract was created by other participant
    nextState?.handler.name === 'channelOpen'
  ) {
    const round = channel.round();
    if (round == null) throw new UnexpectedTsError('Round is null');
    const owner = message?.params?.data?.updates?.[0]?.owner;
    emit(channel, 'newContract', buildContractId(owner, round + 1));
  }
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
      ensureError(error);
      emit(channel, 'error', new ChannelIncomingMessageError(error, message));
    }
  }
  channel._isMessageQueueLocked = false;
}

export function disconnect(channel: Channel): void {
  channel._websocket.close();
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
  channel._debug('received message', message.method, message.params);
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
    if (message.params.channel_id === channel._channelId || channel._channelId == null) {
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
    channel._rpcCallbacks.set(
      id,
      (message: { result: PromiseLike<any>; error?: ChannelMessageError }) => {
        if (message.error != null) {
          const details = message.error.data[0].message ?? '';
          reject(new ChannelCallError(message.error.message + details));
        } else resolve(message.result);
      },
    );
    send(channel, { method, id, params });
  });
}

export async function initialize(
  channel: Channel,
  connectionHandler: Function,
  openHandler: Function,
  { url, ...channelOptions }: ChannelOptions,
): Promise<void> {
  channel._options = { url, ...channelOptions };

  const wsUrl = new URL(url);
  Object.entries(channelOptions)
    .filter(([key]) => !['sign', 'debug'].includes(key))
    .forEach(([key, value]) => wsUrl.searchParams.set(pascalToSnake(key), value.toString()));
  wsUrl.searchParams.set('protocol', 'json-rpc');
  changeStatus(channel, 'connecting');
  channel._websocket = new W3CWebSocket(wsUrl.toString());
  await new Promise<void>((resolve, reject) => {
    Object.assign(channel._websocket, {
      onerror: reject,
      onopen: async (event: Event) => {
        resolve();
        changeStatus(channel, 'connected', event);
        enterState(channel, { handler: connectionHandler });
        ping(channel);
      },
      onclose: (event: ICloseEvent) => {
        changeStatus(channel, 'disconnected', event);
        clearTimeout(channel._pingTimeoutId);
      },
      onmessage: ({ data }: { data: string }) => onMessage(channel, data),
    });
  });
}
