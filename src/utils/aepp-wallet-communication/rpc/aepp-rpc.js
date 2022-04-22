/**
 * RPC handler for AEPP side
 *
 * @module @aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/aepp-rpc
 * @export AeppRpc
 * @example
 * import ContentScriptBridge
 * from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/aepp-rpc'
 */
import { v4 as uuid } from '@aeternity/uuid'
import AccountResolver from '../../../account/resolver'
import AccountRpc from '../../../account/rpc'
import { decode } from '../../encoder'
import AsyncInit from '../../../utils/async-init'
import RpcClient from './rpc-client'
import { getHandler, message } from '../helpers'
import { METHODS, RPC_STATUS, VERSION } from '../schema'
import {
  AlreadyConnectedError,
  NoWalletConnectedError,
  UnsubscribedAccountError,
  UnAuthorizedAccountError,
  ArgumentError,
  RpcConnectionError
} from '../../errors'
import Node from '../../../node'

const NOTIFICATIONS = {
  [METHODS.updateAddress]: (instance) =>
    ({ params }) => {
      instance.rpcClient.accounts = params
      instance.onAddressChange(params)
    },
  [METHODS.updateNetwork]: (instance) =>
    async ({ params }) => {
      const { networkId, node } = params
      instance.rpcClient.info.networkId = networkId
      if (node) instance.addNode(node.name, await Node(node), true)
      instance.onNetworkChange(params)
    },
  [METHODS.closeConnection]: (instance) =>
    (msg) => {
      instance.disconnectWallet()
      instance.onDisconnect(msg.params)
    }
}

const RESPONSES = {
  [METHODS.address]: (instance) =>
    (msg) => instance.rpcClient.processResponse(msg),
  [METHODS.connect]: (instance) =>
    (msg) => {
      if (msg.result) instance.rpcClient.info.status = RPC_STATUS.CONNECTED
      instance.rpcClient.processResponse(msg)
    },
  [METHODS.subscribeAddress]: (instance) =>
    (msg) => {
      if (msg.result) {
        if (msg.result.address) {
          instance.rpcClient.accounts = msg.result.address
        }
        if (msg.result.subscription) {
          instance.rpcClient.addressSubscription = msg.result.subscription
        }
      }

      instance.rpcClient.processResponse(msg, ({ result }) => [result])
    },
  [METHODS.sign]: (instance) =>
    (msg) => {
      instance.rpcClient.processResponse(
        msg, ({ result }) => [result.signedTransaction || result.transactionHash]
      )
    },
  [METHODS.signMessage]: (instance) =>
    (msg) => {
      instance.rpcClient.processResponse(msg, ({ result }) => [result.signature])
    }
}

const REQUESTS = {}

const handleMessage = (instance) => async (msg) => {
  if (!msg.id) {
    return getHandler(NOTIFICATIONS, msg, { debug: instance.debug })(instance)(msg)
  } else if (Object.prototype.hasOwnProperty.call(instance.rpcClient.callbacks, msg.id)) {
    return getHandler(RESPONSES, msg, { debug: instance.debug })(instance)(msg)
  } else {
    return getHandler(REQUESTS, msg, { debug: instance.debug })(instance)(msg)
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
export default AccountResolver.compose(AsyncInit, {
  async init ({
    name,
    connection,
    debug = false,
    ...other
  }) {
    ['onAddressChange', 'onDisconnect', 'onNetworkChange'].forEach(event => {
      const handler = other[event] ?? (() => {})
      if (typeof handler !== 'function') throw new ArgumentError(event, 'a function', handler)
      this[event] = handler
    })

    this.connection = connection
    this.name = name
    this.debug = debug

    const resolveAccountBase = this._resolveAccount
    this._resolveAccount = (account = this.rpcClient?.currentAccount) => {
      if (typeof account === 'string') {
        decode(account, 'ak')
        if (!this.rpcClient?.hasAccessToAccount(account)) {
          throw new UnAuthorizedAccountError(account)
        }
        account = AccountRpc({ rpcClient: this.rpcClient, address: account })
      }
      if (!account) this._ensureAccountAccess()
      return resolveAccountBase(account)
    }

    if (connection) {
      // Init RPCClient
      await this.connectToWallet(connection)
    }
  },
  methods: {
    addresses () {
      this._ensureAccountAccess()
      return [this.rpcClient.currentAccount, ...Object.keys(this.rpcClient.accounts.connected)]
    },
    /**
     * Connect to wallet
     * @function connectToWallet
     * @instance
     * @rtype (connection: Object) => void
     * @param {Object} connection Wallet connection object
     * @param {Object} [options={}]
     * @param {Boolean} [options.connectNode=true] - Request wallet to bind node
     * @param {String}  [options.name=wallet-node] - Node name
     * @param {Boolean} [options.select=false] - Select this node as current
     * @return {Object}
     */
    async connectToWallet (connection, { connectNode = false, name = 'wallet-node', select = false } = {}) {
      if (this.rpcClient?.isConnected()) throw new AlreadyConnectedError('You are already connected to wallet ' + this.rpcClient)
      this.rpcClient = RpcClient({
        connection,
        networkId: this.getNetworkId({ force: true }),
        ...connection.connectionInfo,
        id: uuid(),
        handlers: [handleMessage(this), this.onDisconnect]
      })
      const walletInfo = await this.sendConnectRequest(connectNode)
      if (connectNode && !Object.prototype.hasOwnProperty.call(walletInfo, 'node')) {
        throw new RpcConnectionError('Missing URLs of the Node')
      }
      if (connectNode) this.addNode(name, await Node(walletInfo.node), select)
      return walletInfo
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
      this._ensureConnected()
      if (sendDisconnect) {
        this.rpcClient.sendMessage(message(METHODS.closeConnection, { reason: 'bye' }), true)
      }
      this.rpcClient.disconnect()
      this.rpcClient = null
    },
    /**
     * Ask address from wallet
     * @function askAddresses
     * @instance
     * @rtype () => Promise
     * @return {Promise} Address from wallet
     */
    async askAddresses () {
      this._ensureAccountAccess()
      return this.rpcClient.request(METHODS.address)
    },
    /**
     * Subscribe for addresses from wallet
     * @function subscribeAddress
     * @instance
     * @rtype (type: String, value: String) => Promise
     * @param {String} type Should be one of 'current' (the selected account), 'connected' (all)
     * @param {String} value Subscription action('subscribe'|'unsubscribe')
     * @return {Promise} Address from wallet
     */
    async subscribeAddress (type, value) {
      this._ensureConnected()
      return this.rpcClient.request(METHODS.subscribeAddress, { type, value })
    },
    /**
     * Send connection request to wallet
     * @function sendConnectRequest
     * @instance
     * @param {Boolean} connectNode - Request wallet to bind node
     * @rtype () => Promise
     * @return {Promise} Connection response
     */
    async sendConnectRequest (connectNode) {
      return this.rpcClient.request(
        METHODS.connect, {
          name: this.name,
          version: VERSION,
          networkId: this.getNetworkId({ force: true }),
          connectNode
        }
      )
    },
    _ensureConnected () {
      if (this.rpcClient?.isConnected()) return
      throw new NoWalletConnectedError('You are not connected to Wallet')
    },
    _ensureAccountAccess () {
      this._ensureConnected()
      if (this.rpcClient?.currentAccount) return
      throw new UnsubscribedAccountError()
    }
  }
})
