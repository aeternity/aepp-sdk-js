export default {
  serialize(value: boolean): Buffer {
    return Buffer.from([value ? 1 : 0]);
  },

  deserialize(buffer: Buffer): boolean {
    return buffer[0] === 1;
  },
};
