import { EncodedData } from '../encoder'
import { BaseError, InternalError } from '../errors'

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
  DISCONNECTED = 'DISCONNECTED',
  WAITING_FOR_CONNECTION_REQUEST = 'WAITING_FOR_CONNECTION_REQUEST'
}

interface RpcErrorAsJson {
  code: number
  message: string
  data?: any
}

export abstract class RpcError extends BaseError {
  static code: number
  code: number
  data?: any

  toJSON (): RpcErrorAsJson {
    return {
      code: this.code,
      message: this.message,
      data: this.data
    }
  }

  static deserialize (json: RpcErrorAsJson): RpcError {
    const RpcErr = [
      RpcInvalidTransactionError, RpcBroadcastError, RpcRejectedByUserError,
      RpcUnsupportedProtocolError, RpcConnectionDenyError, RpcNotAuthorizeError,
      RpcPermissionDenyError, RpcInternalError
    ].find(cl => cl.code === json.code)
    if (RpcErr == null) throw new InternalError(`Can't find RpcError with code: ${json.code}`)
    return new RpcErr(json.data)
  }
}

export class RpcInvalidTransactionError extends RpcError {
  static code = 2
  code = 2
  constructor (data?: any) {
    super('Invalid transaction')
    this.data = data
    this.name = 'RpcInvalidTransactionError'
  }
}

export class RpcBroadcastError extends RpcError {
  static code = 3
  code = 3
  constructor (data?: any) {
    super('Broadcast failed')
    this.data = data
    this.name = 'RpcBroadcastError'
  }
}

export class RpcRejectedByUserError extends RpcError {
  static code = 4
  code = 4
  constructor (data?: any) {
    super('Operation rejected by user')
    this.data = data
    this.name = 'RpcRejectedByUserError'
  }
}

export class RpcUnsupportedProtocolError extends RpcError {
  static code = 5
  code = 5
  constructor () {
    super('Unsupported Protocol Version')
    this.name = 'RpcUnsupportedProtocolError'
  }
}

export class RpcConnectionDenyError extends RpcError {
  static code = 9
  code = 9
  constructor (data?: any) {
    super('Wallet deny your connection request')
    this.data = data
    this.name = 'RpcConnectionDenyError'
  }
}

export class RpcNotAuthorizeError extends RpcError {
  static code = 10
  code = 10
  constructor () {
    super('You are not connected to the wallet')
    this.name = 'RpcNotAuthorizeError'
  }
}

export class RpcPermissionDenyError extends RpcError {
  static code = 11
  code = 11
  constructor (address: EncodedData<'ak'>) {
    super(`You are not subscribed for account ${address}`)
    this.data = address
    this.name = 'RpcPermissionDenyError'
  }
}

export class RpcInternalError extends RpcError {
  static code = 12
  code = 12
  constructor () {
    super('The peer failed to execute your request due to unknown error')
    this.name = 'RpcInternalError'
  }
}

export class RpcMethodNotFoundError extends RpcError {
  static code = -32601
  code = -32601
  constructor () {
    super('Method not found')
    this.name = 'RpcMethodNotFoundError'
  }
}
