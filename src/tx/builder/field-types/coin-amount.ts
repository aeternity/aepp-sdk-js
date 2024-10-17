import uInt from './u-int.js';
import { Int } from '../constants.js';
import { AE_AMOUNT_FORMATS, formatAmount } from '../../../utils/amount-formatter.js';

export default {
  ...uInt,

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  serializeAettos(value: string | undefined, params: {}, options: {}): string {
    return value ?? '0';
  },

  serialize(
    value: Int | undefined,
    params: {},
    { denomination = AE_AMOUNT_FORMATS.AETTOS, ...options }: { denomination?: AE_AMOUNT_FORMATS },
  ): Buffer {
    return uInt.serialize(
      this.serializeAettos(
        value != null ? formatAmount(value, { denomination }) : value,
        params,
        options,
      ),
    );
  },
};
