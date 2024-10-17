import { Encoded, Encoding } from '../../../utils/encoder.js';
import { packRecord, unpackRecord } from '../common.js';
import { DelegationTag, schemas } from './schema.js';
import { DlgParams, DlgUnpacked } from './schema.generated.js';

/**
 * Pack delegation
 * @category delegation signature
 * @param params - Params of delegation
 * @returns Encoded delegation
 */
export function packDelegation(params: DlgParams): Encoded.Bytearray {
  return packRecord(schemas, DelegationTag, params, {}, Encoding.Bytearray);
}

/**
 * Unpack delegation
 * @category delegation signature
 * @param encoded - Encoded delegation
 * @param expectedTag - Expected delegation signature type
 * @returns Params of delegation
 */
export function unpackDelegation<T extends DelegationTag>(
  encoded: Encoded.Bytearray,
  expectedTag?: T,
): DlgUnpacked & { tag: T } {
  return unpackRecord(schemas, DelegationTag, encoded, expectedTag, {}) as any;
}
