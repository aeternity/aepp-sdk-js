import genAddressField, { AddressEncodings } from './address';
import { Encoded } from '../../../utils/encoder';

export default function genAddressesField<Encoding extends AddressEncodings>(
  ...encodings: Encoding[]
): {
    serialize: (value: Array<Encoded.Generic<Encoding>>) => Buffer[];
    deserialize: (value: Buffer[]) => Array<Encoded.Generic<Encoding>>;
  } {
  const address = genAddressField(...encodings);

  return {
    serialize(addresses) {
      return addresses.map(address.serialize);
    },

    deserialize(addresses) {
      return addresses.map(address.deserialize);
    },
  };
}
