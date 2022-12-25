import { ArgumentError } from '../../../utils/errors';
import shortUInt from './short-u-int';

export default function genShortUIntConstField<Value extends number>(value: Value): {
  serialize: (value?: Value) => Buffer;
  deserialize: (value: Buffer) => Value;
} {
  return {
    serialize(val) {
      if (val != null && val !== value) throw new ArgumentError('ShortUIntConst', value, val);
      return shortUInt.serialize(value);
    },

    deserialize(buf) {
      const val = shortUInt.deserialize(buf);
      if (val !== value) throw new ArgumentError('ShortUIntConst', value, val);
      return value;
    },
  };
}
