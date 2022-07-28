import uInt, { Int } from './u-int';
import { AE_AMOUNT_FORMATS, formatAmount } from '../../../utils/amount-formatter';
import { ArgumentError } from '../../../utils/errors';

export interface Options { denomination?: AE_AMOUNT_FORMATS }

export default {
  ...uInt,

  serializeAettos(value: string | undefined): string {
    if (value == null) throw new ArgumentError('value', 'provided', value);
    return value;
  },

  serializeOptional(value: Int | undefined, { denomination, ...options }: Options): Buffer {
    return uInt.serialize(
      this.serializeAettos(
        value != null ? formatAmount(value, { denomination }) : value,
        options,
      ),
    );
  },

  serialize(value: Int, options: Options): Buffer {
    return this.serializeOptional(value, options);
  },
};
