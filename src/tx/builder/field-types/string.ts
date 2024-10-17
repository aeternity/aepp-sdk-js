import { toBytes } from '../../../utils/bytes.js';

export default {
  serialize(string: string): Buffer {
    return toBytes(string);
  },

  deserialize(buffer: Buffer): string {
    return buffer.toString();
  },
};
