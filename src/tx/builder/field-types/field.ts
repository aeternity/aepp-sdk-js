export default {
  serialize(value: string): Buffer {
    return Buffer.from(value);
  },

  deserialize(value: Buffer): string {
    return value.toString();
  },
};
