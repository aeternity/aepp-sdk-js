import { RpcError } from './aepp-wallet-communication/schema';

/**
 * @category exception
 * @deprecated this exception is not thrown anymore
 */
// eslint-disable-next-line import/prefer-default-export
export class RpcBroadcastError extends RpcError {
  static override code = 3;

  override code = 3;

  constructor(data?: any) {
    super('Broadcast failed');
    this.data = data;
    this.name = 'RpcBroadcastError';
  }
}

/**
 * @deprecated use isAuctionName instead
 */
export const NAME_BID_MAX_LENGTH = 12; // # this is the max length for a domain to be part of a bid
