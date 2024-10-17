import { NamePointer as NamePointerString } from '../../../apis/node/index.js';
import { toBytes } from '../../../utils/bytes.js';
import { Encoded, Encoding, decode, encode } from '../../../utils/encoder.js';
import { isAddressValid } from '../../../utils/crypto.js';
import { IllegalArgumentError, DecodeError, ArgumentError } from '../../../utils/errors.js';
import address, { AddressEncodings, idTagToEncoding } from './address.js';

const ID_TAG = Buffer.from([1]);
const DATA_TAG = Buffer.from([2]);
const DATA_LENGTH_MAX = 1024;
const addressAny = address(...idTagToEncoding);

// TODO: remove after fixing node types
type NamePointer = NamePointerString & {
  id: Encoded.Generic<AddressEncodings>;
};
type NamePointerRaw = NamePointerString & {
  id: Encoded.Generic<AddressEncodings | Encoding.Bytearray>;
};

export default <AllowRaw extends boolean>(
  allowRaw: AllowRaw,
): {
  serialize: (pointers: Array<AllowRaw extends true ? NamePointerRaw : NamePointer>) => Buffer[][];
  deserialize: (
    pointers: Array<[key: Buffer, id: Buffer]>,
  ) => Array<AllowRaw extends true ? NamePointerRaw : NamePointer>;
} => ({
  /**
   * Helper function to build pointers for name update TX
   * @param pointers - Array of pointers
   * `([ { key: 'account_pubkey', id: 'ak_32klj5j23k23j5423l434l2j3423'} ])`
   * @returns Serialized pointers array
   */
  serialize(pointers) {
    if (pointers.length > 32) {
      throw new IllegalArgumentError(
        `Expected 32 pointers or less, got ${pointers.length} instead`,
      );
    }
    return pointers.map(({ key, id }) => {
      let payload;
      if (isAddressValid(id, ...idTagToEncoding)) {
        payload = [...(allowRaw ? [ID_TAG] : []), addressAny.serialize(id)];
      }
      if (isAddressValid(id, Encoding.Bytearray)) {
        const data = decode(id);
        if (data.length > DATA_LENGTH_MAX) {
          throw new ArgumentError(
            'Raw pointer',
            `shorter than ${DATA_LENGTH_MAX + 1} bytes`,
            `${data.length} bytes`,
          );
        }
        payload = [DATA_TAG, data];
      }
      if (payload == null) throw new DecodeError(`Unknown AENS pointer value: ${id}`);
      return [toBytes(key), Buffer.concat(payload)];
    });
  },

  /**
   * Helper function to read pointers from name update TX
   * @param pointers - Array of pointers
   * @returns Deserialize pointer array
   */
  deserialize(pointers) {
    return pointers.map(([bKey, bId]) => {
      if (!allowRaw) return { key: bKey.toString(), id: addressAny.deserialize(bId) };
      const tag = bId.subarray(0, 1);
      const payload = bId.subarray(1);
      let id;
      if (tag.equals(ID_TAG)) id = addressAny.deserialize(payload);
      // TS can't figure out the real type depending on allowRaw
      if (tag.equals(DATA_TAG)) id = encode(payload, Encoding.Bytearray) as Encoded.AccountAddress;
      if (id == null) throw new DecodeError(`Unknown AENS pointer tag: ${tag}`);
      return { key: bKey.toString(), id };
    });
  },
});
