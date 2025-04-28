import { BigNumber } from 'bignumber.js';
import { genSalt, hash } from '../../utils/crypto.js';
import { decode, encode, Encoded, Encoding } from '../../utils/encoder.js';
import { toBytes } from '../../utils/bytes.js';
import { concatBuffers } from '../../utils/other.js';
import {
  AensName,
  NAME_BID_RANGES,
  NAME_FEE_BID_INCREMENT,
  NAME_MAX_LENGTH_FEE,
} from './constants.js';
import { ceil } from '../../utils/bignumber.js';
import { ArgumentError, IllegalBidFeeError } from '../../utils/errors.js';

/**
 * JavaScript-based Transaction builder helper function's
 */

/**
 * Build a contract address
 * @category contract
 * @param owner - Address of contract owner
 * @param nonce - Nonce of ContractCreateTx or state channel round when contract was created
 * @returns Contract address
 */
export function buildContractId(
  owner: Encoded.AccountAddress,
  nonce: number | BigNumber,
): Encoded.ContractAddress {
  const ownerIdAndNonce = Buffer.from([...decode(owner), ...toBytes(nonce)]);
  const b2bHash = hash(ownerIdAndNonce);
  return encode(b2bHash, Encoding.ContractAddress);
}

// TODO: add `build` prefix the same as others
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
  nonce: number | BigNumber | string,
  oracleId: Encoded.OracleAddress,
): Encoded.OracleQueryId {
  function _int32(val: number | string | BigNumber): Buffer {
    const nonceBE = toBytes(val, true);
    return concatBuffers([Buffer.alloc(32 - nonceBE.length), nonceBE]);
  }

  const b2bHash = hash(Buffer.from([...decode(senderId), ..._int32(nonce), ...decode(oracleId)]));
  return encode(b2bHash, Encoding.OracleQueryId);
}

const AENS_SUFFIX = '.chain';

export function nameToPunycode(maybeName: string): AensName {
  const [name, suffix, ...other] = maybeName.split('.');
  if (other.length !== 0) throw new ArgumentError('aens name', 'including only one dot', maybeName);
  if (suffix !== AENS_SUFFIX.slice(1)) {
    throw new ArgumentError('aens name', `suffixed with ${AENS_SUFFIX}`, maybeName);
  }
  if (/\p{Emoji_Presentation}/u.test(name)) {
    throw new ArgumentError('aens name', 'not containing emoji', maybeName);
  }
  if (name[2] === '-' && name[3] === '-') {
    throw new ArgumentError(
      'aens name',
      'without "-" char in both the third and fourth positions',
      maybeName,
    );
  }
  if (name[0] === '-') {
    throw new ArgumentError('aens name', 'starting with no "-" char', maybeName);
  }
  if (name.at(-1) === '-') {
    throw new ArgumentError('aens name', 'ending with no "-" char', maybeName);
  }
  let punycode;
  try {
    const u = new URL(`http://${name}.${suffix}`);
    if (u.username + u.password + u.port + u.search + u.hash !== '' || u.pathname !== '/') {
      throw new ArgumentError('aens name', 'valid', maybeName);
    }
    punycode = u.host;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('Invalid URL')) {
      throw new ArgumentError('aens name', 'valid', maybeName);
    }
    throw error;
  }
  if (!/^[a-z0-9.-]+$/i.test(punycode)) {
    throw new ArgumentError('aens name', 'without illegal chars', maybeName);
  }
  if (punycode.length > 63 + AENS_SUFFIX.length) {
    throw new ArgumentError('aens name', 'not too long', maybeName);
  }
  return punycode as AensName;
}

// TODO: replace `produce` with `build` the same as others
/**
 * Encode an AENS name
 * @category AENS
 * @param name - Name to encode
 * @returns `nm_` prefixed encoded AENS name
 */
export function produceNameId(name: AensName): Encoded.Name {
  return encode(hash(nameToPunycode(name)), Encoding.Name);
}

// TODO: add `build` the same as others
/**
 * Generate the commitment hash by hashing the salt and
 * name, base 58 encoding the result and prepending 'cm_'
 * @category transaction builder
 * @param name - Name to be registered
 * @param salt - Random number
 * @returns Commitment hash
 */
export function commitmentHash(name: AensName, salt: number = genSalt()): Encoded.Commitment {
  return encode(
    hash(
      concatBuffers([
        Buffer.from(nameToPunycode(name)),
        Buffer.from(salt.toString(16).padStart(64, '0'), 'hex'),
      ]),
    ),
    Encoding.Commitment,
  );
}

/**
 * Utility function to convert bytes to int
 * @category utils
 * @param buffer - Value
 * @returns Buffer Buffer from number(BigEndian)
 * @deprecated use `BigInt('0x' + <buffer>.toString('hex')).toString()` instead
 */
export function readInt(buffer: Uint8Array = Buffer.from([])): string {
  return BigInt('0x' + Buffer.from(buffer).toString('hex')).toString();
}

/**
 * Ensure that name is valid AENS name, would throw an exception otherwise
 * @category AENS
 * @param maybeName - AENS name
 */
export function ensureName(maybeName: string): asserts maybeName is AensName {
  nameToPunycode(maybeName);
}

/**
 * Is AENS name valid
 * @category AENS
 * @param maybeName - AENS name
 */
export function isName(maybeName: string): maybeName is AensName {
  try {
    ensureName(maybeName);
    return true;
  } catch (error) {
    return false;
  }
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
  identifier: Encoded.Generic<(typeof encodingToPointerKey)[number][0]>,
): (typeof encodingToPointerKey)[number][1] {
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
export function getMinimumNameFee(name: AensName): BigNumber {
  const nameLength = nameToPunycode(name).length - AENS_SUFFIX.length;
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
  {
    startFee,
    increment = NAME_FEE_BID_INCREMENT,
  }: { startFee?: number | string | BigNumber; increment?: number } = {},
): BigNumber {
  if (!(Number(increment) === increment && increment % 1 !== 0))
    throw new IllegalBidFeeError(`Increment must be float. Current increment ${increment}`);
  if (increment < NAME_FEE_BID_INCREMENT)
    throw new IllegalBidFeeError(`minimum increment percentage is ${NAME_FEE_BID_INCREMENT}`);
  // FIXME: increment should be used somehow here
  return ceil(
    new BigNumber(startFee ?? getMinimumNameFee(name)).times(
      new BigNumber(NAME_FEE_BID_INCREMENT).plus(1),
    ),
  );
}

/**
 * Compute approximate auction end height.
 *
 * From Ceres, each time a new (successful!) bid is made for a name the auction is extended for up
 * to 120 key-blocks/generations. I.e. after the bid there is always at least 120 generations to
 * make a higher bid.
 *
 * @category AENS
 * @param name - Name to compute auction end for
 * @param claimHeight - Auction starting height
 * @see {@link https://github.com/aeternity/protocol/blob/cfb19ce/AENS.md#from-ceres-protocol-upgrade}
 * @returns Auction end height
 */
export function computeAuctionEndBlock(name: AensName, claimHeight: number): number {
  const length = nameToPunycode(name).length - AENS_SUFFIX.length;
  const h =
    (length <= 4 ? 2400 : null) ?? (length <= 8 ? 960 : null) ?? (length <= 12 ? 480 : null) ?? 0;
  return h + claimHeight;
}

/**
 * Is name accept going to auction
 * @category AENS
 */
export function isAuctionName(name: AensName): boolean {
  return nameToPunycode(name).length < 13 + AENS_SUFFIX.length;
}
