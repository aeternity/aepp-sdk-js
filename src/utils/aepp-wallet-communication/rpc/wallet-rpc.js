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
import RpcClient from './rpc-client'
import {
  METHODS, RPC_STATUS, VERSION,
  RpcBroadcastError, RpcInvalidTransactionError,
  RpcNotAuthorizeError, RpcPermissionDenyError, RpcUnsupportedProtocolError
} from '../schema'
import { ArgumentError, UnknownRpcClientError } from '../../errors'
import { filterObject, mapObject } from '../../other'
import { unpackTx } from '../../../tx/builder'

const METHOD_HANDLERS = {
  [METHODS.closeConnection]: async (callInstance, instance, client, params) => {
    client.disconnect(true)
    instance.onDisconnect(params, client)
  },
  // Store client info and prepare two fn for each client `connect` and `denyConnection`
  // which automatically prepare and send response for that client
  async [METHODS.connect] (
    callInstance,
    instance,
    client,
    { name, version, icons, connectNode }) {
    if (version !== VERSION) throw new RpcUnsupportedProtocolError()

    await callInstance('onConnection', { name, icons, connectNode })
    client.status = connectNode ? RPC_STATUS.NODE_BINDED : RPC_STATUS.CONNECTED
    return {
      ...instance.getWalletInfo(),
      ...connectNode && { node: instance.selectedNode }
    }
  },
  async [METHODS.subscribeAddress] (callInstance, instance, client, { type, value }) {
    if (!client.isConnected()) throw new RpcNotAuthorizeError()

    const accounts = await callInstance('onSubscription', { type, value })
    const clientAccounts = accounts || instance.getAccounts()
    const subscription = client.updateSubscription(type, value)
    client.setAccounts(clientAccounts, { forceNotification: true })
    return {
      subscription,
      address: clientAccounts
    }
  },
  async [METHODS.address] (callInstance, instance, client) {
    if (!client.isConnected() || !client.isSubscribed()) throw new RpcNotAuthorizeError()

    const accounts = await callInstance('onAskAccounts') ?? client.accounts
    return [...Object.keys(accounts.current), ...Object.keys(accounts.connected)]
  },
  async [METHODS.sign] (callInstance, instance, client, { tx, onAccount, returnSigned }) {
    onAccount ??= client.currentAccount
    if (!client.isConnected()) throw new RpcNotAuthorizeError()
    if (!client.hasAccessToAccount(onAccount)) throw new RpcPermissionDenyError(onAccount)

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
  async [METHODS.signMessage] (callInstance, instance, client, { message, onAccount }) {
    if (!client.isConnected()) throw new RpcNotAuthorizeError()
    onAccount ??= client.currentAccount
    if (!client.hasAccessToAccount(onAccount)) throw new RpcPermissionDenyError(onAccount)

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
    this.name = name
    this.id = id
    this._type = type

    const _selectAccount = this.selectAccount.bind(this)
    const _addAccount = this.addAccount.bind(this)
    const _selectNode = this.selectNode.bind(this)

    // Overwrite AE methods
    this.selectAccount = (address, { condition = () => true } = {}) => {
      _selectAccount(address)
      Object.values(this.rpcClients)
        .filter(client => client.isConnected() && client.isSubscribed() &&
          client.hasAccessToAccount(address) && condition(client))
        .forEach(client => client.setAccounts({
          current: { [address]: {} },
          connected: {
            ...client.accounts.current,
            ...filterObject(client.accounts.connected, ([k]) => k !== address)
          }
        }))
    }
    this.addAccount = async (account, { select, meta = {}, condition = () => true } = {}) => {
      await _addAccount(account, { select })
      const address = await account.address()
      // Send notification 'update.address' to all Aepp which are subscribed for connected accounts
      Object.values(this.rpcClients)
        .filter(client => client.isConnected() && client.isSubscribed() && condition(client))
        .forEach(client => client.setAccounts({
          current: { ...select ? { [address]: meta } : client.accounts.current },
          connected: {
            ...select ? client.accounts.current : { [address]: meta },
            ...client.accounts.connected
          }
        }))
    }
    this.selectNode = (name) => {
      _selectNode(name)
      // Send notification 'update.network' to all Aepp which connected
      Object.values(this.rpcClients)
        .filter(client => client.isConnected())
        .forEach(client => {
          client.notify(METHODS.updateNetwork, {
            networkId: this.getNetworkId(),
            ...client.status === RPC_STATUS.NODE_BINDED && { node: this.selectedNode }
          })
        })
    }
  },
  methods: {
    /**
     * Remove specific RpcClient by ID
     * @function removeRpcClient
     * @instance
     * @rtype (id: string) => void
     * @param {String} id Client ID
     * @param {Object} [opt = {}]
     * @return {void}
     */
    removeRpcClient (id, { forceConnectionClose = false } = {}) {
      const client = this.rpcClients[id]
      if (!client) throw new UnknownRpcClientError(id)
      client.disconnect(forceConnectionClose)
      delete this.rpcClients[id]
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
      const client = RpcClient({
        id,
        connection: clientConnection,
        onDisconnect: this.onDisconnect,
        methods: mapObject(METHOD_HANDLERS, ([key, value]) => [key, (params, origin) => {
          const callInstance = (methodName, params) =>
            this[methodName](
              client,
              {
                method: key,
                params
              },
              origin
            )
          return value(callInstance, this, client, params)
        }])
      })
      client.status = RPC_STATUS.WAITING_FOR_CONNECTION_REQUEST
      this.rpcClients[id] = client
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
