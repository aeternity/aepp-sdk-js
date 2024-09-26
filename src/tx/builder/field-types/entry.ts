import {
  decode, encode, Encoded, Encoding,
} from '../../../utils/encoder';
import { EntryTag } from '../entry/constants';
import type { unpackEntry as unpackEntryType, packEntry as packEntryType } from '../entry';

export default function genEntryField<T extends EntryTag = EntryTag>(tag?: T): {
  serialize: (
    // TODO: replace with `TxParams & { tag: T }`,
    //  but fix TS2502 value is referenced directly or indirectly in its own type annotation
    value: any,
    options: { packEntry: typeof packEntryType },
  ) => Buffer;
  deserialize: (
    value: Buffer, options: { unpackEntry: typeof unpackEntryType },
    // TODO: replace with `TxUnpacked & { tag: T }`,
    //  TS2577 Return type annotation circularly references itself
  ) => any;
} {
  return {
    serialize(txParams, { packEntry }) {
      if (ArrayBuffer.isView(txParams)) return Buffer.from(txParams as any);
      if (typeof txParams === 'string' && txParams.startsWith('tx_')) {
        return decode(txParams as Encoded.Transaction);
      }
      return decode(packEntry({ ...txParams, ...tag != null && { tag } }));
    },

    deserialize(buf, { unpackEntry }) {
      return unpackEntry(encode(buf, Encoding.Bytearray), tag);
    },
  };
}
