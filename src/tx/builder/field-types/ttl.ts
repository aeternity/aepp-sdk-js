import shortUInt from './short-u-int';
import { ArgumentError, NotImplementedError } from '../../../utils/errors';

export default {
  ...shortUInt,

  serialize(
    value: number | undefined,
    params: {},
    { absoluteTtl = true }: { absoluteTtl?: boolean },
  ): Buffer {
    value ??= 0;
    if (value < 0) throw new ArgumentError('ttl', 'greater or equal to 0', value);
    if (value !== 0 && !absoluteTtl) {
      throw new NotImplementedError('absoluteTtl not true in sync transaction builder');
    }
    return shortUInt.serialize(value);
  },
};
