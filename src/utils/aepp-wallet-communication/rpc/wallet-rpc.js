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
import TxObject from '../../../tx/tx-object'
import RpcClient from './rpc-client'
import { getBrowserAPI, getHandler, isValidAccounts, message, sendResponseMessage } from '../helpers'
import { ERRORS, METHODS, RPC_STATUS, VERSION, WALLET_TYPE } from '../schema'
import {
  IllegalArgumentError,
  TypeError,
  UnknownRpcClientError
} from '../../errors'
import { isAccountBase } from '../../../account/base'

const resolveOnAccount = (addresses, onAccount, opt = {}) => {
  if (!addresses.find(a => a === onAccount)) {
    if (typeof opt.onAccount !== 'object' || !isAccountBase(opt.onAccount)) throw new TypeError('Provided onAccount should be an AccountBase')
    onAccount = opt.onAccount
  }
  return onAccount
}

const NOTIFICATIONS = {
  [METHODS.closeConnection]: (instance, { client }) =>
    async (msg) => {
      client.disconnect(true)
      instance.onDisconnect(msg.params, client)
    }
}

const RESPONSES = {}

const REQUESTS = {
  // Store client info and prepare two fn for each client `connect` and `denyConnection`
  // which automatically prepare and send response for that client
  [METHODS.connect] (callInstance, instance, client, { name, networkId, version, icons }) {
    // Check if protocol and network is compatible with wallet
    if (version !== VERSION) return { error: ERRORS.unsupportedProtocol() }

    // Store new AEPP and wait for connection approve
    client.updateInfo({
      status: RPC_STATUS.WAITING_FOR_CONNECTION_APPROVE,
      name,
      networkId,
      icons,
      version
    })

    // Call onConnection callBack to notice Wallet about new AEPP
    return callInstance(
      'onConnection',
      { name, networkId, version },
      () => {
        client.updateInfo({ status: RPC_STATUS.CONNECTED })
        return { result: instance.getWalletInfo() }
      },
      (error) => {
        client.updateInfo({ status: RPC_STATUS.CONNECTION_REJECTED })
        return { error: ERRORS.connectionDeny(error) }
      }
    )
  },
  [METHODS.subscribeAddress] (callInstance, instance, client, { type, value }) {
    // Authorization check
    if (!client.isConnected()) return { error: ERRORS.notAuthorize() }

    return callInstance(
      'onSubscription',
      { type, value },
      async ({ accounts } = {}) => {
        try {
          const clientAccounts = accounts || instance.getAccounts()
          if (!isValidAccounts(clientAccounts)) {
            throw new TypeError('Invalid provided accounts object')
          }
          const subscription = client.updateSubscription(type, value)
          client.setAccounts(clientAccounts, { forceNotification: true })
          return {
            result: {
              subscription,
              address: clientAccounts
            }
          }
        } catch (e) {
          if (instance.debug) console.error(e)
          return { error: ERRORS.internalError(e.message) }
        }
      },
      (error) => ({ error: ERRORS.rejectedByUser(error) })
    )
  },
  [METHODS.address] (callInstance, instance, client) {
    // Authorization check
    if (!client.isConnected()) return { error: ERRORS.notAuthorize() }
    if (!client.isSubscribed()) return { error: ERRORS.notAuthorize() }

    return callInstance(
      'onAskAccounts',
      {},
      ({ accounts } = {}) => ({
        result: accounts ||
          [...Object.keys(client.accounts.current), ...Object.keys(client.accounts.connected)]
      }),
      (error) => ({ error: ERRORS.rejectedByUser(error) })
    )
  },
  [METHODS.sign] (callInstance, instance, client, options) {
    const { tx, onAccount, networkId, returnSigned = false } = options
    const address = onAccount || client.currentAccount
    // Update client with new networkId
    networkId && client.updateInfo({ networkId })
    // Authorization check
    if (!client.isConnected()) return { error: ERRORS.notAuthorize() }
    // Account permission check
    if (!client.hasAccessToAccount(address)) {
      return { error: ERRORS.permissionDeny(address) }
    }
    // NetworkId check
    if (!networkId || networkId !== instance.getNetworkId()) {
      return { error: ERRORS.unsupportedNetwork() }
    }

    return callInstance(
      'onSign',
      { tx, returnSigned, onAccount: address, txObject: TxObject.fromString(tx) },
      async (rawTx, opt = {}) => {
        let onAcc
        try {
          onAcc = resolveOnAccount(instance.addresses(), address, opt)
        } catch (e) {
          if (instance.debug) console.error(e)
          return { error: ERRORS.internalError(e.message) }
        }
        try {
          const t = rawTx || tx
          const result = returnSigned
            ? { signedTransaction: await instance.signTransaction(t, { onAccount: onAcc }) }
            : { transactionHash: await instance.send(t, { onAccount: onAcc, verify: false }) }
          return { result }
        } catch (e) {
          if (!returnSigned) {
            // Validate transaction
            const validation = await verifyTransaction(rawTx || tx, instance.selectedNode.instance)
            if (validation.length) return { error: ERRORS.invalidTransaction(validation) }
            // Send broadcast failed error to aepp
            return { error: ERRORS.broadcastFailed(e.message) }
          }
          throw e
        }
      },
      (error) => ({ error: ERRORS.rejectedByUser(error) })
    )
  },
  [METHODS.signMessage] (callInstance, instance, client, { message, onAccount }) {
    // Authorization check
    if (!client.isConnected()) return { error: ERRORS.notAuthorize() }
    const address = onAccount || client.currentAccount
    if (!client.hasAccessToAccount(address)) {
      return { error: ERRORS.permissionDeny(address) }
    }

    return callInstance(
      'onMessageSign',
      { message, onAccount: address },
      async (opt = {}) => {
        try {
          const onAcc = resolveOnAccount(instance.addresses(), address, opt)
          return {
            result: {
              signature: await instance.signMessage(message, {
                onAccount: onAcc,
                returnHex: true
              })
            }
          }
        } catch (e) {
          if (instance.debug) console.error(e)
          return { error: ERRORS.internalError(e.message) }
        }
      },
      (error) => ({ error: ERRORS.rejectedByUser(error) })
    )
  }
}

const handleMessage = (instance, id) => async (msg, origin) => {
  const client = instance.rpcClients[id]
  if (!msg.id) {
    return getHandler(
      NOTIFICATIONS, msg, { debug: instance.debug }
    )(instance, { client })(msg, origin)
  }
  if (Object.prototype.hasOwnProperty.call(client.callbacks, msg.id)) {
    return getHandler(RESPONSES, msg, { debug: instance.debug })(instance, { client })(msg, origin)
  } else {
    const { id, method } = msg
    const callInstance = (methodName, params, accept, deny) => () => new Promise(resolve => {
      instance[methodName](
        client,
        {
          id,
          method,
          params,
          accept: (...args) => resolve(accept(...args)),
          deny: (...args) => resolve(deny(...args))
        },
        origin
      )
    })
    // TODO make one structure for handler functions
    const errorObjectOrHandler = getHandler(REQUESTS, msg, { debug: instance.debug })(
      callInstance, instance, client, msg.params
    )
    const response = typeof errorObjectOrHandler === 'function' ? await errorObjectOrHandler() : errorObjectOrHandler
    sendResponseMessage(client)(id, method, response)
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
    debug = false,
    ...other
  } = {}) {
    [
      'onConnection', 'onSubscription', 'onSign', 'onDisconnect', 'onAskAccounts', 'onMessageSign'
    ].forEach(event => {
      const handler = other[event]
      if (typeof handler !== 'function') {
        throw new IllegalArgumentError(`Call-back for ${event} must be an function!`)
      }
      this[event] = handler
    })

    this.debug = debug
    this.rpcClients = {}
    this.name = name
    this.id = uuid()

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
            ...Object.entries(client.accounts.connected)
              .filter(([k, v]) => k !== address)
              .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {})
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
        .forEach(client => client.sendMessage(
          message(METHODS.updateNetwork, { networkId: this.getNetworkId() }), true
        ))
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
      this.rpcClients[id] = RpcClient({
        id,
        info: { status: RPC_STATUS.WAITING_FOR_CONNECTION_REQUEST },
        connection: clientConnection,
        handlers: [handleMessage(this, id), this.onDisconnect]
      })
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
        ...message(METHODS.readyToConnect, this.getWalletInfo())
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
      const runtime = getBrowserAPI(true).runtime
      return {
        id: runtime && runtime.id ? runtime.id : this.id,
        name: this.name,
        networkId: this.getNetworkId(),
        origin: window.location.origin,
        type: runtime && runtime.id ? WALLET_TYPE.extension : WALLET_TYPE.window
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
