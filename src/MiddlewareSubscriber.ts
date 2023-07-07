/* eslint-disable max-classes-per-file */
import WebSocket from 'isomorphic-ws';
import { BaseError, UnexpectedTsError, InternalError } from './utils/errors';
import { Encoded } from './utils/encoder';

interface Message {
  payload: Object;
  source: Source.Middleware | Source.Node;
  subscription: 'KeyBlocks' | 'MicroBlocks' | 'Transactions' | 'Object';
  target?: string;
}

enum Source {
  Middleware = 'mdw',
  Node = 'node',
  All = 'all',
}

export class MiddlewareSubscriberError extends BaseError {
  constructor(message: string) {
    super(message);
    this.name = 'MiddlewareSubscriberError';
  }
}

export class MiddlewareSubscriberDisconnected extends MiddlewareSubscriberError {
  constructor(readonly closeEvent: WebSocket.CloseEvent) {
    super('Connection closed');
    this.name = 'MiddlewareSubscriberDisconnected';
  }
}

export default class MiddlewareSubscriber {
  #subscriptions: Array<
  readonly [target: string, s: Source, cb: (p?: Object, e?: Error) => void]
  > = [];

  #requestQueue: Array<[isSubscribe: boolean, target: string]> = [];

  #webSocket?: WebSocket;

  get webSocket(): WebSocket | undefined {
    return this.#webSocket;
  }

  get #targets(): Set<string> {
    return new Set(this.#subscriptions.map(([target]) => target));
  }

  #sendMessage(message: any): void {
    if (this.#webSocket == null) throw new UnexpectedTsError();
    this.#webSocket.send(JSON.stringify(message));
  }

  #sendSubscribe(isSubscribe: boolean, target: string): void {
    if (this.#webSocket == null) return;
    const payload = ['KeyBlocks', 'MicroBlocks', 'Transactions'].includes(target)
      ? target : 'Object';
    this.#sendMessage({
      op: isSubscribe ? 'Subscribe' : 'Unsubscribe',
      payload,
      ...payload === 'Object' && { target },
    });
    this.#requestQueue.push([isSubscribe, target]);
  }

  #emit(condition: (target: string, source: Source) => boolean, p?: Object, e?: Error): void {
    this.#subscriptions
      .filter(([target, source]) => condition(target, source))
      .forEach(([, , cb]) => cb(p, e));
  }

  constructor(readonly url: string) {
  }

  #disconnect(onlyReset = false): void {
    if (this.#webSocket == null) return;
    if (!onlyReset) this.#webSocket.close();
    Object.assign(this.#webSocket, {
      onopen: undefined,
      onerror: undefined,
      onmessage: undefined,
    });
    this.#webSocket = undefined;
  }

  async reconnect(): Promise<void> {
    this.#disconnect();
    this.#webSocket = await new Promise((resolve) => {
      const webSocket = new WebSocket(this.url);
      Object.assign(webSocket, {
        onopen: () => resolve(webSocket),
        onerror: (errorEvent: WebSocket.ErrorEvent) => {
          this.#emit(() => true, undefined, errorEvent.error);
        },
        onmessage: (event: WebSocket.MessageEvent) => {
          if (typeof event.data !== 'string') {
            throw new InternalError(`Unknown incoming message type: ${typeof event.data}`);
          }
          this.#messageHandler(JSON.parse(event.data));
        },
        onclose: (event: WebSocket.CloseEvent) => {
          this.#emit(() => true, undefined, new MiddlewareSubscriberDisconnected(event));
          this.#disconnect(true);
        },
      });
    });
    await Promise.all([...this.#targets].map((target) => this.#sendSubscribe(true, target)));
  }

  #messageHandler(message: string | string[] | Message): void {
    if (typeof message === 'string' || Array.isArray(message)) {
      const request = this.#requestQueue.shift();
      if (request == null) throw new InternalError('Request queue is empty');
      const [isSubscribe, target] = request;
      let error;
      if (typeof message === 'string') error = new MiddlewareSubscriberError(message);
      if (message.includes(target) !== isSubscribe) {
        error = new InternalError(`Expected ${target} to be${isSubscribe ? '' : ' not'} included into ${message}`);
      }
      if (error != null) this.#emit((t) => target === t, undefined, error);
      return;
    }
    this.#emit(
      (target, source) => (target === message.subscription || target === message.target)
        && (source === message.source || source === Source.All),
      message.payload,
    );
  }

  #subscribe(target: string, source: Source, cb: (p?: Object, e?: Error) => void): () => void {
    const subscription = [target, source, cb] as const;
    if (this.#targets.size === 0) this.reconnect();
    if (!this.#targets.has(target)) this.#sendSubscribe(true, target);
    this.#subscriptions.push(subscription);
    return () => {
      this.#subscriptions = this.#subscriptions.filter((item) => item !== subscription);
      if (!this.#targets.has(target)) this.#sendSubscribe(false, target);
      if (this.#targets.size === 0) this.#disconnect();
    };
  }

  // TODO: replace p?: any with a proper type definition

  subscribeKeyBlocks(cb: (p?: any, e?: Error) => void): () => void {
    return this.#subscribe('KeyBlocks', Source.Middleware, cb);
  }

  subscribeKeyBlocksNode(cb: (p?: any, e?: Error) => void): () => void {
    return this.#subscribe('KeyBlocks', Source.Node, cb);
  }

  subscribeKeyBlocksAll(cb: (p?: any, e?: Error) => void): () => void {
    return this.#subscribe('KeyBlocks', Source.All, cb);
  }

  subscribeMicroBlocks(cb: (p?: any, e?: Error) => void): () => void {
    return this.#subscribe('MicroBlocks', Source.Middleware, cb);
  }

  subscribeMicroBlocksNode(cb: (p?: any, e?: Error) => void): () => void {
    return this.#subscribe('MicroBlocks', Source.Node, cb);
  }

  subscribeMicroBlocksAll(cb: (p?: any, e?: Error) => void): () => void {
    return this.#subscribe('MicroBlocks', Source.All, cb);
  }

  subscribeTransactions(cb: (p?: any, e?: Error) => void): () => void {
    return this.#subscribe('Transactions', Source.Middleware, cb);
  }

  subscribeTransactionsNode(cb: (p?: any, e?: Error) => void): () => void {
    return this.#subscribe('Transactions', Source.Node, cb);
  }

  subscribeTransactionsAll(cb: (p?: any, e?: Error) => void): () => void {
    return this.#subscribe('Transactions', Source.All, cb);
  }

  subscribeObject(
    target: Encoded.KeyBlockHash | Encoded.Channel | Encoded.ContractAddress
    | Encoded.OracleAddress | Encoded.OracleQueryId | Encoded.AccountAddress
    | Encoded.Name | `${string}.chain`,
    cb: (p?: any, e?: Error) => void,
  ): () => void {
    return this.#subscribe(target, Source.Middleware, cb);
  }

  subscribeObjectNode(
    target: Encoded.KeyBlockHash | Encoded.Channel | Encoded.ContractAddress
    | Encoded.OracleAddress | Encoded.OracleQueryId | Encoded.AccountAddress
    | Encoded.Name | `${string}.chain`,
    cb: (p?: any, e?: Error) => void,
  ): () => void {
    return this.#subscribe(target, Source.Node, cb);
  }

  subscribeObjectAll(
    target: Encoded.KeyBlockHash | Encoded.Channel | Encoded.ContractAddress
    | Encoded.OracleAddress | Encoded.OracleQueryId | Encoded.AccountAddress
    | Encoded.Name | `${string}.chain`,
    cb: (p?: any, e?: Error) => void,
  ): () => void {
    return this.#subscribe(target, Source.All, cb);
  }
}
