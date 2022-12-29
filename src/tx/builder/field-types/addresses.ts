import genAddressField, { AddressEncodings } from './address';

export default function genAddressesField<Encoding extends AddressEncodings>(
  ...encodings: Encoding[]
): {
    serialize: (value: Array<`${Encoding}_${string}`>) => Buffer[];
    deserialize: (value: Buffer[]) => Array<`${Encoding}_${string}`>;
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
