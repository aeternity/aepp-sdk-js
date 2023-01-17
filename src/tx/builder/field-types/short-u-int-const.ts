import { ArgumentError } from '../../../utils/errors';
import shortUInt from './short-u-int';

export default function genShortUIntConstField<
  Value extends number, Optional extends boolean = false,
>(value: Value, optional?: Optional): {
  serialize: Optional extends true ? (value?: Value) => Buffer : (value: Value) => Buffer;
  deserialize: (value: Buffer) => Value;
} {
  return {
    serialize(val?: Value) {
      if ((optional !== true || val != null) && val !== value) throw new ArgumentError('ShortUIntConst', value, val);
      return shortUInt.serialize(value);
    },

    deserialize(buf) {
      const val = shortUInt.deserialize(buf);
      if (val !== value) throw new ArgumentError('ShortUIntConst', value, val);
      return value;
    },
  };
}
