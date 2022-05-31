import { RpcError, RpcInternalError, RpcMethodNotFoundError } from '../schema'
import BrowserConnection from '../connection/Browser'
import { InvalidRpcMessageError, MissingCallbackError } from '../../errors'

interface JsonRpcRequest {
  jsonrpc: '2.0'
  id: number
  method: string
  params?: any
}

interface JsonRpcResponse {
  jsonrpc: '2.0'
  id: number
  method: string
  result?: any
  error?: {
    code: number
    message: string
    data?: any
  }
}

type RpcApiHandler = (p?: any, origin?: string) => any | undefined
type RpcApi<Keys> = { [k in keyof Keys]: RpcApiHandler }

/**
 * Contain functionality for using RPC conection
 * @param connection Connection object
 * @param onDisconnect Disconnect callback
 * @param methods Object containing handlers for each request by name
 */
export default class RpcClient <
  RemoteApi extends RpcApi<RemoteApi>, LocalApi extends RpcApi<LocalApi>
> {
  connection: BrowserConnection
  #callbacks = new Map<number, { resolve: (v: any) => void, reject: (e: Error) => void }>()
  #messageId = 0
  #methods: LocalApi

  constructor (
    connection: BrowserConnection,
    onDisconnect: () => void,
    methods: LocalApi
  ) {
    this.connection = connection
    this.#methods = methods
    connection.connect(this.#handleMessage.bind(this), onDisconnect)
  }

  async #handleMessage (msg: JsonRpcRequest | JsonRpcResponse, origin: string): Promise<void> {
    if (msg?.jsonrpc !== '2.0') throw new InvalidRpcMessageError(JSON.stringify(msg))
    if ('result' in msg || 'error' in msg) {
      this.#processResponse(msg)
      return
    }

    const request = msg as JsonRpcRequest
    let result, error
    try {
      if (!(request.method in this.#methods)) throw new RpcMethodNotFoundError()
      const methodName = request.method as keyof LocalApi
      result = await this.#methods[methodName](request.params, origin)
    } catch (e) {
      error = e instanceof RpcError ? e : new RpcInternalError()
    }
    if (request.id != null) {
      this.#sendResponse(request.id, request.method as keyof LocalApi, result, error)
    }
  }

  #sendRequest (
    id: number | undefined,
    method: keyof RemoteApi | keyof LocalApi,
    params?: any
  ): void {
    this.connection.sendMessage({
      jsonrpc: '2.0',
      ...id != null ? { id } : {},
      method,
      ...params != null ? { params } : {}
    })
  }

  #sendResponse (
    id: number,
    method: keyof RemoteApi | keyof LocalApi, // TODO: remove as far it is not required in JSON RPC
    result?: any,
    error?: any
  ): void {
    this.connection.sendMessage({
      jsonrpc: '2.0',
      id,
      method,
      ...error != null ? { error } : { result }
    })
  }

  /**
   * Make a request
   * @function request
   * @instance
   * @rtype (name: String, params: Object) => Promise
   * @param {String} name Method name
   * @param {Object} params Method params
   * @return {Promise} Promise which will be resolved after receiving response message
   */
  async request<Name extends keyof RemoteApi> (
    name: Name, params: Parameters<RemoteApi[Name]>[0]
  ): Promise<ReturnType<RemoteApi[Name]>> {
    this.#sendRequest(++this.#messageId, name, params)
    return await new Promise((resolve, reject) => {
      this.#callbacks.set(this.#messageId, { resolve, reject })
    })
  }

  /**
   * Make a notification
   * @function request
   * @instance
   * @rtype (name: String, params: Object) => Promise
   * @param {String} name Method name
   * @param {Object} params Method params
   * @return {Promise} Promise which will be resolved after receiving response message
   */
  notify<Name extends keyof RemoteApi> (name: Name, params: Parameters<RemoteApi[Name]>[0]): void {
    this.#sendRequest(undefined, name, params)
  }

  /**
   * Process response message
   * @function processResponse
   * @instance
   * @rtype (msg: Object, transformResult: Function) => void
   * @param {Object} msg Message object
   * @return {void}
   */
  #processResponse ({ id, error, result }: { id: number, error?: any, result?: any }): void {
    const callbacks = this.#callbacks.get(id)
    if (callbacks == null) throw new MissingCallbackError(id)
    if (error != null) callbacks.reject(RpcError.deserialize(error))
    else callbacks.resolve(result)
    this.#callbacks.delete(id)
  }
}