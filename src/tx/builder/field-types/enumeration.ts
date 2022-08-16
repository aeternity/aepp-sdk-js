import { ArgumentError } from '../../../utils/errors';

export default function genEnumerationField<Enum extends number>(): {
  serialize: (value: Enum) => Buffer;
  deserialize: (value: Buffer) => Enum;
} {
  return {
    serialize(value) {
      if (typeof value !== 'number') throw new ArgumentError('value', 'to be a number', value);
      if (value > 0xff) throw new ArgumentError('value', 'to be less than 256', value);
      return Buffer.from([value]);
    },

    deserialize(buffer) {
      if (buffer.length !== 1) {
        throw new ArgumentError('buffer', 'to have single element', buffer.length);
      }
      return buffer[0] as Enum;
    },
  };
}
