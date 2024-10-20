import { ArgumentError } from '../../../utils/errors.js';
import shortUInt from './short-u-int.js';

export default function genShortUIntConstField<
  Value extends number,
  Optional extends boolean = false,
>(
  constValue: Value,
  optional?: Optional,
): {
  serialize: Optional extends true ? (value?: Value) => Buffer : (value: Value) => Buffer;
  deserialize: (value: Buffer) => Value;
  constValue: Value;
  constValueOptional: boolean;
} {
  return {
    serialize(value?: Value) {
      if ((optional !== true || value != null) && value !== constValue) {
        throw new ArgumentError('ShortUIntConst', constValue, value);
      }
      return shortUInt.serialize(constValue);
    },

    deserialize(buf) {
      const value = shortUInt.deserialize(buf);
      if (value !== constValue) throw new ArgumentError('ShortUIntConst', constValue, value);
      return constValue;
    },

    constValue,

    constValueOptional: optional === true,
  };
}
