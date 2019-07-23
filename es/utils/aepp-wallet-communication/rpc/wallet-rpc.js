import Ae from '../../../ae'
import Accounts from '../../../accounts'
import Selector from '../../../account/selector'

import { WalletClients } from './wallet-clients'
import { getBrowserAPI, message, sendResponseMessage } from '../helpers'
import { ERRORS, METHODS, RPC_STATUS, VERSION, WALLET_TYPE, SUBSCRIPTION_VALUES } from '../schema'
import uuid from 'uuid/v4'
import { unpackTx } from '../../../tx/builder'

const rpcClients = WalletClients()

const NOTIFICATIONS = {
  [METHODS.updateNetwork]: (instance) =>
    (msg) => {
      instance.onNetworkChange(msg.params)
    },
  [METHODS.closeConnection]: (instance, { client }) =>
    (msg) => {
      client.info.status = RPC_STATUS.DISCONNECTED
      instance.onDisconnect(msg.params, client)
    }
}

const RESPONSES = {}

const REQUESTS = {
  // Store client info and prepare two fn for each client `connect` and `denyConnection`
  // which automatically prepare and send response for that client
  [METHODS.aepp.connect]: (instance, { client }) =>
    ({ id, method, params: { name, network, version, icons } }) => {
      // Check if protocol and network is compatible with wallet
      if (version !== VERSION) return sendResponseMessage(client)(id, method, { error: ERRORS.unsupportedProtocol() })
      if (network !== instance.getNetworkId()) return sendResponseMessage(client)(id, method, { error: ERRORS.unsupportedNetwork() })

      // Action methods
      const accept = (id) => () => {
        rpcClients.updateClientInfo(client.id, { status: RPC_STATUS.CONNECTED })
        sendResponseMessage(client)(id, method, { result: instance.getWalletInfo() })
      }
      const deny = (id) => (error) => {
        rpcClients.updateClientInfo(client.id, { status: RPC_STATUS.CONNECTION_REJECTED })
        sendResponseMessage(client)(id, METHODS.aepp.connect, { error: ERRORS.connectionDeny(error) })
      }

      // Store new AEPP and wait for connection approve
      rpcClients.updateClientInfo(client.id, {
        status: RPC_STATUS.WAITING_FOR_CONNECTION_APPROVE,
        name,
        network,
        icons,
        version
      })

      // Call onConnection callBack top notice extension about new AEPP
      instance.onConnection(client, client.addAction({
        id,
        method,
        params: { name, network, version }
      }, [accept(id), deny(id)]))
    },
  [METHODS.aepp.subscribeAddress]: (instance, { client }) =>
    ({ id, method, params: { type, value } }) => {
      // Authorization check
      if (!client.isConnected()) return sendResponseMessage(client)(id, method, { error: ERRORS.notAuthorize() })

      const accept = (id) =>
        () => sendResponseMessage(client)(
          id,
          method,
          {
            result: {
              subscription: client.updateSubscription(type, value),
              address: instance.getAccounts()
            }
          })
      const deny = (id) => (error) => sendResponseMessage(client)(id, method, { error: ERRORS.subscriptionDeny(error) })

      instance.onSubscription(client, client.addAction({ id, method, params: { type, value } }, [accept(id), deny(id)]))
    },
  [METHODS.aepp.sign]: (instance, { client }) =>
    ({ id, method, params: { tx, opt, locked = false, returnSigned = false } }) => {
      // Authorization check
      if (!client.isConnected()) return sendResponseMessage(client)(id, method, { error: ERRORS.notAuthorize() })
      // NetworkId check
      if (client.info.network !== instance.getNetworkId()) return sendResponseMessage(client)(id, method, { error: ERRORS.unsupportedNetwork() })

      const accept = (id) => async (rawTx) => {
        try {
          const result = {
            result: {
              ...returnSigned
                ? { signedTransaction: await instance.signTransaction(locked ? tx : rawTx || tx, {}) }
                : { transactionHash: await instance.send(locked ? tx : rawTx || tx, {}) }
            }
          }
          sendResponseMessage(client)(
            id,
            method,
            result
          )
        } catch (e) {
          if (!returnSigned) {
            // Send broadcast failed error to aepp
            return sendResponseMessage(client)(id, method, { error: ERRORS.broadcastFailde(e.message) })
          }
          throw e
        }
      }

      const deny = (id) => (error) => sendResponseMessage(client)(id, method, { error: ERRORS.signDeny(error) })

      instance.onSign(client, client.addAction({ id, method, params: { tx, returnSigned, locked }, meta: unpackTx(tx) }, [accept(id), deny(id)]))
    }
}

const handleMessage = (instance, id) => async (msg) => {
  const client = rpcClients.getClient(id)
  if (!msg.id) {
    return getHandler(NOTIFICATIONS, msg)(instance, { client })(msg)
  }
  if (client.callbacks.hasOwnProperty(msg.id)) {
    return getHandler(RESPONSES, msg)(instance, { client })(msg)
  } else {
    return getHandler(REQUESTS, msg)(instance, { client })(msg)
  }
}

const getHandler = (schema, msg) => {
  const handler = schema[msg.method]
  if (!handler || typeof handler !== 'function') {
    console.log(`Unknown message method ${msg.method}`)
    return () => () => true
  }
  return handler
}

export const WalletRpc = Ae.compose(Accounts, Selector, {
  init ({ icons, name, onConnection, onSubscription, onSign, onDisconnect, onNetworkChange }) {
    // CallBacks for events
    this.onConnection = onConnection
    this.onSubscription = onSubscription
    this.onSign = onSign
    this.onDisconnect = onDisconnect
    this.onNetworkChange = onNetworkChange
    //
    this.name = name
    this.id = uuid()
  },
  methods: {
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
    },
    shareWalletInfo (postFn) {
      postFn(message(METHODS.wallet.readyToConnect, { ...this.getWalletInfo(), jsonrpc: '2.0' }))
    },
    getWalletInfo () {
      return {
        id: getBrowserAPI().runtime.id || this.id,
        name: this.name,
        network: this.getNetworkId(),
        origin: window.location.origin,
        type: getBrowserAPI().runtime.id ? WALLET_TYPE.extension : WALLET_TYPE.window
      }
    },
    getAccounts () {
      return {
        current: this.Selector.address ? { [this.Selector.address]: this.accounts[this.Selector.address].meta } : {},
        connected: Object
          .entries(this.address)
          .filter(a => a[0] !== this.Selector.address)
          .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})
      }
    },
    async addAccount (account, { select, meta }) {
      const address = await account.address()
      this.accounts[address] = { account, meta }
      if (select) return this.selectAccount(address)
      // Send notification 'update.address' to all Aepp which are subscribed for connected accounts
      rpcClients.sentNotificationByCondition(
        message(METHODS.updateNetwork, { network: this.getNetworkId() }),
        (client) => client.isConnected() && client.addressSubscription.includes(SUBSCRIPTION_VALUES.connected)
      )
    },
    selectAccount (address) {
      this.Selector.address = address
      // Send notification 'update.address' to all Aepp which are subscribed for current account update
      rpcClients.sentNotificationByCondition(
        message(METHODS.wallet.updateAddress, this.getAccounts()),
        (client) => client.addressSubscription.includes(SUBSCRIPTION_VALUES.current) && client.isConnected())
    },
    setNode (node) {
      Object.assign(this, node)
      // Send notification 'update.network' to all Aepp which connected
      rpcClients.sentNotificationByCondition(
        message(METHODS.updateNetwork, { network: this.getNetworkId() }),
        (client) => client.isConnected()
      )
    }
  }
})

export default WalletRpc
