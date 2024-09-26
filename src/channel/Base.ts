import EventEmitter from 'events';
import { w3cwebsocket as W3CWebSocket } from 'websocket';
import { snakeToPascal } from '../utils/string';
import { unpackTx } from '../tx/builder';
import { Tag } from '../tx/builder/constants';
import * as handlers from './handlers';
import {
  initialize,
  enqueueAction,
  notify,
  call,
  disconnect as channelDisconnect,
  SignTx,
  ChannelOptions,
  ChannelState,
  ChannelHandler,
  ChannelAction,
  ChannelStatus,
  ChannelFsm,
  ChannelMessage,
  ChannelEvents,
} from './internal';
import { ChannelError, IllegalArgumentError } from '../utils/errors';
import { Encoded } from '../utils/encoder';
import { TxUnpacked } from '../tx/builder/schema.generated';
import { EntryTag } from '../tx/builder/entry/constants';
import { unpackEntry } from '../tx/builder/entry';
import { EntUnpacked } from '../tx/builder/entry/schema.generated';

function snakeToPascalObjKeys<Type>(obj: object): Type {
  return Object.entries(obj).reduce(
    (result, [key, val]) => ({
      ...result,
      [snakeToPascal(key)]: val,
    }),
    {},
  ) as Type;
}

let channelCounter = 0;

/**
 * Channel
 * @example
 * ```js
 * await Channel.initialize({
 *   url: 'ws://localhost:3001',
 *   role: 'initiator'
 *   initiatorId: 'ak_Y1NRjHuoc3CGMYMvCmdHSBpJsMDR6Ra2t5zjhRcbtMeXXLpLH',
 *   responderId: 'ak_V6an1xhec1xVaAhLuak7QoEbi6t7w5hEtYWp9bMKaJ19i6A9E',
 *   initiatorAmount: 1e18,
 *   responderAmount: 1e18,
 *   pushAmount: 0,
 *   channelReserve: 0,
 *   ttl: 1000,
 *   host: 'localhost',
 *   port: 3002,
 *   lockPeriod: 10,
 *   async sign (tag, tx) => await account.signTransaction(tx)
 * })
 * ```
 */
export default class Channel {
  _eventEmitter = new EventEmitter();

  _pingTimeoutId!: NodeJS.Timeout;

  _nextRpcMessageId = 0;

  _rpcCallbacks = new Map<number, (message: object) => void>();

  _fsmId?: Encoded.Bytearray;

  _messageQueue: ChannelMessage[] = [];

  _isMessageQueueLocked = false;

  _actionQueue: ChannelAction[] = [];

  _isActionQueueLocked = false;

  _status: ChannelStatus = 'disconnected';

  _fsm!: ChannelFsm;

  _websocket!: W3CWebSocket;

  _state: Encoded.Transaction | '' = '';

  _options!: ChannelOptions;

  readonly #debugId: number;

  _channelId?: Encoded.Channel;

  protected constructor() {
    channelCounter += 1;
    this.#debugId = channelCounter;
  }

  _debug(...args: any[]): void {
    if (this._options.debug !== true) return;
    console.debug(`Channel #${this.#debugId}`, ...args);
  }

  /**
   * @param options - Channel params
   */
  static async initialize(options: ChannelOptions): Promise<Channel> {
    return Channel._initialize(new Channel(), options);
  }

  static async _initialize<T extends Channel>(channel: T, options: ChannelOptions): Promise<T> {
    const reconnect = (options.existingFsmId ?? options.existingChannelId) != null;
    if (reconnect && (options.existingFsmId == null || options.existingChannelId == null)) {
      throw new IllegalArgumentError(
        '`existingChannelId`, `existingFsmId` should be both provided or missed',
      );
    }
    const reconnectHandler =
      handlers[options.reestablish === true ? 'awaitingReestablish' : 'awaitingReconnection'];
    await initialize(
      channel,
      reconnect ? reconnectHandler : handlers.awaitingConnection,
      handlers.channelOpen,
      options,
    );
    return channel;
  }

  /**
   * Register event listener function
   *
   * Possible events:
   *
   *   - "error"
   *   - "stateChanged"
   *   - "statusChanged"
   *   - "message"
   *   - "peerDisconnected"
   *   - "onChainTx"
   *   - "ownWithdrawLocked"
   *   - "withdrawLocked"
   *   - "ownDepositLocked"
   *   - "depositLocked"
   *   - "channelReestablished"
   *   - "newContract"
   *
   *
   * @param eventName - Event name
   * @param callback - Callback function
   */
  on<E extends keyof ChannelEvents>(eventName: E, callback: ChannelEvents[E]): void {
    this._eventEmitter.on(eventName, callback);
  }

  /**
   * Remove event listener function
   * @param eventName - Event name
   * @param callback - Callback function
   */
  off<E extends keyof ChannelEvents>(eventName: E, callback: ChannelEvents[E]): void {
    this._eventEmitter.removeListener(eventName, callback);
  }

  /**
   * Close the connection
   */
  disconnect(): void {
    return channelDisconnect(this);
  }

  /**
   * Get current status
   */
  status(): ChannelStatus {
    return this._status;
  }

  /**
   * Get current state
   */
  async state(): Promise<{
    calls: EntUnpacked & { tag: EntryTag.CallsMtree };
    halfSignedTx?: TxUnpacked & { tag: Tag.SignedTx };
    signedTx?: TxUnpacked & { tag: Tag.SignedTx };
    trees: EntUnpacked & { tag: EntryTag.StateTrees };
  }> {
    const res = snakeToPascalObjKeys<{
      calls: Encoded.CallStateTree;
      halfSignedTx: Encoded.Transaction | '';
      signedTx: Encoded.Transaction | '';
      trees: Encoded.StateTrees;
    }>(await call(this, 'channels.get.offchain_state', {}));
    return {
      calls: unpackEntry(res.calls),
      ...(res.halfSignedTx !== '' && { halfSignedTx: unpackTx(res.halfSignedTx, Tag.SignedTx) }),
      ...(res.signedTx !== '' && { signedTx: unpackTx(res.signedTx, Tag.SignedTx) }),
      trees: unpackEntry(res.trees),
    };
  }

  /**
   * Get current round
   *
   * If round cannot be determined (for example when channel has not been opened)
   * it will return `null`.
   */
  round(): number | null {
    if (this._state === '') {
      return null;
    }
    const params = unpackTx(this._state, Tag.SignedTx).encodedTx;
    switch (params.tag) {
      case Tag.ChannelCreateTx:
        return 1;
      case Tag.ChannelOffChainTx:
      case Tag.ChannelWithdrawTx:
      case Tag.ChannelDepositTx:
        return params.round;
      default:
        return null;
    }
  }

  /**
   * Get channel id
   *
   */
  id(): Encoded.Channel {
    if (this._channelId == null) throw new ChannelError('Channel is not initialized');
    return this._channelId;
  }

  /**
   * Get channel's fsm id
   *
   */
  fsmId(): Encoded.Bytearray {
    if (this._fsmId == null) throw new ChannelError('Channel is not initialized');
    return this._fsmId;
  }

  protected async enqueueAction(
    action: () => { handler: ChannelHandler; state?: Partial<ChannelState> },
  ): Promise<any> {
    return enqueueAction(this, (channel, state) => state?.handler === handlers.channelOpen, action);
  }

  /**
   * Leave channel
   *
   * It is possible to leave a channel and then later reestablish the channel
   * off-chain state and continue operation. When a leave method is called,
   * the channel fsm passes it on to the peer fsm, reports the current mutually
   * signed state and then terminates.
   *
   * The channel can be reestablished by instantiating another Channel instance
   * with two extra params: existingChannelId and existingFsmId.
   *
   * @example
   * ```js
   * channel.leave().then(({ channelId, signedTx }) => {
   *   console.log(channelId)
   *   console.log(signedTx)
   * })
   * ```
   */
  async leave(): Promise<{ channelId: Encoded.Channel; signedTx: Encoded.Transaction }> {
    return this.enqueueAction(() => {
      notify(this, 'channels.leave');
      return { handler: handlers.awaitingLeave };
    });
  }

  /**
   * Trigger mutual close
   *
   * At any moment after the channel is opened, a closing procedure can be triggered.
   * This can be done by either of the parties. The process is similar to the off-chain updates.
   *
   * @param sign - Function which verifies and signs mutual close transaction
   * @example
   * ```js
   * channel.shutdown(
   *   async (tx) => await account.signTransaction(tx)
   * ).then(tx => console.log('on_chain_tx', tx))
   * ```
   */
  async shutdown(sign: SignTx): Promise<Encoded.Transaction> {
    return this.enqueueAction(() => {
      notify(this, 'channels.shutdown');
      return {
        handler: handlers.awaitingShutdownTx,
        state: { sign },
      };
    });
  }
}
