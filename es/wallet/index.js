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

const clients = WalletClients()

const WALLET_HANDLERS = {
  // NOTIFICATIONS
  //
  //  Send {
  //    name: 'WAELLET',
  //    network: 'ae_devnet',
  //    id: 'asdasdasdasdasd',
  //    icons: []
  //  }
  [METHODS.wallet.readyToConnect]: (instance) => (postFn) => sendWalletInfo(postFn, instance.getWalletInfo()),
  //  Send {
  //    current: {
  //      'ak_7a6sd8gyasdhasasfaash: { name: 'MyWhiteThingsAccount' }
  //    },
  //    connected: { // Same structure as for 'current' }
  //  }
  [METHODS.wallet.updateAddress]: (instance, { id }) =>
    () => client.sendMessage(message(METHODS.wallet.updateAddress, instance.getAddresses()), true),
  //
  // RESPONSES
  //
  // Store client info and prepare two fn for each client `connect` and `denyConnection`
  // which automatically prepare and send response for that client
  [METHODS.wallet.connect]: (instance, { id }) =>
    (msg) => {
    const client = clients.getClient(id)
      // Store new AEPP and wait for connection approve
      clients.updateClient(client.id, {
        status: 'WAITING_FOR_CONNECTION_APPROVE',
        name: msg.name,
        network: msg.network,
        icons: msg.icons,
        acceptConnection: () => client.sendMessage(responseMessage(msg.id, { result: instance.getWalletInfo() }), true),
        denyConnection: (error) => client.sendMessage(responseMessage(msg.id, { error }), true)
      })
      // Call onConnection callBack top notice extension about new AEPP
      instance.onConnection(clients.getClient(msg.clientId))
    }
}


const handleMessage = (instance, client) => async (msg) => {
  debugger
  await WALLET_HANDLERS[msg.methods](instance, { client })(msg)
}

const addRpcClient = (clientConnection) => {
  clientConnection.connect(handleMessage(this, clientConnection.connectionInfo.id), on)
  clients.addClient({
    id: clientConnection.connectionInfo.id,
    status: 'WAITING_FOR_CONNECT',
    connection: clientConnection
  })
}

const shareWalletInfo = (postFn) => sendWalletInfo(postFn, this.getWalletInfo())

const getWalletInfo = () => ({
  id: getBrowserAPI().runtime.id,
  name: this.name,
  network: this.nodeNetworkId
})

export const Wallet = Ae.compose(Accounts, Chain, Tx, Contract, Selector, {
  init ({ icons, name, onConnection, onSign, onDisconnect }) {
    this.onConnection = onConnection
    this.onSign = onSign
    this.onDisconnect = onDisconnect

    // Subscribe for runtime connection
   //  getBrowserAPI().runtime.onConnectExternal.addListener((client) => {
   //    client.onMessage.addListener(handleMessage(this, { client }))
   //    client.onDisconnect.addListener((port) => {
   //        debugger
   //        this.onDisconnect(port)
   //    })
   // })
  },
  methods: { shareWalletInfo, getWalletInfo, addRpcClient }
})

export default Wallet
