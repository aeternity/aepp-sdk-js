import uInt from './u-int';
import { Int } from '../constants';

// TODO: serialize and deserialize a wrapper around bigint
export default {
  ...uInt,

  serialize(value: Int | undefined): Buffer {
    return uInt.serialize(value ?? 0);
  },
};
