/**
 * RpcClient module
 *
 * @module @aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client
 * @export { RpcClient, RpcClients }
 * @example
 * import RpcClient from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client'
 */
import stampit from '@stamp/it'

import { METHODS, RPC_STATUS, SUBSCRIPTION_TYPES, RpcError, RpcInternalError } from '../schema'
import { InvalidRpcMessageError, DuplicateCallbackError, MissingCallbackError } from '../../errors'

/**
 * Contain functionality for using RPC conection
 * @alias module:@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client
 * @function
 * @rtype Stamp
 * @param {Object} param Init params object
 * @param {String} param.name Client name
 * @param {Object} param.connection Connection object
 * @param {Function} param.onDisconnect Disconnect callback
 * @param {Object} param.methods Object containing handlers for each request by name
 * @return {Object}
 */
export default stampit({
  init ({ id, name, icons, connection, onDisconnect, methods }) {
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

    this._messageId = 0

    const handleMessage = async (msg, origin) => {
      if (!msg || !msg.jsonrpc || msg.jsonrpc !== '2.0' || !msg.method) {
        throw new InvalidRpcMessageError(msg)
      }
      if ((msg.result ?? msg.error) != null) {
        this.processResponse(msg)
        return
      }

      // TODO: remove methods as far it is not required in JSON RPC
      const response = { id: msg.id, method: msg.method }
      try {
        response.result = await methods[msg.method](msg.params, origin)
      } catch (error) {
        response.error = error instanceof RpcError ? error : new RpcInternalError()
      }
      if (response.id) this._sendMessage(response, true)
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
    _sendMessage ({ id, method, params, result, error }, isNotificationOrResponse = false) {
      if (!isNotificationOrResponse) this._messageId += 1
      id = isNotificationOrResponse ? (id ?? null) : this._messageId
      const msgData = params
        ? { params }
        : result
          ? { result }
          : { error }
      this.connection.sendMessage({
        jsonrpc: '2.0',
        ...id ? { id } : {},
        method,
        ...msgData
      })
      return id
    },
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
      this.accounts = accounts
      if (!forceNotification) this.notify(METHODS.updateAddress, this.accounts)
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
      const msgId = this._sendMessage({ method: name, params })
      if (this.callbacks[msgId] != null) {
        throw new DuplicateCallbackError()
      }
      return new Promise((resolve, reject) => {
        this.callbacks[msgId] = { resolve, reject }
      })
    },
    /**
     * Make a notification
     * @param {String} name Method name
     * @param {Object} params Method params
     */
    notify (name, params) {
      this._sendMessage({ method: name, params }, true)
    },
    /**
     * Process response message
     * @function processResponse
     * @instance
     * @rtype (msg: Object, transformResult: Function) => void
     * @param {Object} msg Message object
     * @return {void}
     */
    processResponse ({ id, error, result }) {
      if (!this.callbacks[id]) throw new MissingCallbackError(id)
      if (result) this.callbacks[id].resolve(result)
      else this.callbacks[id].reject(RpcError.deserialize(error))
      delete this.callbacks[id]
    }
  }
})
