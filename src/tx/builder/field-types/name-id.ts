import { AensName } from '../constants';
import {
  writeId, readId, produceNameId, isNameValid,
} from '../helpers';
import { EncodedData } from '../../../utils/encoder';

export default {
  /**
   * @param value - AENS name ID
   */
  serialize(value: AensName | EncodedData<'nm'>): Buffer {
    return writeId(isNameValid(value) ? produceNameId(value) : value);
  },

  /**
   * @param value - AENS name ID Buffer
   */
  deserialize(value: Buffer): EncodedData<'nm'> {
    return readId(value) as EncodedData<'nm'>;
  },
};
