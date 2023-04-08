import { AensName } from '../constants';
import { produceNameId, isNameValid } from '../helpers';
import address from './address';
import { Encoded, Encoding } from '../../../utils/encoder';

const addressName = address(Encoding.Name);

export default {
  ...addressName,

  /**
   * @param value - AENS name ID
   */
  serialize(value: AensName | Encoded.Name): Buffer {
    return addressName.serialize(isNameValid(value) ? produceNameId(value) : value);
  },
};
