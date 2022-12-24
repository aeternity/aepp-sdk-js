import { NamePointer as NamePointerString } from '../../../apis/node';
import { toBytes } from '../../../utils/bytes';
import { Encoded } from '../../../utils/encoder';
import { IllegalArgumentError } from '../../../utils/errors';
import address, { AddressEncodings, idTagToEncoding } from './address';

const addressAny = address(...idTagToEncoding);

// TODO: remove after fixing node types
type NamePointer = NamePointerString & {
  id: Encoded.Generic<AddressEncodings>;
};

export default {
  /**
   * Helper function to build pointers for name update TX
   * @param pointers - Array of pointers
   * `([ { key: 'account_pubkey', id: 'ak_32klj5j23k23j5423l434l2j3423'} ])`
   * @returns Serialized pointers array
   */
  serialize(pointers: NamePointer[]): Buffer[][] {
    if (pointers.length > 32) {
      throw new IllegalArgumentError(`Expected 32 pointers or less, got ${pointers.length} instead`);
    }

    return pointers.map(
      (pointer) => [toBytes(pointer.key), addressAny.serialize(pointer.id)],
    );
  },

  /**
   * Helper function to read pointers from name update TX
   * @param pointers - Array of pointers
   * @returns Deserialize pointer array
   */
  deserialize(pointers: Array<[key: Buffer, id: Buffer]>): NamePointer[] {
    return pointers.map(
      ([key, id]) => ({ key: key.toString(), id: addressAny.deserialize(id) }),
    );
  },
};
