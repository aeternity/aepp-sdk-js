import * as R from 'ramda'

const asEnum = (array) => R.zipObj(array, array)

export const VERSION = 1

export const MESSAGE_DIRECTION = asEnum(['to_waellet', 'to_aepp'])

export const WALLET_TYPE = asEnum([
  'window',
  'extension'
])

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
  'address',
  'signMessage'
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
    [NOTIFICATIONS.readyToConnect]: 'connection.announcePresence',
    [NOTIFICATIONS.updateAddress]: 'address.update'
  },
  aepp: {
    [REQUESTS.address]: 'address.get',
    [REQUESTS.connect]: 'connection.open',
    [REQUESTS.sign]: 'transaction.sign',
    [REQUESTS.signMessage]: 'message.sign',
    [REQUESTS.subscribeAddress]: 'address.subscribe'
  },
  [NOTIFICATIONS.updateNetwork]: 'networkId.update',
  [NOTIFICATIONS.closeConnection]: 'connection.close'
}

export const RPC_STATUS = {
  CONNECTED: 'CONNECTED',
  DISCONNECTED: 'DISCONNECTED',
  CONNECTION_REJECTED: 'CONNECTION_REJECTED',
  WAITING_FOR_CONNECTION_APPROVE: 'WAITING_FOR_CONNECTION_APPROVE',
  WAITING_FOR_CONNECTION_REQUEST: 'WAITING_FOR_CONNECTION_REQUEST',
  WAITING_FOR_SUBSCRIPTION: 'WAITING_FOR_SUBSCRIPTION'
}

export const ERRORS = {
  broadcastFailde: (error = {}) => ({
    code: 3,
    data: error,
    message: 'Broadcast failed'
  }),
  invalidTransaction: (error = {}) => ({
    code: 2,
    data: error,
    message: 'Invalid transaction'
  }),
  rejectedByUser: (error = {}) => ({
    code: 4,
    data: error,
    message: 'Operation rejected by user'
  }),
  connectionDeny: (error = {}) => ({
    code: 9,
    data: error,
    message: 'Wallet deny your connection request'
  }),
  permissionDeny: (error = {}) => ({
    code: 11,
    data: error,
    message: `You are not subscribed for account ${error.account}`
  }),
  notAuthorize: (error = {}) => ({
    code: 10,
    data: error,
    message: 'You are not connected to the wallet'
  }),
  unsupportedProtocol: (error = {}) => ({
    code: 5,
    data: error,
    message: 'Unsupported Protocol Version'
  }),
  unsupportedNetwork: (error = {}) => ({
    code: 8,
    data: error,
    message: 'Unsupported Network'
  })
}
