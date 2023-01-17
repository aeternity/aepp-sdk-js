import {
  decode, encode, Encoded, Encoding,
} from '../../../utils/encoder';
import { ArgumentError } from '../../../utils/errors';

export default function genEncodedField<E extends Encoding, Optional extends boolean = false>(
  encoding: E,
  optional?: Optional,
): {
    serialize: Optional extends true
      ? (value?: Encoded.Generic<E>) => Buffer : (value: Encoded.Generic<E>) => Buffer;
    deserialize: (value: Buffer) => Encoded.Generic<E>;
  } {
  return {
    serialize(encodedData?: Encoded.Generic<E>) {
      if (encodedData == null) {
        if (optional === true) return Buffer.from([]);
        throw new ArgumentError('Encoded data', 'provided', encodedData);
      }
      return decode(encodedData);
    },

    deserialize(buffer) {
      return encode(buffer, encoding);
    },
  };
}
