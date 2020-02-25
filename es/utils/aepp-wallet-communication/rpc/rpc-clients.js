/**
 * RPC client helpers
 *
 * @module @aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client
 * @export { RpcClient, RpcClients }
 * @example import RpcClient from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client'
 * @example import RpcClients from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client'
 */
import stampit from '@stamp/it'

import { RPC_STATUS, SUBSCRIPTION_TYPES } from '../schema'
import { receive, sendMessage } from '../helpers'

/**
 * Contain functionality for managing multiple RPC clients (RpcClient stamp)
 * @alias module:@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client.RpcClients
 * @function
 * @rtype Stamp
 * @return {Object}
 */
export const RpcClients = stampit({
  init () {
    this.clients = new Map()
  },
  methods: {
    /**
     * Check if has client by id
     * @function hasClient
     * @instance
     * @memberOf @aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client
     * @rtype (id: (String|Number)) => Boolean
     * @param {(String|Number)} id Client ID
     * @return {Boolean}
     */
    hasClient (id) {
      return this.clients.has(id)
    },
    /**
     * Add new client
     * @function addClient
     * @instance
     * @rtype (id: (String|Number), connectionInfo: Object) => void
     * @param {(String|Number)} id Client ID
     * @param {Object} connectionData Object containing `connectionInfo` and `connection` objects
     * @return {void}
     */
    addClient (id, connectionData) {
      if (this.hasClient(id)) console.warn(`Wallet RpcClient with id ${id} already exist`)
      this.clients.set(id, RpcClient({ id, ...connectionData }))
    },
    /**
     * Get clien by id
     * @function getClient
     * @instance
     * @rtype (id: (String|Number)) => Object
     * @param {(String|Number)} id Client ID
     * @return {Object} RpcClient
     */
    getClient (id) {
      return this.clients.get(id)
    },
    /**
     * Remove and disiconnect client by ID
     * @function removeClient
     * @instance
     * @rtype (id: (String|Number), { forceConnectionClose: boolean = false }) => boolean
     * @param {(String|Number)} id Client ID
     * @param forceConnectionClose
     * @return {Boolean}
     */
    removeClient (id, { forceConnectionClose = false } = {}) {
      if (!this.hasClient(id)) throw new Error(`Wallet RpcClient with id ${id} do not exist`)
      this.clients.get(id).disconnect(forceConnectionClose)
      this.clients.delete(id)
      return true
    },
    /**
     * Update client info by id
     * @function updateClientInfo
     * @instance
     * @rtype (id: (String|Number), info: Object) => void
     * @param {(String|Number)} id Client ID
     * @param {Object} info Info to update (will be merged with current info object)
     * @return {void}
     */
    updateClientInfo (id, info) {
      const client = this.getClient(id)
      client.info = { ...client.info, ...info }
      this.clients.set(id, client)
    },
    /**
     * Send notification to all client passing condition
     * @function sentNotificationByCondition
     * @instance
     * @rtype (msg: Object, condition: Function) => void
     * @param {Object} msg Msg object
     * @param {Function} condition Condition function of (client: RpcClient) => Boolean
     * @return {void}
     */
    sentNotificationByCondition (msg, condition) {
      if (typeof condition !== 'function') throw new Error('Condition argument must be a function which return boolean')
      const clients = Array.from(
        this.clients.values()
      )
        .filter(condition)
      clients.forEach(client => client.sendMessage(msg, true))
    }
  }
})

/**
 * Contain functionality for using RPC conection
 * @alias module:@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client
 * @function
 * @rtype Stamp
 * @param {Object} param Init params object
 * @param {String} param.id Client id
 * @param {String} param.name Client name
 * @param {Object} param.connection Connection object
 * @param {Function[]} param.handlers Arrays with two function for handling messages ([ onMessage: Function, onDisconnect: Function])
 * @return {Object}
 */
export const RpcClient = stampit({
  init ({ id, name, networkId, icons, connection, handlers: [onMessage, onDisconnect] }) {
    const messageId = 0
    this.id = id
    this.connection = connection
    this.info = { name, networkId, icons }
    // {
    //    [msg.id]: { resolve, reject }
    // }
    this.callbacks = {}
    this.actions = {}
    this.addressSubscription = []
    this.accounts = {}

    this.sendMessage = sendMessage(messageId, this.connection)
    const disconnect = (aepp, connection) => {
      this.disconnect(true)
      typeof onDisconnect === 'function' && onDisconnect(connection, this)
    }
    connection.connect(receive(onMessage, messageId), disconnect)
  },
  methods: {
    /**
     * Check if is connected
     * @function isConnected
     * @instance
     * @rtype () => Boolean
     * @return {Boolean} is connected
     */
    isConnected () {
      return this.info.status === RPC_STATUS.CONNECTED
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
      if (!this.accounts.current || !Object.keys(this.accounts.current).length) throw new Error('You do not subscribed for account.')
      if (
        onAccount &&
        (!this.accounts.connected || !Object.keys(this.accounts.connected).length || !Object.keys(this.accounts.connected).includes(onAccount))
      ) throw new Error(`You do not subscribed for connected account's or account ${onAccount} is not connected to the wallet.`)
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
     * Update subsription
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
     * Add new action to actions
     * @function addAction
     * @instance
     * @rtype (action: Object, [r: Function, j: Function]) => Object
     * @param {Object} action Action object
     * @param {Function[]} resolvers Array with two function [resolve, reject] action
     * @return {Object}
     */
    addAction (action, [r, j]) {
      const removeAction = ((ins) => (id) => delete ins[id])(this.actions)
      if (Object.prototype.hasOwnProperty.call(this.callbacks, action.id)) throw new Error('Action for this request already exist')
      this.actions[action.id] = {
        ...action,
        accept (...args) {
          removeAction(action.id)
          r(...args)
        },
        deny (...args) {
          removeAction(action.id)
          j(...args)
        }
      }
      return this.actions[action.id]
    },
    /**
     * Add new callback for request
     * @function addCallback
     * @instance
     * @rtype (msgId: (String|Number)) => Object
     * @param {(String|Number)} msgId Request message id
     * @return {Promise} Promise which will be resolved after receiving response message
     */
    addCallback (msgId) {
      if (Object.prototype.hasOwnProperty.call(this.callbacks, msgId)) throw new Error('Callback Already exist')
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
      if (result) {
        this.resolveCallback(id, typeof transformResult === 'function' ? transformResult({
          id,
          result
        }) : [result])
      } else if (error) {
        this.rejectCallback(id, [error])
      }
    },
    /**
     * Resolve callback function
     * Trigger Promise resolution from `addCallBack` function
     * @function resolveCallback
     * @instance
     * @rtype (msgId: Number, args: Array) => void
     * @param {Number} msgId Message Id
     * @param {Array} args Arguments array
     * @return {void}
     */
    resolveCallback (msgId, args = []) {
      if (!this.callbacks[msgId]) throw new Error(`Can't find callback for this messageId ${msgId}`)
      this.callbacks[msgId].resolve(...args)
      delete this.callbacks[msgId]
    },
    /**
     * Reject callback function
     * Trigger Promise rejection from `addCallBack` function
     * @function rejectCallback
     * @instance
     * @rtype (msgId: Number, args: Array) => void
     * @param {Number} msgId Message Id
     * @param {Array} args Arguments array
     * @return {void}
     */
    rejectCallback (msgId, args = []) {
      if (!this.callbacks[msgId]) throw new Error(`Can't find callback for this messageId ${msgId}`)
      this.callbacks[msgId].reject(...args)
      delete this.callbacks[msgId]
    }
  }
})
