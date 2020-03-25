/**
 * RPC handler for AEPP side
 *
 * @module @aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/aepp-rpc
 * @export AeppRpc
 * @example import ContentScriptBridge from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/aepp-rpc'
 */
import * as R from 'ramda'
import { v4 as uuid } from 'uuid'

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
      if (msg.result) {
        msg.result.address && (instance.rpcClient.accounts = msg.result.address)
        msg.result.subscription && (instance.rpcClient.addressSubscription = msg.result.subscription)
      }

      instance.rpcClient.processResponse(msg, ({ id, result }) => [result])
    },
  [METHODS.aepp.sign]: (instance) =>
    (msg) => {
      instance.rpcClient.processResponse(msg, ({ id, result }) => [result.signedTransaction || result.transactionHash])
    },
  [METHODS.aepp.signMessage]: (instance) =>
    (msg) => {
      instance.rpcClient.processResponse(msg, ({ id, result }) => [result.signature])
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
  deepProps: { Ae: { defaults: { walletBroadcast: true } } },
  methods: {
    sign () {
    },
    addresses () {
      if (!this.rpcClient.currentAccount) throw new Error('You do not subscribed for account.')
      return [this.rpcClient.currentAccount, ...Object.keys(this.rpcClient.accounts.connected)]
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
      if (!this.rpcClient || !this.rpcClient.isConnected()) throw new Error('You are not connected to Wallet')
      sendDisconnect && this.rpcClient.sendMessage(message(METHODS.closeConnection, { reason: 'bye' }), true)
      this.rpcClient.disconnect()
      this.rpcClient = null
    },
    async address ({ onAccount } = {}) {
      if (!this.rpcClient || !this.rpcClient.isConnected()) throw new Error('You are not connected to Wallet')
      const current = this.rpcClient.currentAccount
      if (!current) throw new Error('You do not subscribed for accounts.')
      if (onAccount && !this.rpcClient.hasAccessToAccount(onAccount)) throw new Error(`You are not have access to account ${onAccount}`)
      return onAccount || current
    },
    /**
     * Ask address from wallet
     * @function askAddresses
     * @instance
     * @rtype () => Promise
     * @return {Promise} Address from wallet
     */
    async askAddresses () {
      if (!this.rpcClient || !this.rpcClient.isConnected()) throw new Error('You are not connected to Wallet')
      if (!this.rpcClient.currentAccount) throw new Error('You do not subscribed for account.')
      return this.rpcClient.request(METHODS.aepp.address)
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
      if (!this.rpcClient || !this.rpcClient.isConnected()) throw new Error('You are not connected to Wallet')
      return this.rpcClient.request(METHODS.aepp.subscribeAddress, { type, value })
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
      if (!this.rpcClient || !this.rpcClient.isConnected()) throw new Error('You are not connected to Wallet')
      if (!this.rpcClient.currentAccount) throw new Error('You do not subscribed for account.')
      if (opt.onAccount && !this.rpcClient.hasAccessToAccount(opt.onAccount)) throw new Error(`You are not have access to account ${opt.onAccount}`)
      return this.rpcClient.request(METHODS.aepp.sign, { ...opt, tx, returnSigned: true })
    },
    /**
     * Overwriting of `signMessage` AE method
     * All sdk API which use it will be send notification to wallet and wait for callBack
     * @function signMessage
     * @instance
     * @rtype (msg: String, options = {}) => Promise
     * @return {Promise<String>} Signed transaction
     */
    async signMessage (msg, opt = {}) {
      if (!this.rpcClient || !this.rpcClient.isConnected()) throw new Error('You are not connected to Wallet')
      if (!this.rpcClient.currentAccount) throw new Error('You do not subscribed for account.')
      if (opt.onAccount && !this.rpcClient.hasAccessToAccount(opt.onAccount)) throw new Error(`You are not have access to account ${opt.onAccount}`)
      return this.rpcClient.request(METHODS.aepp.signMessage, { ...opt, message: msg })
    },
    /**
     * Send connection request to wallet
     * @function sendConnectRequest
     * @instance
     * @rtype () => Promise
     * @return {Promise} Connection response
     */
    async sendConnectRequest () {
      return this.rpcClient.request(
        METHODS.aepp.connect, {
          name: this.name,
          version: VERSION,
          networkId: this.getNetworkId()
        }
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
     * @param {Object} [options.walletBroadcast=true]
     * @return {Promise<Object>} Transaction broadcast result
     */
    async send (tx, options = {}) {
      if (!this.rpcClient || !this.rpcClient.isConnected()) throw new Error('You are not connected to Wallet')
      if (!this.rpcClient.currentAccount) throw new Error('You do not subscribed for account.')
      if (options.onAccount && !this.rpcClient.hasAccessToAccount(options.onAccount)) throw new Error(`You are not have access to account ${options.onAccount}`)
      const opt = R.merge(this.Ae.defaults, options)
      if (!opt.walletBroadcast) {
        const signed = await this.signTransaction(tx, { onAccount: opt.onAccount })
        return this.sendTransaction(signed, opt)
      }
      return this.rpcClient.request(METHODS.aepp.sign, { onAccount: opt.onAccount, tx, returnSigned: false })
    }
  }
})

export default AeppRpc
