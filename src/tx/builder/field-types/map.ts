import { Tag } from '../constants';
import {
  encode, Encoding, Encoded, decode,
} from '../../../utils/encoder';
import type { unpackTx as unpackTxType, buildTx as buildTxType } from '../index';

export default function genMapField<E extends Encoding, T extends Tag>(encoding: E, tag: T): {
  serialize: (
    // TODO: replace with `TxParams & { tag: T }`,
    //  but fix TS2502 value is referenced directly or indirectly in its own type annotation
    value: Record<Encoded.Generic<E>, any>, options: { buildTx: typeof buildTxType }
  ) => Buffer;
  deserialize: (
    value: Buffer, options: { unpackTx: typeof unpackTxType },
    // TODO: replace with `TxUnpacked & { tag: T }`,
    //  TS2577 Return type annotation circularly references itself
  ) => Record<Encoded.Generic<E>, any>;
  recursiveType: true;
} {
  return {
    serialize(object, { buildTx }) {
      return decode(buildTx({
        tag: Tag.Mtree,
        values: Object.entries(object).map(([key, value]) => ({
          tag: Tag.MtreeValue,
          key: decode(key as Encoded.Generic<E>),
          value: decode(buildTx({ ...value as any, tag })),
        })),
      }));
    },

    deserialize(buffer, { unpackTx }) {
      const { values } = unpackTx(encode(buffer, Encoding.Transaction), Tag.Mtree);
      return Object.fromEntries(values
        // TODO: remove after resolving https://github.com/aeternity/aeternity/issues/4066
        .filter(({ key }) => encoding !== Encoding.ContractAddress || key.length === 32)
        .map(({ key, value }) => [
          encode(key, encoding),
          unpackTx(encode(value, Encoding.Transaction), tag),
        ])) as Record<Encoded.Generic<E>, any>;
    },

    recursiveType: true,
  };
}
