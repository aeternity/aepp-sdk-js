import field from './field.js';
import { AensName } from '../constants.js';

export default {
  /**
   * @param value - AENS name
   */
  serialize(value: AensName): Buffer {
    return field.serialize(value);
  },

  /**
   * @param value - AENS name
   */
  deserialize(value: Buffer): AensName {
    return field.deserialize(value) as AensName;
  },
};
