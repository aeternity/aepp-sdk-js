import * as R from 'ramda'

const asEnum = (array) => R.zipObj(array, array)

export const NOTIFICATIONS = asEnum([
  'readyToConnect',
  'closeConnection',
  'updateNetwork',
  'updateAddress'
])

export const REQUESTS = asEnum([
  'connect',
  'subscribeAddress',
  'sign',
  'broadcast'
])

export const SUBSCRIPTION_TYPES = asEnum([
  'current',
  'connected'
])

const METHODS = {
  wallet: {
    [NOTIFICATIONS.readyToConnect]: 'wallet.await.connection',
    [NOTIFICATIONS.updateAddress]: 'wallet.update.address',
    //
    [REQUESTS.broadcast]: 'wallet.broadcast.tx'
  },
  aepp: {
    [REQUESTS.connect]: 'aepp.request.connect',
    [REQUESTS.sign]: 'aepp.subscribe.address',
    [REQUESTS.subscribeAddress]: 'aepp.request.sign'
  },
  [NOTIFICATIONS.updateNetwork]: 'peer.update.network',
  [NOTIFICATIONS.closeConnection]: 'peer.connection.close'
}

const getMethod = (type) => R.pick([type], { ...METHODS, ...METHODS.wallet, ...METHODS.aepp })

const message = (method, params) => ({ method, params })

export const WALLET_HANDLRES = {
  // NOTIFICATIONS
  //
  //  Send {
  //    name: 'WAELLET',
  //    network: 'ae_devnet',
  //    id: 'asdasdasdasdasd',
  //    icons: []
  //  }
  [NOTIFICATIONS.readyToConnect]: (instance) =>
    () => instance.sendMessage(message(getMethod(NOTIFICATIONS.readyToConnect), instance.getWalletInfo()), true),
  //  Send {
  //    current: {
  //      'ak_7a6sd8gyasdhasasfaash: { name: 'MyWhiteThingsAccount' }
  //    },
  //    connected: { // Same structure as for 'current' }
  //  }
  [NOTIFICATIONS.updateAddress]: (instance) =>
    () => instance.sendMessage(message(getMethod(NOTIFICATIONS.updateAddress), instance.getAddresses()), true)
}
