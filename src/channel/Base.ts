import EventEmitter from 'events';
import { w3cwebsocket as W3CWebSocket } from 'websocket';
import { snakeToPascal } from '../utils/string';
import { buildTx, unpackTx } from '../tx/builder';
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
import { ChannelError } from '../utils/errors';
import { Encoded } from '../utils/encoder';
import { TxUnpacked } from '../tx/builder/schema.generated';

function snakeToPascalObjKeys<Type>(obj: object): Type {
  return Object.entries(obj).reduce((result, [key, val]) => ({
    ...result,
    [snakeToPascal(key)]: val,
  }), {}) as Type;
}

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

  _channelId?: Encoded.Channel;

  /**
   * @param options - Channel params
   * @param options.url - Channel url (for example: "ws://localhost:3001")
   * @param options.role - Participant role ("initiator" or "responder")
   * @param options.initiatorId - Initiator's public key
   * @param options.responderId - Responder's public key
   * @param options.pushAmount - Initial deposit in favour of the responder by the initiator
   * @param options.initiatorAmount - Amount of coins the initiator has committed to
   * the channel
   * @param options.responderAmount - Amount of coins the responder has committed to
   * the channel
   * @param options.channelReserve - The minimum amount both peers need to maintain
   * @param options.ttl - Minimum block height to include the channel_create_tx
   * @param options.host - Host of the responder's node
   * @param options.port - The port of the responders node
   * @param options.lockPeriod - Amount of blocks for disputing a solo close
   * @param options.minimumDepthStrategy - How to calculate minimum depth (default: txfee)
   * @param options.minimumDepth - The minimum amount of blocks to be mined
   * @param options.fee - The fee to be used for the channel open transaction
   * @param options.gasPrice - Used for the fee computation of the channel open transaction
   * @param options.existingChannelId - Existing channel id (required if reestablishing a
   * channel)
   * @param options.offchainTx - Offchain transaction (required if reestablishing
   * a channel)
   * @param options.timeoutIdle - The time waiting for a new event to be initiated
   * (default: 600000)
   * @param options.timeoutFundingCreate - The time waiting for the initiator to produce
   * the create channel transaction after the noise session had been established (default: 120000)
   * @param options.timeoutFundingSign - The time frame the other client has to sign an
   * off-chain update after our client had initiated and signed it. This applies only for double
   * signed on-chain intended updates: channel create transaction, deposit, withdrawal and etc.
   * (default: 120000)
   * @param options.timeoutFundingLock - The time frame the other client has to confirm an
   * on-chain transaction reaching maturity (passing minimum depth) after the local node has
   * detected this. This applies only for double signed on-chain intended updates: channel create
   * transaction, deposit, withdrawal and etc. (default: 360000)
   * @param options.timeoutSign - The time frame the client has to return a signed
   * off-chain update or to decline it. This applies for all off-chain updates (default: 500000)
   * @param options.timeoutAccept - The time frame the other client has to react to an
   * event. This applies for all off-chain updates that are not meant to land on-chain, as well as
   * some special cases: opening a noise connection, mutual closing acknowledgement and
   * reestablishing an existing channel (default: 120000)
   * @param options.timeoutInitialized - the time frame the responder has to accept an
   * incoming noise session. Applicable only for initiator (default: timeout_accept's value)
   * @param options.timeoutAwaitingOpen - The time frame the initiator has to start an
   * outgoing noise session to the responder's node. Applicable only for responder (default:
   * timeout_idle's value)
   * @param options.debug=false - Log websocket communication
   * @param options.sign - Function which verifies and signs transactions
   */
  static async initialize(options: ChannelOptions): Promise<Channel> {
    return Channel._initialize(new Channel(), options);
  }

  static async _initialize<T extends Channel>(channel: T, options: ChannelOptions): Promise<T> {
    await initialize(
      channel,
      options.existingFsmId != null ? handlers.awaitingReconnection : handlers.awaitingConnection,
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
    calls: TxUnpacked & { tag: Tag.CallsMtree };
    halfSignedTx?: TxUnpacked & { tag: Tag.SignedTx };
    signedTx?: TxUnpacked & { tag: Tag.SignedTx };
    trees: TxUnpacked & { tag: Tag.StateTrees };
  }> {
    const res = snakeToPascalObjKeys<{
      calls: Encoded.CallStateTree;
      halfSignedTx: Encoded.Transaction | '';
      signedTx: Encoded.Transaction | '';
      trees: Encoded.StateTrees;
    }>(await call(this, 'channels.get.offchain_state', {}));
    return {
      calls: unpackTx(res.calls, Tag.CallsMtree),
      ...res.halfSignedTx !== '' && { halfSignedTx: unpackTx(res.halfSignedTx, Tag.SignedTx) },
      ...res.signedTx !== '' && { signedTx: unpackTx(res.signedTx, Tag.SignedTx) },
      trees: unpackTx(res.trees, Tag.StateTrees),
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
    return enqueueAction(
      this,
      (channel, state) => state?.handler === handlers.channelOpen,
      action,
    );
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
   * with two extra params: existingChannelId and offchainTx (returned from leave
   * method as channelId and signedTx respectively).
   *
   * @example
   * ```js
   * channel.leave().then(({ channelId, signedTx }) => {
   *   console.log(channelId)
   *   console.log(signedTx)
   * })
   * ```
   */
  async leave(): Promise<{ channelId: Encoded.Bytearray; signedTx: Encoded.Transaction }> {
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

  static async reconnect(options: ChannelOptions, txParams: any): Promise<Channel> {
    const { sign } = options;

    return Channel.initialize({
      ...options,
      reconnectTx: await sign(
        'reconnect',
        buildTx({ ...txParams, tag: Tag.ChannelClientReconnectTx }),
      ),
    });
  }
}
