import * as R from 'ramda'

import { WalletClients } from './wallet-clients'

import Ae from '../ae'
import Accounts from '../accounts'
import Chain from '../chain/node'
import Tx from '../tx/tx'
import Contract from '../ae/contract'
import Selector from '../account/selector'
import { getBrowserAPI, sendWalletInfo, responseMessage, message } from '../utils/aepp-wallet-communication/helpers'
import { METHODS } from '../utils/aepp-wallet-communication/schema'

const rpcClients = WalletClients()

const WALLET_HANDLERS = {
  //  Send {
  //    current: {
  //      'ak_7a6sd8gyasdhasasfaash: { name: 'MyWhiteThingsAccount' }
  //    },
  //    connected: { // Same structure as for 'current' }
  //  }
  [METHODS.wallet.updateAddress]: (instance, { client }) =>
    () => client.sendMessage(message(METHODS.wallet.updateAddress, instance.getAddresses()), true),
  //
  // RESPONSES
  //
  // Store client info and prepare two fn for each client `connect` and `denyConnection`
  // which automatically prepare and send response for that client
  [METHODS.aepp.connect]: (instance, { client }) =>
    ({ id, method, params: { name, network, version, icons }}) => {
    // @Todo Add network and protocol compatibility check
      const acceptConnection = (id) => () => {
        client.sendMessage(responseMessage(id, METHODS.aepp.connect, { result: instance.getWalletInfo() }), true)
      }
      const denyConnection = (id) => (error) => {
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
      instance.onConnection({ ...client, ...{ acceptConnection: acceptConnection(id), denyConnection: denyConnection(id) } })
    }
}


const handleMessage = (instance, id) => async (msg) => {
  await WALLET_HANDLERS[msg.method](instance, { client: rpcClients.getClient(id) })(msg)
}

function addRpcClient (clientConnection) {
  rpcClients.addClient(clientConnection.connectionInfo.id, {
    info: { status: 'WAITING_FOR_CONNECT' },
    connection: clientConnection,
    handlers: [handleMessage(this, clientConnection.connectionInfo.id), this.onDisconnect]
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

export const Wallet = Ae.compose(Accounts, Chain, Tx, Contract, Selector, {
  init ({ icons, name, onConnection, onSign, onDisconnect }) {
    this.onConnection = onConnection
    this.onSign = onSign
    this.onDisconnect = onDisconnect
    this.name = name
  },
  methods: { shareWalletInfo, getWalletInfo, addRpcClient }
})

export default Wallet
