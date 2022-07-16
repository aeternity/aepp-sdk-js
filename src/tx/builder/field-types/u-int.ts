import BigNumber from 'bignumber.js';
import { readInt, writeInt } from '../helpers';
import { ArgumentError } from '../../../utils/errors';

export type Int = number | string | BigNumber;

export default {
  serialize(value: Int): Buffer {
    if (value < 0) throw new ArgumentError('value', 'greater or equal to 0', value);
    return writeInt(value);
  },

  deserialize(value: Buffer): string {
    return readInt(value);
  },
};
