import { readInt } from '../helpers.js';
import { Int } from '../constants.js';
import { ArgumentError } from '../../../utils/errors.js';
import { toBytes } from '../../../utils/bytes.js';

export default {
  serialize(value: Int): Buffer {
    if (Number(value) < 0) throw new ArgumentError('value', 'greater or equal to 0', value);
    return toBytes(value, true);
  },

  deserialize(value: Buffer): string {
    return readInt(value);
  },
};
