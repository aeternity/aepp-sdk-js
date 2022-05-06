/**
 * RpcClient module
 *
 * @module @aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client
 * @export { RpcClient, RpcClients }
 * @example
 * import RpcClient from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client'
 */

import { METHODS, RPC_STATUS, SUBSCRIPTION_TYPES } from '../schema'
// @ts-expect-error TODO remove
import { sendMessage, message, isValidAccounts } from '../helpers'
import {
  InvalidRpcMessageError,
  TypeError,
  DuplicateCallbackError,
  MissingCallbackError
} from '../../errors'

export interface Connection {
  isConnected: () => boolean
  disconnect: (forceConnectionClose?: boolean) => void
  connect: (
    handleMessage: (msg: any, origin: string) => void,
    disconnect: (connection: Connection) => void
  ) => void
  connectionInfo: {id: string}
  id: string
  origin?: string
  debug: boolean
  forceOrigin: boolean
  sendDirection?: string
  receiveDirection: string
  subscribeFn: Function
  unsubscribeFn: Function
  postFn: Function
  listener?: Function
}

export interface RpcClientInfo {
  name?: string
  icons?: [{ src: string, sizes?: string, type?: string, purpose?: string }]
  status?: string
  connectNode?: boolean
  version?: number
  origin?: string
}

export interface Accounts {
  connected?: { [pub: string]: {} }
  current?: { [pub: string]: {} }
}

export interface Message {
  jsonrpc: string
  id: number
  method: string
  version: number
  params?: any
  result?: any
  error?: {
    code: number
    data?: any
    message: string
  }
}

/**
 * Contain functionality for using RPC conection
 * @alias module:@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client
 * @function
 * @param param Init params object
 * @param param.name Client name
 * @param param.connection Connection object
 * @param param.handlers Array with two function for message handling
 * @param param.handlers[0] Message handler
 * @param param.handlers[1] Disconnect callback
 * @returns RpcClient object
 */

export default class RpcClient {
  id: string
  connection: Connection
  info: RpcClientInfo
  callbacks: Map<string | number, {resolve: Function, reject: Function}>
  addressSubscription: string[]
  accounts: Accounts
  sendMessage: Function
  readonly addresses: string[]
  readonly currentAccount: string

  constructor ({ info, id, name, icons, connection, handlers: [onMessage, onDisconnect] }: {
    id: string
    connection: Connection
    handlers: [Function, Function]
    info?: Partial<RpcClientInfo>
    name?: RpcClientInfo['name']
    icons?: RpcClientInfo['icons']
  }) {
    this.id = id
    this.connection = connection
    this.info = { ...info, name, icons }

    this.callbacks = new Map()
    // ['connected', 'current']
    this.addressSubscription = []
    this.accounts = {}

    this.sendMessage = sendMessage(this.connection)

    const handleMessage = (msg: Message, origin: string): void => {
      if (msg.jsonrpc !== '2.0') {
        throw new InvalidRpcMessageError(JSON.stringify(msg))
      }
      onMessage(msg, origin)
    }

    const disconnect = (connection: Connection): void => {
      this.disconnect(true)
      onDisconnect(connection, this)
    }

    this.connection.connect(handleMessage, disconnect)

    Object.defineProperties(this, {
      currentAccount: {
        enumerable: true,
        configurable: false,
        get () {
          return this.isHasAccounts() === true
            ? Object.keys(this.accounts.current)[0]
            : undefined
        }
      },
      addresses: {
        enumerable: true,
        configurable: false,
        get () {
          return this.isHasAccounts() === true
            ? [...Object.keys(this.accounts.current), ...Object.keys(this.accounts.connected)]
            : []
        }
      },
      origin: {
        enumerable: true,
        configurable: false,
        get () {
          return this.connection
        }
      }
    })
  }

  /**
   * Update info
   * @function updateInfo
   * @instance
   * @rtype (info: Object) => void
   * @param info Info to update (will be merged with current info object)
   */
  updateInfo (info: Partial<RpcClientInfo>): void {
    this.info = { ...this.info, ...info }
  }

  isHasAccounts (): boolean {
    return typeof this.accounts === 'object' &&
      typeof this.accounts.connected === 'object' &&
      typeof this.accounts.current === 'object'
  }

  isSubscribed (): boolean {
    return (this.addressSubscription.length > 0) && this.isHasAccounts()
  }

  /**
   * Check if aepp has access to account
   * @function hasAccessToAccount
   * @instance
   * @rtype (address: String) => Boolean
   * @param address Account address
   * @returns is connected
   */
  hasAccessToAccount (address: string): boolean {
    return (address.length !== 0) && (this.addresses.find(a => a === address) != null)
  }

  /**
   * Check if is connected
   * @function isConnected
   * @instance
   * @rtype () => Boolean
   * @return is connected
   */
  isConnected (): boolean {
    return (this.connection.isConnected()) &&
      (this?.info?.status === RPC_STATUS.CONNECTED || this?.info?.status === RPC_STATUS.NODE_BINDED)
  }

  /**
   * Get selected account
   * @function getCurrentAccount
   * @instance
   * @rtype ({ onAccount } = {}) => String
   * @param options Options
   * @return current account
   */
  getCurrentAccount ({ onAccount }: { onAccount?: string } = {}): string {
    return onAccount ?? Object.keys(this.accounts.current ?? {})[0]
  }

  /**
   * Disconnect
   * @function disconnect
   * @instance
   * @rtype () => void
   */
  disconnect (forceConnectionClose: boolean = false): void {
    this.info.status = RPC_STATUS.DISCONNECTED
    this.addressSubscription = []
    this.accounts = {}
    forceConnectionClose || this.connection.disconnect()
  }

  /**
   * Update accounts and sent `update.address` notification to AEPP
   * @param accounts Current and connected accounts
   * @param options Options
   */
  setAccounts (accounts: Accounts,
    { forceNotification }: { forceNotification?: boolean} = {}): void {
    if (!isValidAccounts(accounts)) {
      throw new TypeError('Invalid accounts object. Should be object like: `{ connected: {}, selected: {} }`')
    }
    this.accounts = accounts
    if (!(forceNotification ?? false)) {
      // Sent notification about account updates
      this.sendMessage(message(METHODS.updateAddress, this.accounts), true)
    }
  }

  /**
   * Update subscription
   * @function updateSubscription
   * @instance
   * @rtype (type: String, value: String) => void
   * @param type Subscription type
   * @param value Subscription value
   */
  updateSubscription (type: string, value: string): string[] {
    if (type === SUBSCRIPTION_TYPES.subscribe && !this.addressSubscription.includes(value)) {
      this.addressSubscription.push(value)
    }
    if (type === SUBSCRIPTION_TYPES.unsubscribe && this.addressSubscription.includes(value)) {
      this.addressSubscription = this.addressSubscription.filter(s => s !== value)
    }
    return this.addressSubscription
  }

  /**
   * Make a request
   * @function request
   * @instance
   * @rtype (name: String, params: Object) => Promise
   * @param name Method name
   * @param params Method params
   * @return Promise which will be resolved after receiving response message
   */
  async request (name: string, params: string): Promise<void> {
    const msgId = this.sendMessage(message(name, params))
    if (this.callbacks.has(msgId)) {
      throw new DuplicateCallbackError()
    }
    return await new Promise((resolve, reject) => {
      this.callbacks.set(msgId, { resolve, reject })
    })
  }

  /**
   * Process response message
   * @function processResponse
   * @instance
   * @rtype (msg: Object, transformResult: Function) => void
   * @param msg Message object
   * @param transformResult Optional parser function for message
   */
  processResponse (
    { id, error, result }: {
      id: string
      error?: {code: number, data?: any, message: string}
      result?: any
    }, transformResult: Function): void {
    if (!this.callbacks.has(id)) throw new MissingCallbackError(id)
    if (result != null) {
      this.callbacks.get(id)?.resolve(...typeof transformResult === 'function'
        ? transformResult({ id, result })
        : [result])
    } else {
      this.callbacks.get(id)?.reject(error)
    }
    this.callbacks.delete(id)
  }
}
