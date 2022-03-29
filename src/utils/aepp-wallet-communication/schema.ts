export const VERSION = 1

export const enum MESSAGE_DIRECTION {
  to_waellet = 'to_waellet',
  to_aepp = 'to_aepp'
}

export const enum WALLET_TYPE {
  window = 'window',
  extension = 'extension'
}

export const enum SUBSCRIPTION_TYPES {
  subscribe = 'subscribe',
  unsubscribe = 'unsubscribe'
}

export const enum METHODS {
  readyToConnect = 'connection.announcePresence',
  updateAddress = 'address.update',
  address = 'address.get',
  connect = 'connection.open',
  sign = 'transaction.sign',
  signMessage = 'message.sign',
  subscribeAddress = 'address.subscribe',
  updateNetwork = 'networkId.update',
  closeConnection = 'connection.close'
}

export const enum RPC_STATUS {
  CONNECTED = 'CONNECTED',
  NODE_BINDED = 'NODE_BINDED',
  DISCONNECTED = 'DISCONNECTED',
  CONNECTION_REJECTED = 'CONNECTION_REJECTED',
  WAITING_FOR_CONNECTION_APPROVE = 'WAITING_FOR_CONNECTION_APPROVE',
  WAITING_FOR_CONNECTION_REQUEST = 'WAITING_FOR_CONNECTION_REQUEST'
}

export const ERRORS = {
  broadcastFailed: (error = {}) => ({
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
  permissionDeny: (address: string) => ({
    code: 11,
    message: `You are not subscribed for account ${address}`
  }),
  internalError: (message: string) => ({
    code: 12,
    message
  }),
  notAuthorize: () => ({
    code: 10,
    message: 'You are not connected to the wallet'
  }),
  unsupportedProtocol: () => ({
    code: 5,
    message: 'Unsupported Protocol Version'
  })
}
