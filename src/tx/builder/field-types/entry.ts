import { decode, encode, Encoding } from '../../../utils/encoder';
import { Tag } from '../constants';
import type { unpackTx as unpackTxType, buildTx as buildTxType } from '../index';

export default function genEntryField<T extends Tag>(tag: T): {
  serialize: (
    value: Parameters<typeof buildTxType<T>>[0], options: { buildTx: typeof buildTxType },
  ) => Buffer;
  deserialize: (
    value: Buffer, options: { unpackTx: typeof unpackTxType },
  ) => ReturnType<typeof unpackTxType<T>>;
} {
  return {
    serialize(txParams, { buildTx }) {
      return decode(buildTx({ ...txParams, tag }));
    },

    deserialize(buf, { unpackTx }) {
      return unpackTx(encode(buf, Encoding.Transaction), tag);
    },
  };
}
