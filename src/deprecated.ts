import { TypeResolver, ContractByteArrayEncoder } from '@aeternity/aepp-calldata';
import { AciValue } from './utils/typed-data';
import { Encoded } from './utils/encoder';
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

/**
 * @deprecated use isAuctionName instead
 */
export const NAME_BID_MAX_LENGTH = 12; // # this is the max length for a domain to be part of a bid

/**
 * @deprecated use ContractByteArrayEncoder:encodeWithType from \@aeternity/aepp-calldata
 */
export function encodeFateValue(value: unknown, aci: AciValue): Encoded.ContractBytearray {
  const valueType = new TypeResolver().resolveType(aci, {});
  return new ContractByteArrayEncoder().encodeWithType(value, valueType);
}

/**
 * @deprecated use ContractByteArrayEncoder:decodeWithType from \@aeternity/aepp-calldata
 */
export function decodeFateValue(value: Encoded.ContractBytearray, aci: AciValue): any {
  const valueType = new TypeResolver().resolveType(aci, {});
  return new ContractByteArrayEncoder().decodeWithType(value, valueType);
}
