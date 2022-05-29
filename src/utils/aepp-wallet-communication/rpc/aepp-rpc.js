/**
 * RPC handler for AEPP side
 *
 * @module @aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/aepp-rpc
 * @export AeppRpc
 * @example
 * import AeppRpc
 * from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/aepp-rpc'
 */
import AccountResolver from '../../../account/resolver'
import AccountRpc from '../../../account/rpc'
import { decode } from '../../encoder'
import { mapObject } from '../../other'
import RpcClient from './RpcClient'
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
    instance._accounts = params
    instance.onAddressChange(params)
  },
  [METHODS.updateNetwork]: async (instance, params) => {
    const { node } = params
    if (node) instance.addNode(node.name, await Node(node), true)
    instance.onNetworkChange(params)
  },
  [METHODS.closeConnection]: (instance, params) => {
    instance._disconnectParams = params
    instance.rpcClient.connection.disconnect()
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
    ...other
  }) {
    ['onAddressChange', 'onDisconnect', 'onNetworkChange'].forEach(event => {
      const handler = other[event] ?? (() => {})
      if (typeof handler !== 'function') throw new ArgumentError(event, 'a function', handler)
      this[event] = handler
    })

    this.name = name
    this._status = RPC_STATUS.DISCONNECTED

    const resolveAccountBase = this._resolveAccount
    this._resolveAccount = (account = this.addresses()[0]) => {
      if (typeof account === 'string') {
        decode(account, 'ak')
        if (!this.addresses().includes(account)) throw new UnAuthorizedAccountError(account)
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
      if (this._accounts == null) return []
      const current = Object.keys(this._accounts.current)[0]
      return [...current ? [current] : [], ...Object.keys(this._accounts.connected)]
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
    async connectToWallet (connection, { connectNode = false, name = 'wallet-node', select = false } = {}) {
      if (this._status === RPC_STATUS.CONNECTED) throw new AlreadyConnectedError('You are already connected to wallet')
      this.rpcClient = RpcClient({
        connection,
        onDisconnect: () => {
          this._status = RPC_STATUS.DISCONNECTED
          delete this.rpcClient
          delete this._accounts
          this.onDisconnect(this._disconnectParams)
          delete this._disconnectParams
        },
        methods: mapObject(METHOD_HANDLERS, ([key, value]) => [key, value.bind(null, this)])
      })
      const { node, ...walletInfo } = await this.rpcClient.request(
        METHODS.connect, { name: this.name, version: VERSION, connectNode }
      )
      if (connectNode) {
        if (node == null) throw new RpcConnectionError('Missing URLs of the Node')
        this.addNode(name, await Node(node), select)
      }
      this._status = RPC_STATUS.CONNECTED
      return walletInfo
    },
    /**
     * Disconnect from wallet
     * @function disconnectWallet
     * @instance
     * @rtype () => void
     * @return {void}
     */
    disconnectWallet () {
      this._ensureConnected()
      this.rpcClient.notify(METHODS.closeConnection, { reason: 'bye' })
      this.rpcClient.connection.disconnect()
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
      this._accounts = result.address
      return result
    },
    _ensureConnected () {
      if (this._status === RPC_STATUS.CONNECTED) return
      throw new NoWalletConnectedError('You are not connected to Wallet')
    },
    _ensureAccountAccess () {
      this._ensureConnected()
      if (this.addresses().length) return
      throw new UnsubscribedAccountError()
    }
  }
})
