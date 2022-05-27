/**
 * RPC handler for AEPP side
 *
 * @module @aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/aepp-rpc
 * @export AeppRpc
 * @example
 * import AeppRpc
 * from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/aepp-rpc'
 */
import { v4 as uuid } from '@aeternity/uuid'
import AccountResolver from '../../../account/resolver'
import AccountRpc from '../../../account/rpc'
import { decode } from '../../encoder'
import { mapObject } from '../../other'
import RpcClient from './rpc-client'
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

const METHOD_HANDLERS = {
  [METHODS.updateAddress]: (instance, params) => {
    instance.rpcClient.accounts = params
    instance.onAddressChange(params)
  },
  [METHODS.updateNetwork]: async (instance, params) => {
    const { node } = params
    if (node) instance.addNode(node.name, await Node(node), true)
    instance.onNetworkChange(params)
  },
  [METHODS.closeConnection]: (instance, params) => {
    instance.disconnectWallet()
    instance.onDisconnect(params)
  },
  [METHODS.readyToConnect]: () => {}
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
export default AccountResolver.compose({
  init ({
    name,
    debug = false,
    ...other
  }) {
    ['onAddressChange', 'onDisconnect', 'onNetworkChange'].forEach(event => {
      const handler = other[event] ?? (() => {})
      if (typeof handler !== 'function') throw new ArgumentError(event, 'a function', handler)
      this[event] = handler
    })

    this.name = name
    this.debug = debug

    const resolveAccountBase = this._resolveAccount
    this._resolveAccount = (account = this.rpcClient?.currentAccount) => {
      if (typeof account === 'string') {
        decode(account, 'ak')
        if (!this.rpcClient?.hasAccessToAccount(account)) {
          throw new UnAuthorizedAccountError(account)
        }
        account = AccountRpc({
          rpcClient: this.rpcClient, address: account, networkId: this.getNetworkId()
        })
      }
      if (!account) this._ensureAccountAccess()
      return resolveAccountBase(account)
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
     * @param {Object} walletInfo Wallet info object
     * @param {Object} connection Wallet connection object
     * @param {Object} [options={}]
     * @param {Boolean} [options.connectNode=true] - Request wallet to bind node
     * @param {String}  [options.name=wallet-node] - Node name
     * @param {Boolean} [options.select=false] - Select this node as current
     * @return {Object}
     */
    async connectToWallet (walletInfo, connection, { connectNode = false, name = 'wallet-node', select = false } = {}) {
      if (this.rpcClient?.isConnected()) throw new AlreadyConnectedError('You are already connected to wallet ' + this.rpcClient)
      this.rpcClient = RpcClient({
        ...walletInfo,
        connection,
        id: uuid(),
        onDisconnect: this.onDisconnect,
        methods: mapObject(METHOD_HANDLERS, ([key, value]) => [key, value.bind(null, this)])
      })
      const { node } = await this.sendConnectRequest(connectNode)
      if (connectNode) {
        if (node == null) throw new RpcConnectionError('Missing URLs of the Node')
        this.addNode(name, await Node(node), select)
      }
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
        this.rpcClient.sendMessage({ method: METHODS.closeConnection, params: { reason: 'bye' } }, true)
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
      const result = await this.rpcClient.request(METHODS.subscribeAddress, { type, value })
      if (result.address) {
        this.rpcClient.accounts = result.address
      }
      if (result.subscription) {
        this.rpcClient.addressSubscription = result.subscription
      }
      return result
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
      const walletInfo = this.rpcClient.request(
        METHODS.connect, {
          name: this.name,
          version: VERSION,
          connectNode
        }
      )
      this.rpcClient.info.status = RPC_STATUS.CONNECTED
      return walletInfo
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
