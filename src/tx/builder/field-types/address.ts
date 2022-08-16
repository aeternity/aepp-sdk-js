import { writeId, readId, AddressEncodings } from '../address';

export default function genAddressField<Encoding extends AddressEncodings>(): {
  serialize: (value: `${Encoding}_${string}`) => Buffer;
  deserialize: (value: Buffer) => `${Encoding}_${string}`;
} {
  return {
    serialize(value) {
      return writeId(value);
    },

    deserialize(value) {
      return readId(value) as `${Encoding}_${string}`;
    },
  };
}
