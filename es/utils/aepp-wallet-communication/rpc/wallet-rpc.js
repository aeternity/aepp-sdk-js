/**
 * RPC handler for WAELLET side
 *
 * @module @aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/wallet-rpc
 * @export WalletRpc
 * @example import WalletRpc from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/wallet-rpc'
 */
import Ae from '../../../ae'
import AccountMultiple from '../../../account/multiple'
import TxObject from '../../../tx/tx-object'

import { RpcClients } from './rpc-clients'
import { getBrowserAPI, getHandler, isValidAccounts, message, resolveOnAccount, sendResponseMessage } from '../helpers'
import { ERRORS, METHODS, RPC_STATUS, VERSION, WALLET_TYPE } from '../schema'
import { v4 as uuid } from 'uuid'

const rpcClients = RpcClients()

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
  [METHODS.aepp.connect] (callInstance, instance, client, { name, networkId, version, icons }) {
    // Check if protocol and network is compatible with wallet
    if (version !== VERSION) return { error: ERRORS.unsupportedProtocol() }

    // Store new AEPP and wait for connection approve
    rpcClients.updateClientInfo(client.id, {
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
        rpcClients.updateClientInfo(client.id, { status: RPC_STATUS.CONNECTED })
        return { result: instance.getWalletInfo() }
      },
      (error) => {
        rpcClients.updateClientInfo(client.id, { status: RPC_STATUS.CONNECTION_REJECTED })
        return { error: ERRORS.connectionDeny(error) }
      }
    )
  },
  [METHODS.aepp.subscribeAddress] (callInstance, instance, client, { type, value }) {
    // Authorization check
    if (!client.isConnected()) return { error: ERRORS.notAuthorize() }

    return callInstance(
      'onSubscription',
      { type, value },
      async ({ accounts } = {}) => {
        try {
          const clientAccounts = accounts || instance.getAccounts()
          if (!isValidAccounts(clientAccounts)) throw new Error('Invalid provided accounts object')
          const subscription = client.updateSubscription(type, value)
          client.setAccounts(clientAccounts, { forceNotification: true })
          return {
            result: {
              subscription,
              address: clientAccounts
            }
          }
        } catch (e) {
          console.error(e)
          return { error: ERRORS.internalError({ msg: e.message }) }
        }
      },
      (error) => ({ error: ERRORS.rejectedByUser(error) })
    )
  },
  [METHODS.aepp.address] (callInstance, instance, client) {
    // Authorization check
    if (!client.isConnected()) return { error: ERRORS.notAuthorize() }
    if (!client.isSubscribed()) return { error: ERRORS.notAuthorize() }

    return callInstance(
      'onAskAccounts',
      {},
      ({ accounts } = {}) => ({ result: accounts || [...Object.keys(client.accounts.current), ...Object.keys(client.accounts.connected)] }),
      (error) => ({ error: ERRORS.rejectedByUser(error) })
    )
  },
  [METHODS.aepp.sign] (callInstance, instance, client, { tx, onAccount, networkId, returnSigned = false }) {
    const address = onAccount || client.currentAccount
    // Update client with new networkId
    networkId && rpcClients.updateClientInfo(client.id, { networkId })
    // Authorization check
    if (!client.isConnected()) return { error: ERRORS.notAuthorize() }
    // Account permission check
    if (!client.hasAccessToAccount(address)) return { error: ERRORS.permissionDeny({ account: address }) }
    // NetworkId check
    if (!networkId || networkId !== instance.getNetworkId()) return { error: ERRORS.unsupportedNetwork() }

    return callInstance(
      'onSign',
      { tx, returnSigned, onAccount: address, txObject: TxObject.fromString(tx) },
      async (rawTx, opt = {}) => {
        let onAcc
        try {
          onAcc = resolveOnAccount(instance.addresses(), address, opt)
        } catch (e) {
          console.error(e)
          return { error: ERRORS.internalError({ msg: e.message }) }
        }
        try {
          return {
            result: {
              ...returnSigned
                ? { signedTransaction: await instance.signTransaction(rawTx || tx, { onAccount: onAcc }) }
                : { transactionHash: await instance.send(rawTx || tx, { onAccount: onAcc, verify: false }) }
            }
          }
        } catch (e) {
          if (!returnSigned) {
            // Validate transaction
            const validationResult = await instance.unpackAndVerify(rawTx || tx)
            if (validationResult.validation.length) return { error: ERRORS.invalidTransaction(validationResult) }
            // Send broadcast failed error to aepp
            return { error: ERRORS.broadcastFailde(e.message) }
          }
          throw e
        }
      },
      (error) => ({ error: ERRORS.rejectedByUser(error) })
    )
  },
  [METHODS.aepp.signMessage] (callInstance, instance, client, { message, onAccount }) {
    // Authorization check
    if (!client.isConnected()) return { error: ERRORS.notAuthorize() }
    const address = onAccount || client.currentAccount
    if (!client.hasAccessToAccount(address)) return { error: ERRORS.permissionDeny({ account: address }) }

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
          console.error(e)
          return { error: ERRORS.internalError({ msg: e.message }) }
        }
      },
      (error) => ({ error: ERRORS.rejectedByUser(error) })
    )
  }
}

const handleMessage = (instance, id) => async (msg, origin) => {
  const client = rpcClients.getClient(id)
  if (!msg.id) {
    return getHandler(NOTIFICATIONS, msg, { debug: instance.debug })(instance, { client })(msg, origin)
  }
  if (Object.prototype.hasOwnProperty.call(client.callbacks, msg.id)) {
    return getHandler(RESPONSES, msg, { debug: instance.debug })(instance, { client })(msg, origin)
  } else {
    const { id, method } = msg
    const callInstance = (methodName, params, accept, deny) => () => new Promise(resolve => {
      instance[methodName](
        client,
        client.addAction({ id, method, params }, [
          (...args) => resolve(accept(...args)), (...args) => resolve(deny(...args))
        ]),
        origin
      )
    })
    // TODO make one structure for handler functions
    const errorObjectOrHandler = getHandler(REQUESTS, msg, { debug: instance.debug })(callInstance, instance, client, msg.params)
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
 * @param {Function} onConnection Call-back function for incoming AEPP connection (Second argument contain function for accept/deny request)
 * @param {Function} onSubscription Call-back function for incoming AEPP account subscription (Second argument contain function for accept/deny request)
 * @param {Function} onSign Call-back function for incoming AEPP sign request (Second argument contain function for accept/deny request)
 * @param {Function} onAskAccounts Call-back function for incoming AEPP get address request (Second argument contain function for accept/deny request)
 * @param {Function} onMessageSign Call-back function for incoming AEPP sign message request (Second argument contain function for accept/deny request)
 * @param {Function} onDisconnect Call-back function for disconnect event
 * @return {Object}
 */
export const WalletRpc = Ae.compose(AccountMultiple, {
  init ({ name, onConnection, onSubscription, onSign, onDisconnect, onAskAccounts, onMessageSign, forceValidation = false, debug = false } = {}) {
    this.debug = debug
    const eventsHandlers = ['onConnection', 'onSubscription', 'onSign', 'onDisconnect', 'onMessageSign']
    // CallBacks for events
    this.onConnection = onConnection
    this.onSubscription = onSubscription
    this.onSign = onSign
    this.onDisconnect = onDisconnect
    this.onAskAccounts = onAskAccounts
    this.onMessageSign = onMessageSign

    eventsHandlers.forEach(event => {
      if (!forceValidation && typeof this[event] !== 'function') throw new Error(`Call-back for ${event} must be an function!`)
    })
    //
    this.name = name
    this.id = uuid()

    const _selectAccount = this.selectAccount.bind(this)
    const _addAccount = this.addAccount.bind(this)
    const _selectNode = this.selectNode.bind(this)

    // Overwrite AE methods
    this.selectAccount = (address, { condition = () => true } = {}) => {
      _selectAccount(address)
      rpcClients.operationByCondition(
        (client) =>
          client.isConnected() &&
          client.isSubscribed() &&
          client.hasAccessToAccount(address) &&
          condition(client),
        (client) =>
          client.setAccounts({
            current: { [address]: {} },
            connected: {
              ...client.accounts.current,
              ...Object.entries(client.accounts.connected)
                .reduce((acc, [k, v]) => ({ ...acc, ...k !== address ? { [k]: v } : {} }), {})
            }
          })
      )
    }
    this.addAccount = async (account, { select, meta = {}, condition = () => true } = {}) => {
      await _addAccount(account, { select })
      const address = await account.address()
      // Send notification 'update.address' to all Aepp which are subscribed for connected accounts
      rpcClients.operationByCondition(
        (client) =>
          client.isConnected() &&
          client.isSubscribed() &&
          condition(client),
        (client) =>
          client.setAccounts({
            current: { ...select ? { [address]: meta } : client.accounts.current },
            connected: {
              ...select ? client.accounts.current : { [address]: meta },
              ...client.accounts.connected
            }
          })
      )
    }
    this.selectNode = (name) => {
      _selectNode(name)
      // Send notification 'update.network' to all Aepp which connected
      rpcClients.sendNotificationByCondition(
        message(METHODS.updateNetwork, { networkId: this.getNetworkId() }),
        (client) => client.isConnected()
      )
    }
  },
  methods: {
    /**
     * Get RpcClients object which contain all connected AEPPS
     * @function getClients
     * @instance
     * @rtype () => Object
     * @return {Object}
     */
    getClients () {
      return rpcClients
    },
    /**
     * Remove specific RpcClient by ID
     * @function removeRpcClient
     * @instance
     * @rtype (id: string) => Boolean
     * @param {String} id Client ID
     * @param {Object} [opt = {}]
     * @return {Object}
     */
    removeRpcClient (id, opt = { forceConnectionClose: false }) {
      return rpcClients.removeClient(id, opt)
    },
    /**
     * Add new AEPP connection
     * @function addRpcClient
     * @instance
     * @rtype (clientConnection: Object) => Object
     * @param {Object} clientConnection AEPP connection object
     * @return {String} Client ID
     */
    addRpcClient (clientConnection) {
      // @TODO  detect if aepp has some history based on origin????: if yes use this instance for connection
      const id = uuid()
      rpcClients.addClient(
        id,
        {
          id,
          info: { status: RPC_STATUS.WAITING_FOR_CONNECTION_REQUEST },
          connection: clientConnection,
          handlers: [handleMessage(this, id), this.onDisconnect]
        }
      )
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
        ...message(METHODS.wallet.readyToConnect, { ...this.getWalletInfo() })
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

export default WalletRpc
