import { AensName } from '../constants';
import { produceNameId, isNameValid } from '../helpers';
import { writeId, readId } from '../address';
import { Encoded } from '../../../utils/encoder';

export default {
  /**
   * @param value - AENS name ID
   */
  serialize(value: AensName | Encoded.Name): Buffer {
    return writeId(isNameValid(value) ? produceNameId(value) : value);
  },

  /**
   * @param value - AENS name ID Buffer
   */
  deserialize(value: Buffer): Encoded.Name {
    return readId(value) as Encoded.Name;
  },
};
