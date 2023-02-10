import BrowserConnection from './Browser';
import { MESSAGE_DIRECTION } from '../schema';
import { InternalError, RpcConnectionError } from '../../utils/errors';

export type ImplPostMessage = Pick<Window, 'addEventListener' | 'removeEventListener' | 'postMessage'>;

/**
 * Browser window Post Message connector module
 * @category aepp wallet communication
 */
export default class BrowserWindowMessageConnection extends BrowserConnection {
  origin?: string;

  sendDirection?: MESSAGE_DIRECTION;

  receiveDirection: MESSAGE_DIRECTION;

  listener?: (this: Window, ev: MessageEvent<any>) => void;

  #onDisconnect?: () => void;

  #target?: ImplPostMessage;

  #self: ImplPostMessage;

  /**
   * @param options - Options
   * @param options.target Target window for message
   * @param options.self Host window for message
   * @param options.origin Origin of receiver
   * @param options.sendDirection Wrapping messages into additional struct
   * `({ type: 'to_aepp' || 'to_waellet', data })`
   * Used for handling messages between content script and page
   * @param options.receiveDirection Unwrapping messages from additional struct
   */
  constructor({
    target,
    self = window,
    origin,
    sendDirection,
    receiveDirection = MESSAGE_DIRECTION.to_aepp,
    ...options
  }: {
    target?: ImplPostMessage;
    self?: ImplPostMessage;
    origin?: string;
    sendDirection?: MESSAGE_DIRECTION;
    receiveDirection?: MESSAGE_DIRECTION;
    debug?: boolean;
  } = {}) {
    super(options);
    this.#target = target;
    this.#self = self;
    this.origin = origin;
    this.sendDirection = sendDirection;
    this.receiveDirection = receiveDirection;
  }

  isConnected(): boolean {
    return this.listener != null;
  }

  override connect(
    onMessage: (message: any, origin: string, source: MessageEventSource | null) => void,
    onDisconnect: () => void,
  ): void {
    super.connect(onMessage, onDisconnect);
    this.listener = (message: MessageEvent<any>) => {
      // TODO: strict validate origin and source instead of checking message structure
      if (
        typeof message.data !== 'object'
        || (message.data.jsonrpc ?? message.data.data?.jsonrpc) !== '2.0'
      ) return;
      if (this.origin != null && this.origin !== message.origin) return;
      if (this.#target != null && this.#target !== message.source) return;
      this.receiveMessage(message);
      let { data } = message;
      if (data.type != null) {
        if (message.data.type !== this.receiveDirection) return;
        data = data.data;
      }
      onMessage(data, message.origin, message.source);
    };
    this.#self.addEventListener('message', this.listener);
    this.#onDisconnect = onDisconnect;
  }

  override disconnect(): void {
    super.disconnect();
    if (this.listener == null || this.#onDisconnect == null) {
      throw new InternalError('Expected to not happen, required for TS');
    }
    this.#self.removeEventListener('message', this.listener);
    delete this.listener;
    this.#onDisconnect();
    this.#onDisconnect = undefined;
  }

  override sendMessage(msg: any): void {
    if (this.#target == null) throw new RpcConnectionError('Can\'t send messages without target');
    const message = this.sendDirection != null ? { type: this.sendDirection, data: msg } : msg;
    super.sendMessage(message);
    this.#target.postMessage(message, this.origin ?? '*');
  }
}
