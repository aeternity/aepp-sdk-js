import { ArgumentError, PrefixNotFoundError, TagNotFoundError } from '../../utils/errors';
import { toBytes } from '../../utils/bytes';
import {
  decode, encode, Encoded, Encoding,
} from '../../utils/encoder';
import { isItemOfArray } from '../../utils/other';

/**
 * Map of prefix to ID tag constant
 * @see {@link https://github.com/aeternity/protocol/blob/master/serializations.md#the-id-type}
 * @see {@link https://github.com/aeternity/aeserialization/blob/eb68fe331bd476910394966b7f5ede7a74d37e35/src/aeser_id.erl#L97-L102}
 * @see {@link https://github.com/aeternity/aeserialization/blob/eb68fe331bd476910394966b7f5ede7a74d37e35/src/aeser_api_encoder.erl#L163-L168}
 */
const idTagToEncoding = [
  Encoding.AccountAddress,
  Encoding.Name,
  Encoding.Commitment,
  Encoding.OracleAddress,
  Encoding.ContractAddress,
  Encoding.Channel,
] as const;

type AddressEncodings = typeof idTagToEncoding[number];

/**
 * Utility function to create and _id type
 * @category transaction builder
 * @param hashId - Encoded hash
 * @returns Buffer Buffer with ID tag and decoded HASh
 */
export function writeId(hashId: Encoded.Generic<AddressEncodings>): Buffer {
  if (typeof hashId !== 'string') throw new ArgumentError('hashId', 'a string', hashId);
  const encoding = hashId.slice(0, 2);
  if (!isItemOfArray(encoding, idTagToEncoding)) throw new TagNotFoundError(encoding);
  const idTag = idTagToEncoding.indexOf(encoding) + 1;
  return Buffer.from([...toBytes(idTag), ...decode(hashId)]);
}

/**
 * Utility function to read and _id type
 * @category transaction builder
 * @param buf - Data
 * @returns Encoided hash string with prefix
 */
export function readId(buf: Buffer): Encoded.Generic<AddressEncodings> {
  const idTag = Buffer.from(buf).readUIntBE(0, 1);
  const encoding = idTagToEncoding[idTag - 1];
  if (encoding == null) throw new PrefixNotFoundError(idTag);
  return encode(buf.slice(1, buf.length), encoding);
}
