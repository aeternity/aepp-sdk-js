import Ae from '../../../ae'
import Accounts from '../../../accounts'
import Selector from '../../../account/selector'

import { WalletClients } from './wallet-clients'
import { getBrowserAPI, sendWalletInfo, responseMessage, message } from '../helpers'
import { ERRORS, METHODS } from '../schema'

const rpcClients = WalletClients()

const NOTIFICATIONS = {
  [METHODS.wallet.updateNetwork]: (instance) =>
    (msg) => {
      instance.onNetworkChange(msg.params)
    },
  [METHODS.wallet.closeConnection]: (instance) =>
    (msg) => {
      instance.onDisconnect(msg.params)
    }
}

const RESPONSES = {

}

const REQUESTS = {
  // Store client info and prepare two fn for each client `connect` and `denyConnection`
  // which automatically prepare and send response for that client
  [METHODS.aepp.connect]: (instance, { client }) =>
    ({ id, method, params: { name, network, version, icons } }) => {
      // @Todo Add network and protocol compatibility check

      const accept = (id) => () => {
        rpcClients.updateClientInfo(client.id, { status: 'CONNECTED' })
        client.sendMessage(responseMessage(id, METHODS.aepp.connect, { result: instance.getWalletInfo() }), true)
      }
      const deny = (id) => (error) => {
        rpcClients.updateClientInfo(client.id, { status: 'CONNECTION_REJECTED' })
        client.sendMessage(responseMessage(id, METHODS.aepp.connect, { error }), true)
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
      instance.onConnection(client, client.addAction({ id, method, params: { name, network, version } }, [accept(id), deny(id)]))
    },
  [METHODS.aepp.subscribeAddress]: (instance, { client }) =>
    ({ id, method, params: { type, value } }) => {
      const accept = (id) =>
        () => {
          client.sendMessage(responseMessage(id, method, {
            result: {
              subscription: client.updateSubscription(type, value),
              addresses: instance.getAccounts()
            }
          }), true)
        }
      const deny = (id) => (error) => client.sendMessage(responseMessage(id, METHODS.aepp.connect, { error: ERRORS.subscriptionDeny(error) }), true)

      rpcClients.updateClientInfo(client.id, { status: 'WAITING_FOR_SUBSCRIPTION', resolver: { accept: accept(id), deny: deny(id) } })
      instance.onSubscription(client, client.addAction({ id, method, params: { type, value } }, [accept(id), deny(id)]))
    },
  [METHODS.aepp.sign]: (instance, { client }) =>
    ({ id, method, params: { tx } }) => {
      const accept = (id) => async () => client.sendMessage(responseMessage(id, method, { result: { signedTransaction: Buffer.from(await instance.sign(tx)) } }), true)
      const deny = (id) => (error) => client.sendMessage(responseMessage(id, method, { error: ERRORS.signDeny(error) }), true)

      instance.onSign(client, client.addAction({ id, method, params: { tx } }, [accept(id), deny(id)]))
    }
}

const handleMessage = (instance, client) => async (msg) => {
  if (!msg.id) {
    return NOTIFICATIONS[msg.method](instance, { client })(msg)
  }
  if (client.callbacks.hasOwnProperty(msg.id)) {
    return RESPONSES[msg.method](instance, { client })(msg)
  } else {
    return REQUESTS[msg.method](instance, { client })(msg)
  }
}

function addRpcClient (clientConnection) {
  rpcClients.addClient(clientConnection.connectionInfo.id, {
    info: { status: 'WAITING_FOR_CONNECT' },
    connection: clientConnection,
    handlers: [handleMessage(this, rpcClients.getClient(clientConnection.connectionInfo.id)), this.onDisconnect]
  })
}

function shareWalletInfo (postFn) {
  sendWalletInfo(postFn, this.getWalletInfo())
}

function getWalletInfo () {
  return {
    id: getBrowserAPI().runtime.id,
    name: this.name,
    network: this.nodeNetworkId
  }
}

function getAccounts () {
  return {
    current: this.Selector.address ? { [this.Selector.address]: this.accounts[this.Selector.address].meta } : {},
    connected: Object
      .entries(this.address)
      .filter(a => a[0] !== this.Selector.address)
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})
  }
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
  methods: { shareWalletInfo, getWalletInfo, addRpcClient, getAccounts }
})

export default WalletRpc
