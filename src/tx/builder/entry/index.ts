import { Encoded, Encoding } from '../../../utils/encoder';
import { packRecord, unpackRecord } from '../common';
import { schemas } from './schema';
import { EntryTag } from './constants';
import { EntParams, EntUnpacked } from './schema.generated';

const encodingTag = [
  [EntryTag.CallsMtree, Encoding.CallStateTree],
  [EntryTag.StateTrees, Encoding.StateTrees],
  [EntryTag.TreesPoi, Encoding.Poi],
] as const;

export function packEntry(params: EntParams & { tag: EntryTag.CallsMtree }): Encoded.CallStateTree;
export function packEntry(params: EntParams & { tag: EntryTag.StateTrees }): Encoded.StateTrees;
export function packEntry(params: EntParams & { tag: EntryTag.TreesPoi }): Encoded.Poi;
/**
 * Pack entry
 * @category entry builder
 * @param params - Params of entry
 * @returns Encoded entry
 */
export function packEntry(params: EntParams): Encoded.Any;
export function packEntry(params: EntParams): Encoded.Any {
  const encoding = encodingTag.find(([tag]) => tag === params.tag)?.[1] ?? Encoding.Bytearray;
  return packRecord(schemas, EntryTag, params, { packEntry }, encoding);
}

export function unpackEntry(
  encoded: Encoded.CallStateTree,
): EntUnpacked & { tag: EntryTag.CallsMtree };
export function unpackEntry(
  encoded: Encoded.StateTrees,
): EntUnpacked & { tag: EntryTag.StateTrees };
export function unpackEntry(
  encoded: Encoded.Poi,
): EntUnpacked & { tag: EntryTag.TreesPoi };
/**
 * Unpack entry
 * @category entry builder
 * @param encoded - Encoded entry
 * @param expectedTag - Expected entry type
 * @returns Params of entry
 */
export function unpackEntry<T extends EntryTag>(
  encoded: Encoded.Any,
  expectedTag?: T,
): EntUnpacked & { tag: T };
export function unpackEntry(
  encoded: Encoded.Any,
  expectedTag?: EntryTag,
): EntUnpacked {
  expectedTag ??= encodingTag.find(([, enc]) => encoded.startsWith(enc))?.[0];
  return unpackRecord(schemas, EntryTag, encoded, expectedTag, { unpackEntry }) as any;
}
