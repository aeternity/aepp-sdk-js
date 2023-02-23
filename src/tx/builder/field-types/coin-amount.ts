import uInt from './u-int';
import { Int } from '../constants';

export default {
  ...uInt,

  serializeAettos(value: string | undefined): string {
    return value ?? '0';
  },

  serialize(
    value: Int | undefined,
    params: {},
  ): Buffer {
    return uInt.serialize(
      this.serializeAettos(value, params),
    );
  },
};
