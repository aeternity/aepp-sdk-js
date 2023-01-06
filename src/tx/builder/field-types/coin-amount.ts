import uInt from './u-int';
import { Int } from '../constants';
import { AE_AMOUNT_FORMATS, formatAmount } from '../../../utils/amount-formatter';

export default {
  ...uInt,

  serializeAettos(value: string | undefined): string {
    return value ?? '0';
  },

  serialize(
    value: Int | undefined,
    params: {},
    { denomination }: { denomination?: AE_AMOUNT_FORMATS },
  ): Buffer {
    return uInt.serialize(
      this.serializeAettos(
        value != null ? formatAmount(value, { denomination }) : value,
        params,
      ),
    );
  },
};
