import { ArgumentError, PrefixNotFoundError, TagNotFoundError } from '../../utils/errors';
import { isKeyOfObject } from '../../utils/other';
import { toBytes } from '../../utils/bytes';
import { decode, encode, EncodedData } from '../../utils/encoder';

/**
 * Map of prefix to ID tag constant
 * @see {@link https://github.com/aeternity/protocol/blob/master/serializations.md#the-id-type}
 * @see {@link https://github.com/aeternity/aeserialization/blob/eb68fe331bd476910394966b7f5ede7a74d37e35/src/aeser_id.erl#L97-L102}
 * @see {@link https://github.com/aeternity/aeserialization/blob/eb68fe331bd476910394966b7f5ede7a74d37e35/src/aeser_api_encoder.erl#L163-L168}
 */
enum PrefixToIdTag {
  ak = 1,
  nm = 2,
  cm = 3,
  ok = 4,
  ct = 5,
  ch = 6,
}

type AddressPrefixes = keyof typeof PrefixToIdTag;

/**
 * Utility function to create and _id type
 * @category transaction builder
 * @param hashId - Encoded hash
 * @returns Buffer Buffer with ID tag and decoded HASh
 */
export function writeId(hashId: EncodedData<AddressPrefixes>): Buffer {
  if (typeof hashId !== 'string') throw new ArgumentError('hashId', 'a string', hashId);
  const prefix = hashId.slice(0, 2);
  if (!isKeyOfObject(prefix, PrefixToIdTag)) throw new TagNotFoundError(prefix);
  const idTag = PrefixToIdTag[prefix];
  return Buffer.from([...toBytes(idTag), ...decode(hashId)]);
}

/**
 * Utility function to read and _id type
 * @category transaction builder
 * @param buf - Data
 * @returns Encoided hash string with prefix
 */
export function readId(buf: Buffer): EncodedData<AddressPrefixes> {
  const idTag = Buffer.from(buf).readUIntBE(0, 1);
  const prefix = PrefixToIdTag[idTag] as AddressPrefixes;
  if (prefix == null) throw new PrefixNotFoundError(idTag);
  return encode(buf.slice(1, buf.length), prefix);
}
