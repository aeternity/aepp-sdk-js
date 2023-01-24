import { Tag } from '../constants';
import { encode, Encoding, decode } from '../../../utils/encoder';
import type { unpackTx as unpackTxType, buildTx as buildTxType } from '../index';

type TagWrapping = Tag.AccountsMtree | Tag.CallsMtree | Tag.ChannelsMtree | Tag.ContractsMtree
| Tag.NameserviceMtree | Tag.OraclesMtree;

export default function genWrappedField<T extends TagWrapping>(tag: T): {
  serialize: (
    // TODO: replace with `(TxParams & { tag: T })['payload']`,
    //  but fix TS2502 value is referenced directly or indirectly in its own type annotation
    value: any, options: { buildTx: typeof buildTxType }
  ) => Buffer;
  deserialize: (
    value: Buffer, options: { unpackTx: typeof unpackTxType },
    // TODO: replace with `(TxUnpacked & { tag: T })['payload']`,
    //  TS2577 Return type annotation circularly references itself
  ) => any;
  recursiveType: true;
} {
  return {
    serialize(payload, { buildTx }) {
      return decode(buildTx({ tag, payload }));
    },

    deserialize(buffer, { unpackTx }) {
      return unpackTx<TagWrapping>(encode(buffer, Encoding.Transaction), tag).payload;
    },

    recursiveType: true,
  };
}
