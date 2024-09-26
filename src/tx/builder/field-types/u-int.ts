import { readInt } from '../helpers';
import { Int } from '../constants';
import { ArgumentError } from '../../../utils/errors';
import { toBytes } from '../../../utils/bytes';

export default {
  serialize(value: Int): Buffer {
    if (Number(value) < 0) throw new ArgumentError('value', 'greater or equal to 0', value);
    return toBytes(value, true);
  },

  deserialize(value: Buffer): string {
    return readInt(value);
  },
};
