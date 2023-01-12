import { ArgumentError, PrefixNotFoundError, TagNotFoundError } from '../../../utils/errors';
import { toBytes } from '../../../utils/bytes';
import {
  decode, encode, Encoded, Encoding,
} from '../../../utils/encoder';
import { isItemOfArray } from '../../../utils/other';

/**
 * Map of prefix to ID tag constant
 * @see {@link https://github.com/aeternity/protocol/blob/master/serializations.md#the-id-type}
 * @see {@link https://github.com/aeternity/aeserialization/blob/eb68fe331bd476910394966b7f5ede7a74d37e35/src/aeser_id.erl#L97-L102}
 * @see {@link https://github.com/aeternity/aeserialization/blob/eb68fe331bd476910394966b7f5ede7a74d37e35/src/aeser_api_encoder.erl#L163-L168}
 */
export const idTagToEncoding = [
  Encoding.AccountAddress,
  Encoding.Name,
  Encoding.Commitment,
  Encoding.OracleAddress,
  Encoding.ContractAddress,
  Encoding.Channel,
] as const;

export type AddressEncodings = typeof idTagToEncoding[number];

export default function genAddressField<Encoding extends AddressEncodings>(
  ...encodings: Encoding[]
): {
    serialize: (value: Encoded.Generic<Encoding>) => Buffer;
    deserialize: (value: Buffer) => Encoded.Generic<Encoding>;
  } {
  return {
    /**
     * Utility function to create and _id type
     * @param hashId - Encoded hash
     * @returns Buffer Buffer with ID tag and decoded HASh
     */
    serialize(hashId) {
      const enc = hashId.slice(0, 2);
      if (!isItemOfArray(enc, idTagToEncoding)) throw new TagNotFoundError(enc);
      if (!isItemOfArray(enc, encodings)) {
        throw new ArgumentError('Address encoding', encodings.join(', '), enc);
      }
      const idTag = idTagToEncoding.indexOf(enc) + 1;
      return Buffer.from([...toBytes(idTag), ...decode(hashId)]);
    },

    /**
     * Utility function to read and _id type
     * @param buf - Data
     * @returns Encoded hash string with prefix
     */
    deserialize(buf) {
      const idTag = Buffer.from(buf).readUIntBE(0, 1);
      const enc = idTagToEncoding[idTag - 1];
      if (enc == null) throw new PrefixNotFoundError(idTag);
      if (!isItemOfArray(enc, encodings)) {
        throw new ArgumentError('Address encoding', encodings.join(', '), enc);
      }
      return encode(buf.subarray(1), enc) as Encoded.Generic<Encoding>;
    },
  };
}
