import { decode, encode, Encoded, Encoding } from '../../../utils/encoder.js';
import { Tag } from '../constants.js';
import type { ProtocolParametersOption } from '../protocol-parameters.js';
import { serializeAsIsParam, SerializeAsIsParams } from './interface.js';
import type { unpackTx as unpackTxType, buildTx as buildTxType } from '../index.js';

export default function genTransactionField<T extends Tag = Tag>(
  tag?: T,
): {
  serialize: (
    // TODO: replace with `TxParams & { tag: T }`,
    //  but fix TS2502 value is referenced directly or indirectly in its own type annotation
    value: any,
    options: { buildTx: typeof buildTxType } & ProtocolParametersOption & SerializeAsIsParams,
  ) => Buffer;
  deserialize: (
    value: Buffer,
    options: { unpackTx: typeof unpackTxType },
    // TODO: replace with `TxUnpacked & { tag: T }`,
    //  TS2577 Return type annotation circularly references itself
  ) => any;
  nestedTransaction: true;
} {
  return {
    nestedTransaction: true,

    serialize(txParams, options) {
      const { buildTx, protocolParameters } = options;
      if (ArrayBuffer.isView(txParams)) return Buffer.from(txParams as any);
      if (typeof txParams === 'string' && txParams.startsWith('tx_')) {
        return decode(txParams as Encoded.Transaction);
      }
      return decode(
        buildTx({
          ...txParams,
          ...(tag != null && { tag }),
          // a nested transaction that is not built yet is built against the parameters of the
          // outer one, otherwise it would be priced by the parameters of the SDK release
          ...(protocolParameters != null && { protocolParameters }),
          // a transaction nested in one that is only re-serialized is re-serialized as well —
          // without this the innermost transaction of a `PayingForTx` wrapping a `GaMetaTx` gets
          // its already fixed values checked against the parameters of the outermost one
          ...(options[serializeAsIsParam] === true && { [serializeAsIsParam]: true }),
        }),
      );
    },

    deserialize(buf, { unpackTx }) {
      return unpackTx(encode(buf, Encoding.Transaction), tag);
    },
  };
}
