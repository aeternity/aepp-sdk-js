import field from './field';
import { AensName } from '../constants';

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
