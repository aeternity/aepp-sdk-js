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
    [REQUESTS.sign]: 'aepp.subscribe.address',
    [REQUESTS.subscribeAddress]: 'aepp.subscribe.address'
  },
  [NOTIFICATIONS.updateNetwork]: 'peer.update.network',
  [NOTIFICATIONS.closeConnection]: 'peer.connection.close'
}

export const ERRORS = {
  subscriptionDeny: (error = {}) => ({
    code: 5,
    data: error,
    message: 'Subscription denied'
  })
}
