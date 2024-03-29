import { TypeResolver, ContractByteArrayEncoder } from '@aeternity/aepp-calldata';
import { AciValue } from './utils/typed-data';
import { Encoded } from './utils/encoder';
import { RpcError } from './aepp-wallet-communication/schema';
import { ORACLE_TTL_TYPES } from './tx/builder/schema';

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

/**
 * @deprecated inlined in buildTx or use `180000`
 */
export const NAME_TTL = 180000;

/**
 * @deprecated inlined in buildTx or use `36000`
 */
export const NAME_MAX_TTL = 36000;

/**
 * @deprecated inlined in buildTx or use `60 * 60`
 */
export const NAME_MAX_CLIENT_TTL = 60 * 60;

/**
 * @deprecated inlined in buildTx or use `60 * 60`
 */
export const CLIENT_TTL = NAME_MAX_CLIENT_TTL;

/**
 * @deprecated inlined in buildTx or use `{ type: ORACLE_TTL_TYPES.delta, value: 500 }`
 */
export const ORACLE_TTL = { type: ORACLE_TTL_TYPES.delta, value: 500 };

/**
 * @deprecated inlined in buildTx or use `{ type: ORACLE_TTL_TYPES.delta, value: 10 }`
 */
export const QUERY_TTL = { type: ORACLE_TTL_TYPES.delta, value: 10 };

/**
 * @deprecated inlined in buildTx or use `{ type: ORACLE_TTL_TYPES.delta, value: 10 }`
 */
export const RESPONSE_TTL = { type: ORACLE_TTL_TYPES.delta, value: 10 };
