import {
  decode, encode, Encoded, Encoding,
} from '../../../utils/encoder';
import { Tag } from '../constants';
import { ArgumentError } from '../../../utils/errors';
import type { unpackTx as unpackTxType, buildTx as buildTxType } from '../index';

export default function genEntryField<T extends Tag = Tag>(tag?: T): {
  serialize: (
    // TODO: replace with `TxParams & { tag: T }`,
    //  but fix TS2502 value is referenced directly or indirectly in its own type annotation
    value: any,
    options: { buildTx: typeof buildTxType },
  ) => Buffer;
  deserialize: (
    value: Buffer, options: { unpackTx: typeof unpackTxType },
    // TODO: replace with `TxUnpacked & { tag: T }`,
    //  TS2577 Return type annotation circularly references itself
  ) => any;
} {
  return {
    serialize(txParams, { buildTx }) {
      if (ArrayBuffer.isView(txParams)) return Buffer.from(txParams as any);
      if (typeof txParams === 'string' && txParams.startsWith('tx_')) {
        return decode(txParams as Encoded.Transaction);
      }
      return decode(buildTx({ ...txParams, ...tag != null && { tag } }));
    },

    deserialize(buf, { unpackTx }) {
      const tx = unpackTx(encode(buf, Encoding.Transaction));
      if (tag != null && tx.tag !== tag) throw new ArgumentError('Tag', Tag[tag], Tag[tx.tag]);
      return tx;
    },
  };
}
