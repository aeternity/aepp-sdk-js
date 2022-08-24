import BigNumber from 'bignumber.js';
import { readInt } from '../helpers';
import { ArgumentError } from '../../../utils/errors';
import { toBytes } from '../../../utils/bytes';

export type Int = number | string | BigNumber;

export default {
  serialize(value: Int): Buffer {
    if (value < 0) throw new ArgumentError('value', 'greater or equal to 0', value);
    return toBytes(value, true);
  },

  deserialize(value: Buffer): string {
    return readInt(value);
  },
};
