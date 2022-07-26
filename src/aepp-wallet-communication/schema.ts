// eslint-disable-next-line max-classes-per-file
import { Encoded } from '../utils/encoder';
import { BaseError, InternalError } from '../utils/errors';

/**
 * @category aepp wallet communication
 */
export const enum MESSAGE_DIRECTION {
  to_waellet = 'to_waellet',
  to_aepp = 'to_aepp',
}

/**
 * @category aepp wallet communication
 */
export const enum WALLET_TYPE {
  window = 'window',
  extension = 'extension',
}

/**
 * @category aepp wallet communication
 */
export const enum SUBSCRIPTION_TYPES {
  subscribe = 'subscribe',
  unsubscribe = 'unsubscribe',
}

/**
 * @category aepp wallet communication
 */
export const enum METHODS {
  readyToConnect = 'connection.announcePresence',
  updateAddress = 'address.update',
  address = 'address.get',
  connect = 'connection.open',
  sign = 'transaction.sign',
  signMessage = 'message.sign',
  subscribeAddress = 'address.subscribe',
  updateNetwork = 'networkId.update',
  closeConnection = 'connection.close',
}

/**
 * @category aepp wallet communication
 */
export const enum RPC_STATUS {
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  WAITING_FOR_CONNECTION_REQUEST = 'WAITING_FOR_CONNECTION_REQUEST',
}

interface RpcErrorAsJson {
  code: number;
  message: string;
  data?: any;
}

const rpcErrors: Array<(new (data?: any) => RpcError) & { code: number }> = [];

/**
 * @category exception
 */
export abstract class RpcError extends BaseError {
  static code: number;

  code: number;

  data?: any;

  toJSON(): RpcErrorAsJson {
    return {
      code: this.code,
      message: this.message,
      data: this.data,
    };
  }

  static deserialize(json: RpcErrorAsJson): RpcError {
    const RpcErr = rpcErrors.find((cl) => cl.code === json.code);
    if (RpcErr == null) throw new InternalError(`Can't find RpcError with code: ${json.code}`);
    return new RpcErr(json.data);
  }
}

/**
 * @category exception
 */
export class RpcInvalidTransactionError extends RpcError {
  static code = 2;

  code = 2;

  constructor(data?: any) {
    super('Invalid transaction');
    this.data = data;
    this.name = 'RpcInvalidTransactionError';
  }
}
rpcErrors.push(RpcInvalidTransactionError);

/**
 * @category exception
 */
export class RpcBroadcastError extends RpcError {
  static code = 3;

  code = 3;

  constructor(data?: any) {
    super('Broadcast failed');
    this.data = data;
    this.name = 'RpcBroadcastError';
  }
}
rpcErrors.push(RpcBroadcastError);

/**
 * @category exception
 */
export class RpcRejectedByUserError extends RpcError {
  static code = 4;

  code = 4;

  constructor(data?: any) {
    super('Operation rejected by user');
    this.data = data;
    this.name = 'RpcRejectedByUserError';
  }
}
rpcErrors.push(RpcRejectedByUserError);

/**
 * @category exception
 */
export class RpcUnsupportedProtocolError extends RpcError {
  static code = 5;

  code = 5;

  constructor() {
    super('Unsupported Protocol Version');
    this.name = 'RpcUnsupportedProtocolError';
  }
}
rpcErrors.push(RpcUnsupportedProtocolError);

/**
 * @category exception
 */
export class RpcConnectionDenyError extends RpcError {
  static code = 9;

  code = 9;

  constructor(data?: any) {
    super('Wallet deny your connection request');
    this.data = data;
    this.name = 'RpcConnectionDenyError';
  }
}
rpcErrors.push(RpcConnectionDenyError);

/**
 * @category exception
 */
export class RpcNotAuthorizeError extends RpcError {
  static code = 10;

  code = 10;

  constructor() {
    super('You are not connected to the wallet');
    this.name = 'RpcNotAuthorizeError';
  }
}
rpcErrors.push(RpcNotAuthorizeError);

/**
 * @category exception
 */
export class RpcPermissionDenyError extends RpcError {
  static code = 11;

  code = 11;

  constructor(address: Encoded.AccountAddress) {
    super(`You are not subscribed for account ${address}`);
    this.data = address;
    this.name = 'RpcPermissionDenyError';
  }
}
rpcErrors.push(RpcPermissionDenyError);

/**
 * @category exception
 */
export class RpcInternalError extends RpcError {
  static code = 12;

  code = 12;

  constructor() {
    super('The peer failed to execute your request due to unknown error');
    this.name = 'RpcInternalError';
  }
}
rpcErrors.push(RpcInternalError);

/**
 * @category exception
 */
export class RpcMethodNotFoundError extends RpcError {
  static code = -32601;

  code = -32601;

  constructor() {
    super('Method not found');
    this.name = 'RpcMethodNotFoundError';
  }
}
rpcErrors.push(RpcMethodNotFoundError);
