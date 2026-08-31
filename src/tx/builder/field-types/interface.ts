export type BinaryData =
  | Buffer
  | Buffer[]
  | Buffer[][]
  | Array<[Buffer, Array<[Buffer, Buffer[]]>]>;

// TODO: give `Field` an optional `validate` that `buildTx` runs before `serialize` and
//  `rebuildUnpackedTx` skips, so that a field can't check a value without being asked to. Needs
//  `packRecord` to stop passing params and options through the same channel first — a string key
//  in that channel would be forgeable from `JSON.parse`, which is why this is a symbol — and
//  `fee` to stop sharing its fixpoint between the default and the check [breaking change]
/**
 * Set in the params of a transaction that is re-serialized rather than built — see
 * `rebuildUnpackedTx`. Fields that check their value against the protocol parameters serialize it
 * as it is instead: the transaction already exists, its values may belong to other parameters than
 * the ones this build runs against, and re-checking them would reject a valid transaction that is
 * serialized verbatim anyway.
 *
 * A symbol so that it can't come out of a `JSON.parse`. It is not a trust boundary either way —
 * `protocolParameters` decides what those same checks compare against and is a plain string key,
 * as are `fee`, `gasPrice`, and `gasLimit`.
 */
export const serializeAsIsParam: unique symbol = Symbol('serializeAsIs');

export interface SerializeAsIsParams {
  [serializeAsIsParam]?: boolean;
}

export interface Field {
  serialize: (value: any, options: any, parameters: any) => BinaryData;
  prepare?: (value: any, options: any, parameters: any) => Promise<any>;
  /**
   * Set by the fields holding a transaction that may still have to be built — and priced — so that
   * `buildTxAsync` can tell them from the ones holding a plain value. See `genTransactionField`.
   */
  nestedTransaction?: boolean;
  deserialize: (value: BinaryData, options: any) => any;
  recursiveType?: boolean;
}
