import { AensName } from '../constants.js';
import { produceNameId, isNameValid } from '../helpers.js';
import address from './address.js';
import { Encoded, Encoding } from '../../../utils/encoder.js';

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
