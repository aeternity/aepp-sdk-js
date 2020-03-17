/**
 * RPC handler for WAELLET side
 *
 * @module @aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/wallet-rpc
 * @export WalletRpc
 * @example import WalletRpc from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/wallet-rpc'
 */
import Ae from '../../../ae'
import Accounts from '../../../accounts'
import Selector from '../../../account/selector'

import { RpcClients } from './rpc-clients'
import { getBrowserAPI, getHandler, message, sendResponseMessage } from '../helpers'
import { ERRORS, METHODS, RPC_STATUS, VERSION, WALLET_TYPE, SUBSCRIPTION_VALUES } from '../schema'
import { v4 as uuid } from 'uuid'

const rpcClients = RpcClients()

const NOTIFICATIONS = {
  [METHODS.closeConnection]: (instance, { client }) =>
    (msg) => {
      client.disconnect(true)
      instance.onDisconnect(msg.params, client)
    }
}

const RESPONSES = {}

const REQUESTS = {
  // Store client info and prepare two fn for each client `connect` and `denyConnection`
  // which automatically prepare and send response for that client
  async [METHODS.aepp.connect] (callInstance, instance, client, { name, networkId, version, icons }) {
    // Check if protocol and network is compatible with wallet
    if (version !== VERSION) return { error: ERRORS.unsupportedProtocol() }
    if (networkId !== instance.getNetworkId()) return { error: ERRORS.unsupportedNetwork() }

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
  async [METHODS.aepp.subscribeAddress] (callInstance, instance, client, { type, value }) {
    // Authorization check
    if (!client.isConnected()) return { error: ERRORS.notAuthorize() }

    return callInstance(
      'onSubscription',
      { type, value },
      async (accounts) => {
        const subscription = client.updateSubscription(type, value)
        const clientAccounts = accounts || instance.getAccounts()
        await client.setAccounts(clientAccounts, { forceEvent: true })
        return {
          result: {
            subscription,
            address: clientAccounts
          }
        }
      },
      (error) => ({ error: ERRORS.rejectedByUser(error) })
    )
  },
  async [METHODS.aepp.address] (callInstance, instance, client) {
    // Authorization check
    if (!client.isConnected()) return { error: ERRORS.notAuthorize() }
    if (!client.hasAccessToAccount(await instance.address())) return { error: ERRORS.notAuthorize({ account: await instance.address() }) }

    return callInstance(
      'onAskAccounts',
      {},
      ({ accounts }) => ({ result: accounts || client.accounts ? [...Object.keys(client.accounts.current), ...Object.keys(client.accounts.connected)] : instance.addresses() }),
      (error) => ({ error: ERRORS.rejectedByUser(error) })
    )
  },
  async [METHODS.aepp.sign] (callInstance, instance, client, { tx, onAccount, returnSigned = false }) {
    const address = onAccount || await instance.address({ onAccount })
    // Authorization check
    if (!client.isConnected()) return { error: ERRORS.notAuthorize() }
    // NetworkId check
    if (client.info.networkId !== instance.getNetworkId()) return { error: ERRORS.unsupportedNetwork() }
    // Account permission check
    if (!client.hasAccessToAccount(address)) return { error: ERRORS.notAuthorize({ account: address }) }

    return callInstance(
      'onSign',
      { tx, returnSigned, onAccount },
      async (rawTx, opt = {}) => {
        try {
          return {
            result: {
              ...returnSigned
                ? { signedTransaction: await instance.signTransaction(rawTx || tx, { onAccount: opt.onAccount || client.getCurrentAccount({ onAccount }) }) }
                : { transactionHash: await instance.send(rawTx || tx, { onAccount: opt.onAccount || client.getCurrentAccount({ onAccount }), verify: false }) }
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
  async [METHODS.aepp.signMessage] (callInstance, instance, client, { message, onAccount }) {
    // Authorization check
    if (!client.isConnected()) return { error: ERRORS.notAuthorize() }
    const address = onAccount || await instance.address({ onAccount })
    if (!client.hasAccessToAccount(address)) return { error: ERRORS.notAuthorize({ account: address }) }

    return callInstance(
      'onMessageSign',
      { message, onAccount },
      async (opt = {}) => ({
        result: { signature: await instance.signMessage(message, { onAccount: opt.onAccount || client.getCurrentAccount({ onAccount }), returnHex: true }) }
      }),
      (error) => ({ error: ERRORS.rejectedByUser(error) })
    )
  }
}

const handleMessage = (instance, id) => async (msg, origin) => {
  const client = rpcClients.getClient(id)
  if (!msg.id) {
    return getHandler(NOTIFICATIONS, msg)(instance, { client })(msg, origin)
  }
  if (Object.prototype.hasOwnProperty.call(client.callbacks, msg.id)) {
    return getHandler(RESPONSES, msg)(instance, { client })(msg, origin)
  } else {
    const { id, method } = msg
    const callInstance = (methodName, params, accept, deny) => new Promise(resolve => {
      instance[methodName](
        client,
        client.addAction({ id, method, params }, [
          (...args) => resolve(accept(...args)), (...args) => resolve(deny(...args))
        ]),
        origin
      )
    })
    const response = await getHandler(REQUESTS, msg)(callInstance, instance, client, msg.params)
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
export const WalletRpc = Ae.compose(Accounts, Selector, {
  init ({ name, onConnection, onSubscription, onSign, onDisconnect, onAskAccounts, onMessageSign }) {
    const eventsHandlers = ['onConnection', 'onSubscription', 'onSign', 'onDisconnect', 'onMessageSign']
    // CallBacks for events
    this.onConnection = onConnection
    this.onSubscription = onSubscription
    this.onSign = onSign
    this.onDisconnect = onDisconnect
    this.onAskAccounts = onAskAccounts
    this.onMessageSign = onMessageSign

    eventsHandlers.forEach(event => {
      if (typeof this[event] !== 'function') throw new Error(`Call-back for ${event} must be an function!`)
    })
    //
    this.name = name
    this.id = uuid()

    const _selectAccount = this.selectAccount.bind(this)
    const _addAccount = this.addAccount.bind(this)
    const _selectNode = this.selectNode.bind(this)

    // Overwrite AE methods
    this.selectAccount = (address) => {
      _selectAccount(address)
      rpcClients.operationByCondition(
        (client) =>
          (
            (client.addressSubscription.includes(SUBSCRIPTION_VALUES.current) ||
              client.addressSubscription.includes(SUBSCRIPTION_VALUES.connected)) &&
            [...Object.keys(client.accounts.current), ...(Object.keys(client.accounts.connected))].includes(address)
          ) &&
          client.isConnected(),
        (client) => {
          client.setAccounts({
            current: { [address]: {} },
            connected: {
              ...client.accounts.current,
              ...Object.entries(client.connected)
                .reduce((acc, [k, v]) => ({ ...acc, ...k !== address ? { [k]: v } : {} }), {})
            }
          })
        }
      )
    }
    this.addAccount = async (account, { select, meta } = {}) => {
      await _addAccount(account, { select })
      // Send notification 'update.address' to all Aepp which are subscribed for connected accounts
      rpcClients.sentNotificationByCondition(
        message(METHODS.wallet.updateAddress, this.getAccounts()),
        (client) =>
          client.isConnected() &&
          (
            client.addressSubscription.includes(SUBSCRIPTION_VALUES.connected) ||
            (select && client.addressSubscription.includes(SUBSCRIPTION_VALUES.current))
          ),
        (client, message) => {
          const { whiteListedAccounts } = client
          if (!whiteListedAccounts) return message
          return {
            ...message,
            params: {
              connected: Object.keys(message.params.connected)
                .filter(a => whiteListedAccounts.includes(a))
                .reduce((acc, a) => ({ ...acc, [a]: {} }), {}),
              current: whiteListedAccounts.includes(Object.keys(message.params.current)[0]) ? message.params.current : {}
            }
          }
        }
      )
    }
    this.selectNode = (name) => {
      _selectNode(name)
      // Send notification 'update.network' to all Aepp which connected
      rpcClients.sentNotificationByCondition(
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
        current: this.Selector.address ? { [this.Selector.address]: {} } : {},
        connected: this.addresses()
          .filter(a => a !== this.Selector.address)
          .reduce((acc, a) => ({ ...acc, [a]: {} }), {})
      }
    }
  }
})

export default WalletRpc
