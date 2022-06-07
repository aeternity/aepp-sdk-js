/**
 * RPC handler for WAELLET side
 *
 * @module @aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/wallet-rpc
 * @export WalletRpc
 * @example
 * import WalletRpc from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/wallet-rpc'
 */
import { v4 as uuid } from '@aeternity/uuid'
import Ae from '../../../ae'
import verifyTransaction from '../../../tx/validator'
import AccountMultiple from '../../../account/multiple'
import RpcClient from './RpcClient'
import {
  METHODS, RPC_STATUS, VERSION,
  RpcBroadcastError, RpcInvalidTransactionError,
  RpcNotAuthorizeError, RpcPermissionDenyError, RpcUnsupportedProtocolError, SUBSCRIPTION_TYPES
} from '../schema'
import { ArgumentError, UnknownRpcClientError } from '../../errors'
import { mapObject } from '../../other'
import { unpackTx } from '../../../tx/builder'

const METHOD_HANDLERS = {
  [METHODS.closeConnection]: async (callInstance, instance, client, clientInfo, params) => {
    instance._disconnectRpcClient(clientInfo.id)
    instance.onDisconnect(params, clientInfo.id)
  },
  // Store client info and prepare two fn for each client `connect` and `denyConnection`
  // which automatically prepare and send response for that client
  async [METHODS.connect] (
    callInstance,
    instance,
    client,
    clientInfo,
    { name, version, icons, connectNode }) {
    if (version !== VERSION) throw new RpcUnsupportedProtocolError()

    await callInstance('onConnection', { name, icons, connectNode })
    clientInfo.status = RPC_STATUS.CONNECTED
    clientInfo.connectNode = connectNode
    return {
      ...instance.getWalletInfo(),
      ...connectNode && { node: instance.selectedNode }
    }
  },
  async [METHODS.subscribeAddress] (callInstance, instance, client, clientInfo, { type, value }) {
    if (!instance._isRpcClientConnected(clientInfo.id)) throw new RpcNotAuthorizeError()

    await callInstance('onSubscription', { type, value })

    switch (type) {
      case SUBSCRIPTION_TYPES.subscribe:
        clientInfo.addressSubscription.add(value)
        break
      case SUBSCRIPTION_TYPES.unsubscribe:
        clientInfo.addressSubscription.delete(value)
        break
    }

    return {
      subscription: Array.from(clientInfo.addressSubscription),
      address: instance.getAccounts()
    }
  },
  async [METHODS.address] (callInstance, instance, client, clientInfo) {
    if (!instance._isRpcClientSubscribed(clientInfo.id)) throw new RpcNotAuthorizeError()
    await callInstance('onAskAccounts')
    return instance.addresses()
  },
  async [METHODS.sign] (
    callInstance, instance, client, clientInfo, { tx, onAccount, returnSigned }
  ) {
    if (!instance._isRpcClientConnected(clientInfo.id)) throw new RpcNotAuthorizeError()
    onAccount ??= await instance.address()
    if (!instance.addresses().includes(onAccount)) throw new RpcPermissionDenyError(onAccount)

    const overrides = await callInstance(
      'onSign', { tx, returnSigned, onAccount, txObject: unpackTx(tx) }
    )
    onAccount = overrides?.onAccount ?? onAccount
    tx = overrides?.tx ?? tx
    if (returnSigned) {
      return { signedTransaction: await instance.signTransaction(tx, { onAccount }) }
    }
    try {
      return { transactionHash: await instance.send(tx, { onAccount, verify: false }) }
    } catch (error) {
      const validation = await verifyTransaction(tx, instance.selectedNode.instance)
      if (validation.length) throw new RpcInvalidTransactionError(validation)
      throw new RpcBroadcastError(error.message)
    }
  },
  async [METHODS.signMessage] (callInstance, instance, client, clientInfo, { message, onAccount }) {
    if (!instance._isRpcClientConnected(clientInfo.id)) throw new RpcNotAuthorizeError()
    onAccount ??= await instance.address()
    if (!instance.addresses().includes(onAccount)) throw new RpcPermissionDenyError(onAccount)

    const overrides = await callInstance('onMessageSign', { message, onAccount })
    onAccount = overrides?.onAccount ?? onAccount
    return { signature: await instance.signMessage(message, { onAccount, returnHex: true }) }
  }
}

/**
 * Contain functionality for aepp interaction and managing multiple aepps
 * @alias module:@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/wallet-rpc
 * @function
 * @rtype Stamp
 * @param {Object} param Init params object
 * @param {String=} [param.name] Wallet name
 * @param {Function} onConnection Call-back function for incoming AEPP connection
 * @param {Function} onSubscription Call-back function for incoming AEPP account subscription
 * @param {Function} onSign Call-back function for incoming AEPP sign request
 * @param {Function} onAskAccounts Call-back function for incoming AEPP get address request
 * @param {Function} onMessageSign Call-back function for incoming AEPP sign message request
   * Second argument of incoming call-backs contain function for accept/deny request
 * @param {Function} onDisconnect Call-back function for disconnect event
 * @return {Object}
 */
export default Ae.compose(AccountMultiple, {
  init ({
    name,
    id,
    type,
    ...other
  } = {}) {
    [
      'onConnection', 'onSubscription', 'onSign', 'onDisconnect', 'onAskAccounts', 'onMessageSign'
    ].forEach(event => {
      const handler = other[event]
      if (typeof handler !== 'function') throw new ArgumentError(event, 'a function', handler)
      this[event] = handler
    })

    this.rpcClients = {}
    this._rpcClientsInfo = {}
    this.name = name
    this.id = id
    this._type = type

    const _selectAccount = this.selectAccount.bind(this)
    const _addAccount = this.addAccount.bind(this)
    const _selectNode = this.selectNode.bind(this)

    const pushAccountsToApps = () => Object.keys(this.rpcClients)
      .filter(clientId => this._isRpcClientSubscribed(clientId))
      .map(clientId => this.rpcClients[clientId])
      .forEach(client => client.notify(METHODS.updateAddress, this.getAccounts()))
    this.selectAccount = (address) => {
      _selectAccount(address)
      pushAccountsToApps()
    }
    this.addAccount = async (account, { select } = {}) => {
      await _addAccount(account, { select })
      pushAccountsToApps()
    }
    this.selectNode = (name) => {
      _selectNode(name)
      Object.keys(this.rpcClients)
        .filter(clientId => this._isRpcClientConnected(clientId))
        .forEach(clientId => {
          this.rpcClients[clientId].notify(METHODS.updateNetwork, {
            networkId: this.getNetworkId(),
            ...this._rpcClientsInfo[clientId].connectNode && { node: this.selectedNode }
          })
        })
    }
  },
  methods: {
    _isRpcClientSubscribed (clientId) {
      return this._isRpcClientConnected(clientId) &&
        this._rpcClientsInfo[clientId].addressSubscription.size !== 0
    },
    _isRpcClientConnected (clientId) {
      return RPC_STATUS.CONNECTED === this._rpcClientsInfo[clientId].status &&
        this.rpcClients[clientId].connection.isConnected()
    },
    _disconnectRpcClient (clientId) {
      const client = this.rpcClients[clientId]
      const clientInfo = this._rpcClientsInfo[clientId]
      if (client == null || clientInfo == null) throw new UnknownRpcClientError(clientId)
      client.connection.disconnect()
      clientInfo.status = RPC_STATUS.DISCONNECTED
      clientInfo.addressSubscription = new Set()
    },
    /**
     * Remove specific RpcClient by ID
     * @function removeRpcClient
     * @instance
     * @rtype (id: string) => void
     * @param {String} id Client ID
     * @return {void}
     */
    removeRpcClient (id) {
      this._disconnectRpcClient(id)
      delete this.rpcClients[id]
      delete this._rpcClientsInfo[id]
    },
    /**
     * Add new client by AEPP connection
     * @function addRpcClient
     * @instance
     * @rtype (clientConnection: Object) => Object
     * @param {Object} clientConnection AEPP connection object
     * @return {String} Client ID
     */
    addRpcClient (clientConnection) {
      // @TODO  detect if aepp has some history based on origin????
      // if yes use this instance for connection
      const id = uuid()
      const client = new RpcClient(
        clientConnection,
        this.onDisconnect,
        mapObject(METHOD_HANDLERS, ([key, value]) => [key, (params, origin) => {
          const callInstance = (methodName, params) =>
            this[methodName](
              client,
              {
                method: key,
                params
              },
              origin
            )
          return value(callInstance, this, client, this._rpcClientsInfo[id], params)
        }])
      )
      this.rpcClients[id] = client
      this._rpcClientsInfo[id] = {
        id,
        status: RPC_STATUS.WAITING_FOR_CONNECTION_REQUEST,
        addressSubscription: new Set()
      }
      return id
    },
    /**
     * Share wallet info
     * Send shareWalletInfo message to notify AEPP about wallet
     * @function shareWalletInfo
     * @instance
     * @rtype (postFn: Function) => void
     * @param {Function} clientId ID of RPC client send message to
     * @return {void}
     */
    shareWalletInfo (clientId) {
      this.rpcClients[clientId].notify(METHODS.readyToConnect, this.getWalletInfo())
    },
    /**
     * Get Wallet info object
     * @function getWalletInfo
     * @instance
     * @rtype () => Object
     * @return {Object} Object with wallet information(id, name, network, ...)
     */
    getWalletInfo () {
      return {
        id: this.id,
        name: this.name,
        networkId: this.getNetworkId(),
        origin: window.location.origin,
        type: this._type
      }
    },
    /**
     * Get Wallet accounts
     * @function getAccounts
     * @instance
     * @rtype () => Object
     * @return {Object} Object with accounts information({ connected: Object, current: Object })
     */
    getAccounts () {
      return {
        current: this.selectedAddress ? { [this.selectedAddress]: {} } : {},
        connected: this.addresses()
          .filter(a => a !== this.selectedAddress)
          .reduce((acc, a) => ({ ...acc, [a]: {} }), {})
      }
    }
  }
})
