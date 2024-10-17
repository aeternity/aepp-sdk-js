import uInt from './u-int.js';

export default {
  serialize(value: number): Buffer {
    return uInt.serialize(value);
  },

  deserialize(value: Buffer): number {
    return +uInt.deserialize(value);
  },
};
