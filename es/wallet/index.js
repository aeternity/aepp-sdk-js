import * as R from 'ramda'

import { METHODS, responseMessage, message } from '../utils/aepp-wallet-communication/schema'
import { WalletClients } from './wallet-clients'

import Ae from '../ae'
import Accounts from '../accounts'
import Chain from '../chain/node'
import Tx from '../tx/tx'
import Contract from '../ae/contract'
import Selector from '../account/selector'
import { getBrowserAPI } from '../utils/aepp-wallet-communication/helpers'

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
  [METHODS.wallet.readyToConnect]: (instance) =>
    (postFn) => postFn(message(METHODS.wallet.readyToConnect, instance.getWalletInfo())),
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
  [METHODS.wallet.connect]: (instance, { client }) =>
    (msg) => {
      // Store new AEPP and wait for connection approve
      clients.addClient({
        id: msg.clientId,
        status: 'WAITING_FOR_CONNECT',
        name: msg.name,
        network: msg.network,
        icons: msg.icons,
        port: client,
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

const sendWalletInfo = (postFn) => WALLET_HANDLERS[METHODS.wallet.readyToConnect](this)(postFn)

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
  methods: { sendWalletInfo, getWalletInfo }
})

export default Wallet
