import { EntryTag } from '../entry/constants.js';
import { encode, Encoding, Encoded, decode } from '../../../utils/encoder.js';
import type { unpackEntry as unpackEntryType, packEntry as packEntryType } from '../entry/index.js';

export default function genMapField<E extends Encoding, T extends EntryTag>(
  encoding: E,
  tag: T,
): {
  serialize: (
    // TODO: replace with `TxParams & { tag: T }`,
    //  but fix TS2502 value is referenced directly or indirectly in its own type annotation
    value: Record<Encoded.Generic<E>, any>,
    options: { packEntry: typeof packEntryType },
  ) => Buffer;
  deserialize: (
    value: Buffer,
    options: { unpackEntry: typeof unpackEntryType },
    // TODO: replace with `TxUnpacked & { tag: T }`,
    //  TS2577 Return type annotation circularly references itself
  ) => Record<Encoded.Generic<E>, any>;
  recursiveType: true;
} {
  return {
    serialize(object, { packEntry }) {
      return decode(
        packEntry({
          tag: EntryTag.Mtree,
          values: Object.entries(object).map(
            ([key, value]) =>
              ({
                tag: EntryTag.MtreeValue,
                key: decode(key as Encoded.Generic<E>),
                value: decode(packEntry({ ...(value as any), tag })),
              }) as const,
          ),
        }),
      );
    },

    deserialize(buffer, { unpackEntry }) {
      const { values } = unpackEntry(encode(buffer, Encoding.Bytearray), EntryTag.Mtree);
      return Object.fromEntries(
        values
          // TODO: remove after resolving https://github.com/aeternity/aeternity/issues/4066
          .filter(({ key }) => encoding !== Encoding.ContractAddress || key.length === 32)
          .map(({ key, value }) => [
            encode(key, encoding),
            unpackEntry(encode(value, Encoding.Bytearray), tag),
          ]),
      ) as Record<Encoded.Generic<E>, any>;
    },

    recursiveType: true,
  };
}
