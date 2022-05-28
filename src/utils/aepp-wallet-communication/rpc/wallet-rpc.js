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
  RpcBroadcastError, RpcConnectionDenyError, RpcInvalidTransactionError,
  RpcNotAuthorizeError, RpcPermissionDenyError, RpcRejectedByUserError, RpcUnsupportedProtocolError
} from '../schema'
import { ArgumentError, TypeError, UnknownRpcClientError } from '../../errors'
import { isAccountBase } from '../../../account/base'
import { filterObject, mapObject } from '../../other'
import { unpackTx } from '../../../tx/builder'

const resolveOnAccount = (addresses, onAccount, opt = {}) => {
  if (!addresses.find(a => a === onAccount)) {
    if (typeof opt.onAccount !== 'object' || !isAccountBase(opt.onAccount)) throw new TypeError('Provided onAccount should be an AccountBase')
    onAccount = opt.onAccount
  }
  return onAccount
}

const METHOD_HANDLERS = {
  [METHODS.closeConnection]: async (callInstance, instance, client, params) => {
    client.disconnect(true)
    instance.onDisconnect(params, client)
  },
  // Store client info and prepare two fn for each client `connect` and `denyConnection`
  // which automatically prepare and send response for that client
  [METHODS.connect] (
    callInstance,
    instance,
    client,
    { name, version, icons, connectNode }) {
    if (version !== VERSION) throw new RpcUnsupportedProtocolError()
    // Store new AEPP and wait for connection approve
    client.updateInfo({
      status: RPC_STATUS.WAITING_FOR_CONNECTION_APPROVE,
      name,
      icons,
      version,
      origin: window.location.origin,
      connectNode
    })

    // Call onConnection callBack to notice Wallet about new AEPP
    return callInstance(
      'onConnection',
      { name, version },
      ({ shareNode } = {}) => {
        client.updateInfo({ status: shareNode ? RPC_STATUS.NODE_BINDED : RPC_STATUS.CONNECTED })
        return {
          ...instance.getWalletInfo(),
          ...shareNode && { node: instance.selectedNode }
        }
      },
      (error) => {
        client.updateInfo({ status: RPC_STATUS.CONNECTION_REJECTED })
        throw new RpcConnectionDenyError(error)
      }
    )
  },
  [METHODS.subscribeAddress] (callInstance, instance, client, { type, value }) {
    if (!client.isConnected()) throw new RpcNotAuthorizeError()

    return callInstance(
      'onSubscription',
      { type, value },
      async ({ accounts } = {}) => {
        const clientAccounts = accounts || instance.getAccounts()
        const subscription = client.updateSubscription(type, value)
        client.setAccounts(clientAccounts, { forceNotification: true })
        return {
          subscription,
          address: clientAccounts
        }
      },
      (error) => { throw new RpcRejectedByUserError(error) }
    )
  },
  [METHODS.address] (callInstance, instance, client) {
    if (!client.isConnected() || !client.isSubscribed()) throw new RpcNotAuthorizeError()

    return callInstance(
      'onAskAccounts',
      {},
      ({ accounts } = {}) => accounts ||
        [...Object.keys(client.accounts.current), ...Object.keys(client.accounts.connected)],
      (error) => { throw new RpcRejectedByUserError(error) }
    )
  },
  [METHODS.sign] (callInstance, instance, client, message) {
    const { tx, onAccount, returnSigned = false } = message
    const address = onAccount || client.currentAccount
    if (!client.isConnected()) throw new RpcNotAuthorizeError()
    if (!client.hasAccessToAccount(address)) throw new RpcPermissionDenyError(address)

    return callInstance(
      'onSign',
      { tx, returnSigned, onAccount: address, txObject: unpackTx(tx) },
      async (rawTx, opt = {}) => {
        const onAcc = resolveOnAccount(instance.addresses(), address, opt)
        try {
          const t = rawTx || tx
          return returnSigned
            ? { signedTransaction: await instance.signTransaction(t, { onAccount: onAcc }) }
            : { transactionHash: await instance.send(t, { onAccount: onAcc, verify: false }) }
        } catch (e) {
          if (!returnSigned) {
            // Validate transaction
            const validation = await verifyTransaction(rawTx || tx, instance.selectedNode.instance)
            if (validation.length) throw new RpcInvalidTransactionError(validation)
            // Send broadcast failed error to aepp
            throw new RpcBroadcastError(e.message)
          }
          throw e
        }
      },
      (error) => { throw new RpcRejectedByUserError(error) }
    )
  },
  [METHODS.signMessage] (callInstance, instance, client, { message, onAccount }) {
    if (!client.isConnected()) throw new RpcNotAuthorizeError()
    const address = onAccount || client.currentAccount
    if (!client.hasAccessToAccount(address)) throw new RpcPermissionDenyError(address)

    return callInstance(
      'onMessageSign',
      { message, onAccount: address },
      async (opt = {}) => {
        const onAcc = resolveOnAccount(instance.addresses(), address, opt)
        return {
          signature: await instance.signMessage(message, {
            onAccount: onAcc,
            returnHex: true
          })
        }
      },
      (error) => { throw new RpcRejectedByUserError(error) }
    )
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
    debug = false,
    ...other
  } = {}) {
    [
      'onConnection', 'onSubscription', 'onSign', 'onDisconnect', 'onAskAccounts', 'onMessageSign'
    ].forEach(event => {
      const handler = other[event]
      if (typeof handler !== 'function') throw new ArgumentError(event, 'a function', handler)
      this[event] = handler
    })

    this.debug = debug
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
          client.sendMessage({
            method: METHODS.updateNetwork,
            params: {
              networkId: this.getNetworkId(),
              ...client.info.status === RPC_STATUS.NODE_BINDED && { node: this.selectedNode }
            }
          }, true)
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
        info: { status: RPC_STATUS.WAITING_FOR_CONNECTION_REQUEST },
        connection: clientConnection,
        onDisconnect: this.onDisconnect,
        methods: mapObject(METHOD_HANDLERS, ([key, value]) => [key, (params, origin) => {
          const callInstance = (methodName, params, accept, deny) => new Promise(resolve => {
            this[methodName](
              client,
              {
                method: key,
                params,
                accept: (...args) => resolve(accept(...args)),
                deny: (...args) => resolve(deny(...args))
              },
              origin
            )
          })
          return value(callInstance, this, client, params)
        }])
      })
      this.rpcClients[id] = client
      return id
    },
    /**
     * Share wallet info
     * Send shareWalletInfo message to notify AEPP about wallet
     * @function shareWalletInfo
     * @instance
     * @rtype (postFn: Function) => void
     * @param {Function} postFn Send message function like `(msg) => void`
     * @return {void}
     */
    shareWalletInfo (postFn) {
      postFn({
        jsonrpc: '2.0',
        method: METHODS.readyToConnect,
        params: this.getWalletInfo()
      })
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
