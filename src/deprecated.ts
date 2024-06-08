import { RpcError } from './aepp-wallet-communication/schema';

/**
 * @category exception
 * @deprecated this exception is not thrown anymore
 */
export class RpcBroadcastError extends RpcError {
  static override code = 3;

  override code = 3;

  constructor(data?: any) {
    super('Broadcast failed');
    this.data = data;
    this.name = 'RpcBroadcastError';
  }
}
