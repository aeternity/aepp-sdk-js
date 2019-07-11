import Ae from '../../../ae'
import Accounts from '../../../accounts'
import Selector from '../../../account/selector'

import { WalletClients } from './wallet-clients'
import { getBrowserAPI, message, sendResponseMessage } from '../helpers'
import { ERRORS, METHODS } from '../schema'
import uuid from 'uuid/v4'

const rpcClients = WalletClients()

const NOTIFICATIONS = {
  [METHODS.wallet.updateNetwork]: (instance) =>
    (msg) => {
      instance.onNetworkChange(msg.params)
    },
  [METHODS.closeConnection]: (instance) =>
    (msg) => {
      instance.onDisconnect(msg.params)
    }
}

const RESPONSES = {}

const REQUESTS = {
  // Store client info and prepare two fn for each client `connect` and `denyConnection`
  // which automatically prepare and send response for that client
  [METHODS.aepp.connect]: (instance, { client }) =>
    ({ id, method, params: { name, network, version, icons } }) => {
      const accept = (id) => () => {
        rpcClients.updateClientInfo(client.id, { status: 'CONNECTED' })
        sendResponseMessage(client)(id, method, { result: instance.getWalletInfo() })
      }
      const deny = (id) => (error) => {
        rpcClients.updateClientInfo(client.id, { status: 'CONNECTION_REJECTED' })
        sendResponseMessage(client)(id, METHODS.aepp.connect, { error })
      }

      // Store new AEPP and wait for connection approve
      rpcClients.updateClientInfo(client.id, {
        status: 'WAITING_FOR_CONNECTION_APPROVE',
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
      const accept = (id) =>
        () => sendResponseMessage(client)(
          id,
          method,
          {
            result: {
              subscription: client.updateSubscription(type, value),
              addresses: instance.getAccounts()
            }
          })
      const deny = (id) => (error) => sendResponseMessage(client)(id, method, { error: ERRORS.subscriptionDeny(error) })

      rpcClients.updateClientInfo(client.id, { status: 'WAITING_FOR_SUBSCRIPTION' })
      instance.onSubscription(client, client.addAction({ id, method, params: { type, value } }, [accept(id), deny(id)]))
    },
  [METHODS.aepp.sign]: (instance, { client }) =>
    ({ id, method, params: { tx } }) => {
      const accept = (id) => async () => sendResponseMessage(client)(id, method, { result: { signedTransaction: Buffer.from(await instance.sign(tx)) } })
      const deny = (id) => (error) => sendResponseMessage(client)(id, method, { error: ERRORS.signDeny(error) })

      instance.onSign(client, client.addAction({ id, method, params: { tx } }, [accept(id), deny(id)]))
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
  },
  methods: {
    addRpcClient (clientConnection) {
      const id = uuid()
      rpcClients.addClient(
        id,
        {
          id,
          info: { status: 'WAITING_FOR_CONNECT' },
          connection: clientConnection,
          handlers: [handleMessage(this, id), this.onDisconnect]
        }
      )
    },
    shareWalletInfo (postFn) {
      postFn(message(METHODS.wallet.readyToConnect, this.getWalletInfo()))
    },
    getWalletInfo () {
      return {
        id: getBrowserAPI().runtime.id || uuid(),
        name: this.name,
        network: this.nodeNetworkId,
        origin: window.location.origin,
        type: getBrowserAPI().runtime.id ? 'extension' : 'window'
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
    selectAccount (address) {
      this.Selector.address = address
      // Send notification 'update.address' to all Aepp which are subscribed for account update
      rpcClients.sentNotificationByCondition(
        message(METHODS.wallet.updateAddress, this.getAccounts()),
        (client) => client.addressSubscription.includes(this.Selector.address)
      )
    }
  }
})

export default WalletRpc
