import * as R from 'ramda'

const asEnum = (array) => R.zipObj(array, array)

export const VERSION = 1

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

export const SUBSCRIPTION_VALUES = asEnum([
  'current',
  'connected'
])

export const SUBSCRIPTION_TYPES = asEnum([
  'subscribe',
  'unsubscribe'
])

export const METHODS = {
  wallet: {
    [NOTIFICATIONS.readyToConnect]: 'wallet.await.connection',
    [NOTIFICATIONS.updateAddress]: 'wallet.update.address',
    //
    [REQUESTS.broadcast]: 'wallet.broadcast.tx'
  },
  aepp: {
    [REQUESTS.connect]: 'aepp.request.connect',
    [REQUESTS.sign]: 'aepp.sign.tx',
    [REQUESTS.subscribeAddress]: 'aepp.subscribe.address'
  },
  [NOTIFICATIONS.updateNetwork]: 'peer.update.network',
  [NOTIFICATIONS.closeConnection]: 'peer.connection.close'
}

export const RPC_STATUS =  {
  CONNECTED: 'CONNECTED',
  DISCONNECTED: 'DISCONNECTED',
  CONNECTION_REJECTED: 'CONNECTION_REJECTED',
  WAITING_FOR_CONNECTION_APPROVE: 'WAITING_FOR_CONNECTION_APPROVE',
  WAITING_FOR_CONNECTION_REQUEST: 'WAITING_FOR_CONNECTION_REQUEST',
  WAITING_FOR_SUBSCRIPTION: 'WAITING_FOR_SUBSCRIPTION'
}

export const ERRORS = {
  subscriptionDeny: (error = {}) => ({
    code: 5,
    data: error,
    message: 'Subscription request denied'
  }),
  signDeny: (error = {}) => ({
    code: 4,
    data: error,
    message: 'Sign request denied'
  }),
  notAuthorize: (error = {}) => ({
    code: 11,
    data: error,
    message: 'You are not connected to the wallet'
  }),
  unsupportedProtocol: (error = {}) => ({
    code: 7,
    data: error,
    message: 'Unsupported Protocol Version'
  }),
  unsupportedNetwork: (error = {}) => ({
    code: 8,
    data: error,
    message: 'Unsupported Network'
  })
}
