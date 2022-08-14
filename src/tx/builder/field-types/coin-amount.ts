import uInt, { Int } from './u-int';
import { AE_AMOUNT_FORMATS, formatAmount } from '../../../utils/amount-formatter';

export interface Options { denomination?: AE_AMOUNT_FORMATS }

export default {
  ...uInt,

  serializeAettos(value: string | undefined): string {
    return value ?? '0';
  },

  serialize(value: Int | undefined, { denomination, ...options }: Options): Buffer {
    return uInt.serialize(
      this.serializeAettos(
        value != null ? formatAmount(value, { denomination }) : value,
        options,
      ),
    );
  },
};
