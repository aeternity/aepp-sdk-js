import { EntryTag } from '../entry/constants';
import { encode, Encoding, decode } from '../../../utils/encoder';
import type { unpackEntry as unpackEntryType, packEntry as packEntryType } from '../entry';

type TagWrapping = EntryTag.AccountsMtree | EntryTag.CallsMtree | EntryTag.ChannelsMtree
| EntryTag.ContractsMtree | EntryTag.NameserviceMtree | EntryTag.OraclesMtree;

export default function genWrappedField<T extends TagWrapping>(tag: T): {
  serialize: (
    // TODO: replace with `(EntParams & { tag: T })['payload']`,
    //  but fix TS2502 value is referenced directly or indirectly in its own type annotation
    value: any, options: { packEntry: typeof packEntryType }
  ) => Buffer;
  deserialize: (
    value: Buffer, options: { unpackEntry: typeof unpackEntryType },
    // TODO: replace with `(EntUnpacked & { tag: T })['payload']`,
    //  TS2577 Return type annotation circularly references itself
  ) => any;
  recursiveType: true;
} {
  return {
    serialize(payload, { packEntry }) {
      return decode(packEntry({ tag, payload }));
    },

    deserialize(buffer, { unpackEntry }) {
      return unpackEntry<TagWrapping>(encode(buffer, Encoding.Bytearray), tag).payload;
    },

    recursiveType: true,
  };
}
