/**
 * RPC handler for AEPP side
 *
 * @module @aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/aepp-rpc
 * @export AeppRpc
 * @example import ContentScriptBridge from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/aepp-rpc'
 */
import * as R from 'ramda'
import uuid from 'uuid/v4'

import Ae from '../../../ae'
import { RpcClient } from './rpc-clients'
import { getHandler, message, voidFn } from '../helpers'
import { METHODS, RPC_STATUS, VERSION } from '../schema'

const NOTIFICATIONS = {
  [METHODS.wallet.updateAddress]: (instance) =>
    ({ params }) => {
      instance.rpcClient.accounts = params
      instance.onAddressChange(params)
    },
  [METHODS.updateNetwork]: (instance) =>
    (msg) => {
      instance.rpcClient.info.networkId = msg.params.networkId
      instance.onNetworkChange(msg.params)
    },
  [METHODS.closeConnection]: (instance) =>
    (msg) => {
      instance.disconnectWallet()
      instance.onDisconnect(msg.params)
    }
}

const RESPONSES = {
  [METHODS.aepp.address]: (instance) =>
    (msg) => instance.rpcClient.processResponse(msg),
  [METHODS.aepp.connect]: (instance) =>
    (msg) => {
      if (msg.result) instance.rpcClient.info.status = RPC_STATUS.CONNECTED
      instance.rpcClient.processResponse(msg)
    },
  [METHODS.aepp.subscribeAddress]: (instance) =>
    (msg) => {
      if (
        msg.result &&
        Object.prototype.hasOwnProperty.call(msg.result, 'address')
      ) instance.rpcClient.accounts = msg.result.address

      instance.rpcClient.processResponse(msg, ({ id, result }) => [result])
    },
  [METHODS.aepp.sign]: (instance) =>
    (msg) => {
      instance.rpcClient.processResponse(msg, ({ id, result }) => [result.signedTransaction || result.transactionHash])
    }
}

const REQUESTS = {}

const handleMessage = (instance) => async (msg) => {
  if (!msg.id) {
    return getHandler(NOTIFICATIONS, msg)(instance)(msg)
  } else if (Object.prototype.hasOwnProperty.call(instance.rpcClient.callbacks, msg.id)) {
    return getHandler(RESPONSES, msg)(instance)(msg)
  } else {
    return getHandler(REQUESTS, msg)(instance)(msg)
  }
}

/**
 * Contain functionality for wallet interaction and connect it to sdk
 * @alias module:@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/aepp-rpc
 * @function
 * @rtype Stamp
 * @param {Object} param Init params object
 * @param {String=} [param.name] Aepp name
 * @param {Function} onAddressChange Call-back function for update address event
 * @param {Function} onDisconnect Call-back function for disconnect event
 * @param {Function} onNetworkChange Call-back function for update network event
 * @param {Object} connection Wallet connection object
 * @return {Object}
 */
export const AeppRpc = Ae.compose({
  async init ({ name, onAddressChange = voidFn, onDisconnect = voidFn, onNetworkChange = voidFn, connection }) {
    const eventsHandlers = ['onDisconnect', 'onAddressChange', 'onNetworkChange']
    this.connection = connection
    this.name = name

    if (connection) {
      // Init RPCClient
      await this.connectToWallet(connection)
    }
    // Event callbacks
    this.onDisconnect = onDisconnect
    this.onAddressChange = onAddressChange
    this.onNetworkChange = onNetworkChange
    // validation
    eventsHandlers.forEach(event => {
      if (typeof this[event] !== 'function') throw new Error(`Call-back for ${event} must be an function!`)
    })
  },
  methods: {
    sign () {
    },
    /**
     * Connect to wallet
     * @function connectToWallet
     * @instance
     * @rtype (connection: Object) => void
     * @param {Object} connection Wallet connection object
     * @return {void}
     */
    async connectToWallet (connection) {
      if (this.rpcClient && this.rpcClient.isConnected()) throw new Error('You are already connected to wallet ' + this.rpcClient)
      this.rpcClient = RpcClient({
        connection,
        networkId: this.getNetworkId(),
        ...connection.connectionInfo,
        id: uuid(),
        handlers: [handleMessage(this), this.onDisconnect]
      })
      return this.sendConnectRequest()
    },
    /**
     * Disconnect from wallet
     * @function disconnectWallet
     * @instance
     * @rtype (force: Boolean = false) => void
     * @param {Boolean} sendDisconnect=false Force sending close connection message
     * @return {void}
     */
    async disconnectWallet (sendDisconnect = true) {
      if (!this.rpcClient || !this.rpcClient.connection.isConnected() || !this.rpcClient.isConnected()) throw new Error('You are not connected to Wallet')
      sendDisconnect && this.rpcClient.sendMessage(message(METHODS.closeConnection, { reason: 'bye' }), true)
      this.rpcClient.disconnect()
      this.rpcClient = null
    },
    async address ({ onAccount } = {}) {
      if (!this.rpcClient || !this.rpcClient.connection.isConnected() || !this.rpcClient.isConnected()) throw new Error('You are not connected to Wallet')
      if (!this.rpcClient.getCurrentAccount()) throw new Error('You do not subscribed for account.')
      return this.rpcClient.getCurrentAccount({ onAccount })
    },
    /**
     * Ask address from wallet
     * @function askAddresses
     * @instance
     * @rtype () => Promise
     * @return {Promise} Address from wallet
     */
    async askAddresses () {
      if (!this.rpcClient || !this.rpcClient.connection.isConnected() || !this.rpcClient.isConnected()) throw new Error('You are not connected to Wallet')
      if (!this.rpcClient.getCurrentAccount()) throw new Error('You do not subscribed for account.')
      return this.rpcClient.addCallback(
        this.rpcClient.sendMessage(message(METHODS.aepp.address))
      )
    },
    /**
     * Subscribe for addresses from wallet
     * @function subscribeAddress
     * @instance
     * @rtype (type: String, value: String) => Promise
     * @param {String} type Type of subscription can be one of ['current'(just for selected account updates), 'connected(all accounts)']
     * @param {String} value Subscription action('subscribe'|'unsubscribe')
     * @return {Promise} Address from wallet
     */
    async subscribeAddress (type, value) {
      if (!this.rpcClient || !this.rpcClient.connection.isConnected() || !this.rpcClient.isConnected()) throw new Error('You are not connected to Wallet')
      return this.rpcClient.addCallback(
        this.rpcClient.sendMessage(message(METHODS.aepp.subscribeAddress, { type, value }))
      )
    },
    /**
     * Overwriting of `signTransaction` AE method
     * All sdk API which use it will be send notification to wallet and wait for callBack
     * @function signTransaction
     * @instance
     * @rtype (tx: String, options = {}) => Promise
     * @return {Promise<String>} Signed transaction
     */
    async signTransaction (tx, opt = {}) {
      if (!this.rpcClient || !this.rpcClient.connection.isConnected() || !this.rpcClient.isConnected()) throw new Error('You are not connected to Wallet')
      if (!this.rpcClient.getCurrentAccount()) throw new Error('You do not subscribed for account.')
      return this.rpcClient.addCallback(
        this.rpcClient.sendMessage(message(METHODS.aepp.sign, { ...opt, tx, returnSigned: true }))
      )
    },
    /**
     * Send connection request to wallet
     * @function sendConnectRequest
     * @instance
     * @rtype () => Promise
     * @return {Promise} Connection response
     */
    async sendConnectRequest () {
      return this.rpcClient.addCallback(
        this.rpcClient.sendMessage(message(METHODS.aepp.connect, {
          name: this.name,
          version: VERSION,
          networkId: this.getNetworkId()
        }))
      )
    },
    /**
     * Overwriting of `send` AE method
     * All sdk API which use it will be send notification to wallet and wait for callBack
     * This method will sign, broadcast and wait until transaction will be accepted using rpc communication with wallet
     * @function send
     * @instance
     * @rtype (tx: String, options = {}) => Promise
     * @param {String} tx
     * @param {Object} [options={}]
     * @param {Object} [options.walletBroadcast={}]
     * @return {Promise<Object>} Transaction broadcast result
     */
    async send (tx, options = { walletBroadcast: true }) {
      if (!this.rpcClient || !this.rpcClient.connection.isConnected() || !this.rpcClient.isConnected()) throw new Error('You are not connected to Wallet')
      if (!this.rpcClient.getCurrentAccount()) throw new Error('You do not subscribed for account.')
      const opt = R.merge(this.Ae.defaults, options)
      if (!opt.walletBroadcast) {
        const signed = await this.signTransaction(tx, opt)
        return this.sendTransaction(signed, opt)
      }
      return this.rpcClient.addCallback(
        this.rpcClient.sendMessage(message(METHODS.aepp.sign, { ...opt, tx, returnSigned: false }))
      )
    }
  }
})

export default AeppRpc
