import { RpcError, RpcInternalError, RpcMethodNotFoundError } from '../schema';
import BrowserConnection from '../connection/Browser';
import { InvalidRpcMessageError, MissingCallbackError } from '../../utils/errors';
import { ensureError } from '../../utils/other';

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params?: any;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: number;
  method: string;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

type RpcApiHandler = (p?: any) => any | undefined;
type RpcApi<Api> = { [k in keyof Api]: RpcApiHandler };
type WithOrigin<Api extends RpcApi<Api>> = {
  [k in keyof Api]: (p: Parameters<Api[k]>[0], origin: string) => ReturnType<Api[k]>
};

/**
 * Contain functionality for using RPC conection
 * @category aepp wallet communication
 * @param connection - Connection object
 * @param onDisconnect - Disconnect callback
 * @param methods - Object containing handlers for each request by name
 */
export default class RpcClient <
  RemoteApi extends RpcApi<RemoteApi>, LocalApi extends RpcApi<LocalApi>,
> {
  connection: BrowserConnection;

  readonly #callbacks = (
    new Map<number, { resolve: (v: any) => void; reject: (e: Error) => void }>()
  );

  #messageId = 0;

  readonly #methods: WithOrigin<LocalApi>;

  constructor(
    connection: BrowserConnection,
    onDisconnect: () => void,
    methods: WithOrigin<LocalApi>,
  ) {
    this.connection = connection;
    this.#methods = methods;
    connection.connect(this.#handleMessage.bind(this), onDisconnect);
  }

  async #handleMessage(msg: JsonRpcRequest | JsonRpcResponse, origin: string): Promise<void> {
    if (msg?.jsonrpc !== '2.0') throw new InvalidRpcMessageError(JSON.stringify(msg));
    if ('result' in msg || 'error' in msg) {
      this.#processResponse(msg);
      return;
    }

    const request = msg as JsonRpcRequest;
    let result;
    let error: Error | undefined;
    try {
      if (!(request.method in this.#methods)) throw new RpcMethodNotFoundError();
      const methodName = request.method as keyof LocalApi;
      result = await this.#methods[methodName](request.params, origin);
    } catch (e) {
      ensureError(e);
      error = e;
    }
    if (request.id != null) {
      this.#sendResponse(
        request.id,
        request.method as keyof LocalApi,
        result,
        error == null || error instanceof RpcError ? error : new RpcInternalError(),
      );
    }
    if (error != null && !(error instanceof RpcError)) throw error;
  }

  #sendRequest(
    id: number | undefined,
    method: keyof RemoteApi | keyof LocalApi,
    params?: any,
  ): void {
    this.connection.sendMessage({
      jsonrpc: '2.0',
      ...id != null ? { id } : {},
      method,
      ...params != null ? { params } : {},
    });
  }

  #sendResponse(
    id: number,
    method: keyof RemoteApi | keyof LocalApi, // TODO: remove as far it is not required in JSON RPC
    result?: any,
    error?: RpcError,
  ): void {
    this.connection.sendMessage({
      jsonrpc: '2.0',
      id,
      method,
      ...error != null ? { error: error.toJSON() } : { result },
    });
  }

  /**
   * Make a request
   * @param name - Method name
   * @param params - Method params
   * @returns Promise which will be resolved after receiving response message
   */
  async request<Name extends keyof RemoteApi>(
    name: Name,
    params: Parameters<RemoteApi[Name]>[0],
  ): Promise<ReturnType<RemoteApi[Name]>> {
    this.#sendRequest(this.#messageId += 1, name, params);
    return new Promise((resolve, reject) => {
      this.#callbacks.set(this.#messageId, { resolve, reject });
    });
  }

  /**
   * Make a notification
   * @param name - Method name
   * @param params - Method params
   */
  notify<Name extends keyof RemoteApi>(name: Name, params: Parameters<RemoteApi[Name]>[0]): void {
    this.#sendRequest(undefined, name, params);
  }

  /**
   * Process response message
   * @param msg - Message object
   */
  #processResponse({ id, error, result }: { id: number; error?: any; result?: any }): void {
    const callbacks = this.#callbacks.get(id);
    if (callbacks == null) throw new MissingCallbackError(id);
    if (error != null) callbacks.reject(RpcError.deserialize(error));
    else callbacks.resolve(result);
    this.#callbacks.delete(id);
  }
}
