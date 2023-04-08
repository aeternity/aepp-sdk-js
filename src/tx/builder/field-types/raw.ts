export default {
  serialize(buffer: Uint8Array): Buffer {
    return Buffer.from(buffer);
  },

  deserialize(buffer: Buffer): Buffer {
    return buffer;
  },
};
