import uInt from './u-int';

export default {
  serialize(value: number): Buffer {
    return uInt.serialize(value);
  },

  deserialize(value: Buffer): number {
    return +uInt.deserialize(value);
  },
};
