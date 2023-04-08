import { ArgumentError } from '../../../utils/errors';
import { isItemOfArray } from '../../../utils/other';

export default function genEnumerationField<
  Enum extends { [key: string]: number | string },
>(enm: Enum): {
  serialize: (value: Enum[keyof Enum]) => Buffer;
  deserialize: (value: Buffer) => Enum[keyof Enum];
} {
  const values = Object.values(enm).filter((v) => typeof v === 'number');
  return {
    serialize(value) {
      if (typeof value !== 'number') throw new ArgumentError('value', 'to be a number', value);
      if (value > 0xff) throw new ArgumentError('value', 'to be less than 256', value);
      if (!isItemOfArray(value, values)) {
        throw new ArgumentError('value', 'to be a value of Enum', value);
      }
      return Buffer.from([value]);
    },

    deserialize(buffer) {
      if (buffer.length !== 1) {
        throw new ArgumentError('buffer', 'to have single element', buffer.length);
      }
      const value = buffer[0];
      if (!isItemOfArray(value, values)) {
        throw new ArgumentError('value', 'to be a value of Enum', value);
      }
      return value as Enum[keyof Enum];
    },
  };
}
