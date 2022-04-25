/**
 * RpcClient module
 *
 * @module @aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client
 * @export { RpcClient, RpcClients }
 * @example
 * import RpcClient from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client'
 */
import stampit from '@stamp/it'

import { METHODS, RPC_STATUS, SUBSCRIPTION_TYPES } from '../schema'
import { sendMessage, message, isValidAccounts } from '../helpers'
import {
  InvalidRpcMessageError,
  TypeError,
  DuplicateCallbackError,
  MissingCallbackError
} from '../../errors'

/**
 * Contain functionality for using RPC conection
 * @alias module:@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client
 * @function
 * @rtype Stamp
 * @param {Object} param Init params object
 * @param {String} param.name Client name
 * @param {Object} param.connection Connection object
 * @param {Function[]} param.handlers Array with two function for message handling
 * @param {Function} param.handlers[0] Message handler
 * @param {Function} param.handlers[1] Disconnect callback
 * @return {Object}
 */
export default stampit({
  init ({ id, name, icons, connection, handlers: [onMessage, onDisconnect] }) {
    this.id = id
    this.connection = connection
    this.info = { name, icons }
    // {
    //    [msg.id]: { resolve, reject }
    // }
    this.callbacks = {}
    // ['connected', 'current']
    this.addressSubscription = []
    // {
    //    connected: { [pub]: {...meta} },
    //    current: { [pub]: {...meta} }
    // }
    this.accounts = {}

    this.sendMessage = sendMessage(this.connection)

    const handleMessage = (msg, origin) => {
      if (!msg || !msg.jsonrpc || msg.jsonrpc !== '2.0' || !msg.method) {
        throw new InvalidRpcMessageError(msg)
      }
      onMessage(msg, origin)
    }

    const disconnect = (aepp, connection) => {
      this.disconnect(true)
      typeof onDisconnect === 'function' && onDisconnect(connection, this)
    }

    connection.connect(handleMessage, disconnect)
  },
  propertyDescriptors: {
    currentAccount: {
      enumerable: true,
      configurable: false,
      get () {
        return this.isHasAccounts()
          ? Object.keys(this.accounts.current)[0]
          : undefined
      }
    },
    addresses: {
      enumerable: true,
      configurable: false,
      get () {
        return this.isHasAccounts()
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
  },
  methods: {
    /**
     * Update info
     * @function updateInfo
     * @instance
     * @rtype (info: Object) => void
     * @param {Object} info Info to update (will be merged with current info object)
     * @return {void}
     */
    updateInfo (info) {
      Object.assign(this.info, info)
    },
    isHasAccounts () {
      return typeof this.accounts === 'object' &&
        typeof this.accounts.connected === 'object' &&
        typeof this.accounts.current === 'object'
    },
    isSubscribed () {
      return this.addressSubscription.length && this.isHasAccounts()
    },
    /**
     * Check if aepp has access to account
     * @function hasAccessToAccount
     * @instance
     * @rtype (address: String) => Boolean
     * @param {String} address Account address
     * @return {Boolean} is connected
     */
    hasAccessToAccount (address) {
      return !!address && this.addresses.find(a => a === address)
    },
    /**
     * Check if is connected
     * @function isConnected
     * @instance
     * @rtype () => Boolean
     * @return {Boolean} is connected
     */
    isConnected () {
      return this.connection.isConnected() &&
        (this.info.status === RPC_STATUS.CONNECTED || this.info.status === RPC_STATUS.NODE_BINDED)
    },
    /**
     * Get selected account
     * @function getCurrentAccount
     * @instance
     * @rtype ({ onAccount } = {}) => String
     * @param {Object} options Options
     * @return {String}
     */
    getCurrentAccount ({ onAccount } = {}) {
      return onAccount || Object.keys(this.accounts.current)[0]
    },
    /**
     * Disconnect
     * @function disconnect
     * @instance
     * @rtype () => void
     * @return {void}
     */
    disconnect (forceConnectionClose = false) {
      this.info.status = RPC_STATUS.DISCONNECTED
      this.addressSubscription = []
      this.accounts = {}
      forceConnectionClose || this.connection.disconnect()
    },
    /**
     * Update accounts and sent `update.address` notification to AEPP
     * @param {{ current: Object, connected: Object }} accounts Current and connected accounts
     * @param {Object} [options]
     * @param {Boolean} [options.forceNotification] Don't sent update notification to AEPP
     */
    setAccounts (accounts, { forceNotification } = {}) {
      if (!isValidAccounts(accounts)) {
        throw new TypeError('Invalid accounts object. Should be object like: `{ connected: {}, selected: {} }`')
      }
      this.accounts = accounts
      if (!forceNotification) {
        // Sent notification about account updates
        this.sendMessage(message(METHODS.updateAddress, this.accounts), true)
      }
    },
    /**
     * Update subscription
     * @function updateSubscription
     * @instance
     * @rtype (type: String, value: String) => void
     * @param {String} type Subscription type
     * @param {String} value Subscription value
     * @return {String[]}
     */
    updateSubscription (type, value) {
      if (type === SUBSCRIPTION_TYPES.subscribe && !this.addressSubscription.includes(value)) {
        this.addressSubscription.push(value)
      }
      if (type === SUBSCRIPTION_TYPES.unsubscribe && this.addressSubscription.includes(value)) {
        this.addressSubscription = this.addressSubscription.filter(s => s !== value)
      }
      return this.addressSubscription
    },
    /**
     * Make a request
     * @function request
     * @instance
     * @rtype (name: String, params: Object) => Promise
     * @param {String} name Method name
     * @param {Object} params Method params
     * @return {Promise} Promise which will be resolved after receiving response message
     */
    request (name, params) {
      const msgId = this.sendMessage(message(name, params))
      if (Object.prototype.hasOwnProperty.call(this.callbacks, msgId)) {
        throw new DuplicateCallbackError()
      }
      return new Promise((resolve, reject) => {
        this.callbacks[msgId] = { resolve, reject }
      })
    },
    /**
     * Process response message
     * @function processResponse
     * @instance
     * @rtype (msg: Object, transformResult: Function) => void
     * @param {Object} msg Message object
     * @param {Function=} transformResult Optional parser function for message
     * @return {void}
     */
    processResponse ({ id, error, result }, transformResult) {
      if (!this.callbacks[id]) throw new MissingCallbackError(id)
      if (result) {
        this.callbacks[id].resolve(...typeof transformResult === 'function'
          ? transformResult({ id, result })
          : [result])
      } else {
        this.callbacks[id].reject(error)
      }
      delete this.callbacks[id]
    }
  }
})
