import {
  decode, encode, Encoded, Encoding,
} from '../../../utils/encoder';

export default function genEncodedField<E extends Encoding>(encoding: E): {
  serialize: (value: Encoded.Generic<E>) => Buffer;
  deserialize: (value: Buffer) => Encoded.Generic<Encoding>;
} {
  return {
    serialize(encodedData) {
      return decode(encodedData);
    },

    deserialize(buffer) {
      return encode(buffer, encoding);
    },
  };
}
