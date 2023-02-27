import BigNumber from 'bignumber.js';
import { genSalt, hash } from '../../utils/crypto';
import {
  decode, encode, Encoded, Encoding,
} from '../../utils/encoder';
import { toBytes } from '../../utils/bytes';
import { concatBuffers } from '../../utils/other';
import {
  AensName,
  Int,
  NAME_BID_RANGES,
  NAME_BID_TIMEOUT_BLOCKS,
  NAME_FEE_BID_INCREMENT,
  NAME_MAX_LENGTH_FEE,
} from './constants';
import { ArgumentError } from '../../utils/errors';

/**
 * JavaScript-based Transaction builder helper function's
 */

/**
 * Build a contract public key
 * @category contract
 * @param ownerId - The public key of the owner account
 * @param nonce - the nonce of the transaction
 * @returns Contract public key
 */
export function buildContractId(
  ownerId: Encoded.AccountAddress,
  nonce: number,
): Encoded.ContractAddress {
  const ownerIdAndNonce = Buffer.from([...decode(ownerId), ...toBytes(nonce)]);
  const b2bHash = hash(ownerIdAndNonce);
  return encode(b2bHash, Encoding.ContractAddress);
}

/**
 * Build a oracle query id
 * @category oracle
 * @param senderId - The public key of the sender account
 * @param nonce - the nonce of the transaction
 * @param oracleId - The oracle public key
 * @returns Contract public key
 */
export function oracleQueryId(
  senderId: Encoded.AccountAddress,
  nonce: number,
  oracleId: Encoded.OracleAddress,
): Encoded.OracleQueryId {
  function _int32(val: number): Buffer {
    const nonceBE = toBytes(val, true);
    return concatBuffers([Buffer.alloc(32 - nonceBE.length), nonceBE]);
  }

  const b2bHash = hash(
    Buffer.from([...decode(senderId), ..._int32(nonce), ...decode(oracleId)]),
  );
  return encode(b2bHash, Encoding.OracleQueryId);
}

/**
 * Encode an AENS name
 * @category AENS
 * @param name - Name to encode
 * @returns `nm_` prefixed encoded AENS name
 */
export function produceNameId(name: AensName): Encoded.Name {
  return encode(hash(name.toLowerCase()), Encoding.Name);
}

/**
 * Generate the commitment hash by hashing the salt and
 * name, base 58 encoding the result and prepending 'cm_'
 * @category transaction builder
 * @param name - Name to be registered
 * @param salt - Random number
 * @returns Commitment hash
 */
export function commitmentHash(
  name: AensName,
  salt: number = genSalt(),
): Encoded.Commitment {
  return encode(
    hash(concatBuffers([
      Buffer.from(name.toLowerCase()),
      Buffer.from(salt.toString(16).padStart(64, '0'), 'hex'),
    ])),
    Encoding.Commitment,
  );
}

/**
 * Utility function to convert bytes to int
 * @category transaction builder
 * @param buf - Value
 * @returns Buffer Buffer from number(BigEndian)
 */
export function readInt(buf: Buffer = Buffer.from([])): string {
  return new BigNumber(Buffer.from(buf).toString('hex'), 16).toString(10);
}

const AENS_SUFFIX = '.chain';

/**
 * Is AENS name valid
 * @category AENS
 * @param name - AENS name
 */
export function isNameValid(name: string): name is AensName {
  // TODO: probably there are stronger requirements
  return name.endsWith(AENS_SUFFIX);
}

const encodingToPointerKey = [
  [Encoding.AccountAddress, 'account_pubkey'],
  [Encoding.OracleAddress, 'oracle_pubkey'],
  [Encoding.ContractAddress, 'contract_pubkey'],
  [Encoding.Channel, 'channel'],
] as const;

/**
 * @category AENS
 * @param identifier - account/oracle/contract address, or channel
 * @returns default AENS pointer key
 */
export function getDefaultPointerKey(
  identifier: Encoded.Generic<typeof encodingToPointerKey[number][0]>,
): typeof encodingToPointerKey[number][1] {
  decode(identifier);
  const encoding = identifier.substring(0, 2);
  const result = encodingToPointerKey.find(([e]) => e === encoding)?.[1];
  if (result != null) return result;
  throw new ArgumentError(
    'identifier',
    `prefixed with one of ${encodingToPointerKey.map(([e]) => `${e}_`).join(', ')}`,
    identifier,
  );
}

/**
 * Get the minimum AENS name fee
 * @category AENS
 * @param name - the AENS name to get the fee for
 * @returns the minimum fee for the AENS name auction
 */
export function getMinimumNameFee(name: AensName): bigint {
  const nameLength = name.length - AENS_SUFFIX.length;
  return NAME_BID_RANGES[Math.min(nameLength, NAME_MAX_LENGTH_FEE)];
}

/**
 * Compute bid fee for AENS auction
 * @category AENS
 * @param name - the AENS name to get the fee for
 * @param options - Options
 * @param options.startFee - Auction start fee
 * @param options.increment - Bid multiplier(In percentage, must be between 0 and 1)
 * @returns Bid fee
 */
export function computeBidFee(
  name: AensName,
  { startFee = getMinimumNameFee(name), increment = NAME_FEE_BID_INCREMENT }:
  { startFee?: Int | bigint; increment?: number } = {},
): bigint {
  if (increment < NAME_FEE_BID_INCREMENT) {
    throw new ArgumentError('increment', `not less than ${NAME_FEE_BID_INCREMENT}`, increment);
  }
  return BigInt(Math.ceil(Number(startFee) * (increment + 1)));
}

/**
 * Compute auction end height
 * @category AENS
 * @param name - Name to compute auction end for
 * @param claimHeight - Auction starting height
 * @see {@link https://github.com/aeternity/aeternity/blob/72e440b8731422e335f879a31ecbbee7ac23a1cf/apps/aecore/src/aec_governance.erl#L273}
 * @returns Auction end height
 */
export function computeAuctionEndBlock(name: AensName, claimHeight: number): number {
  const length = name.length - AENS_SUFFIX.length;
  const h = (length <= 4 ? 62 * NAME_BID_TIMEOUT_BLOCKS : null)
    ?? (length <= 8 ? 31 * NAME_BID_TIMEOUT_BLOCKS : null)
    ?? (length <= 12 ? NAME_BID_TIMEOUT_BLOCKS : null)
    ?? 0;
  return h + claimHeight;
}

/**
 * Is name accept going to auction
 * @category AENS
 */
export function isAuctionName(name: AensName): boolean {
  return name.length < 13 + AENS_SUFFIX.length;
}
