import canonicalize from 'canonicalize';
import AccountBase from '../account/Base.js';
import { Encoded, Encoding, decode, encode } from './encoder.js';
import { verifySignature } from './crypto.js';
import { ArgumentError, InvalidSignatureError } from './errors.js';

// TODO: use Buffer.from(data, 'base64url') after solving https://github.com/feross/buffer/issues/309
const toBase64Url = (data: Buffer | Uint8Array | string): string =>
  Buffer.from(data).toString('base64').replaceAll('/', '_').replaceAll('+', '-').replace(/=+$/, '');

const fromBase64Url = (data: string): Buffer =>
  Buffer.from(data.replaceAll('_', '/').replaceAll('-', '+'), 'base64');

const objectToBase64Url = (data: any): string => toBase64Url(canonicalize(data) ?? '');

const header = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9'; // objectToBase64Url({ alg: 'EdDSA', typ: 'JWT' })

/**
 * JWT including specific header
 * @category JWT
 */
export type Jwt = `${typeof header}.${string}.${string}`;

/**
 * Generate a signed JWT
 * Provide `"sub_jwk": undefined` in payload to omit signer public key added by default.
 * @param originalPayload - Payload to sign
 * @param account - Account to sign by
 * @category JWT
 */
export async function signJwt(originalPayload: any, account: AccountBase): Promise<Jwt> {
  const payload = { ...originalPayload };
  if (!('sub_jwk' in payload)) {
    payload.sub_jwk = {
      kty: 'OKP',
      crv: 'Ed25519',
      x: toBase64Url(decode(account.address)),
    };
  }
  if (payload.sub_jwk === undefined) delete payload.sub_jwk;
  const body = `${header}.${objectToBase64Url(payload)}` as const;
  const signature = await account.unsafeSign(body);
  return `${body}.${toBase64Url(signature)}`;
}

/**
 * Unpack JWT. It will check signature if address or "sub_jwk" provided.
 * @param jwt - JWT to unpack
 * @param address - Address to check signature
 * @category JWT
 */
export function unpackJwt(
  jwt: Jwt,
  address?: Encoded.AccountAddress,
): {
  /**
   * JWT payload as object
   */
  payload: any;
  /**
   * Undefined returned in case signature is not checked
   */
  signer: Encoded.AccountAddress | undefined;
} {
  const components = jwt.split('.');
  if (components.length !== 3)
    throw new ArgumentError('JWT components count', 3, components.length);
  const [h, payloadEncoded, signature] = components;
  if (h !== header) throw new ArgumentError('JWT header', header, h);
  const payload = JSON.parse(fromBase64Url(payloadEncoded).toString());
  const jwk = payload.sub_jwk ?? {};
  const signer =
    jwk.x == null || jwk.kty !== 'OKP' || jwk.crv !== 'Ed25519'
      ? address
      : encode(fromBase64Url(jwk.x), Encoding.AccountAddress);
  if (address != null && signer !== address) {
    throw new ArgumentError('address', `${signer} ("sub_jwk")`, address);
  }
  if (
    signer != null &&
    !verifySignature(Buffer.from(`${h}.${payloadEncoded}`), fromBase64Url(signature), signer)
  ) {
    throw new InvalidSignatureError(`JWT is not signed by ${signer}`);
  }
  return { payload, signer };
}

/**
 * Check is string a JWT or not. Use to validate the user input.
 * @param maybeJwt - A string to check
 * @returns True if argument is a JWT
 * @category JWT
 */
export function isJwt(maybeJwt: string): maybeJwt is Jwt {
  try {
    unpackJwt(maybeJwt as Jwt);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Throws an error if argument is not JWT. Use to ensure that a value is JWT.
 * @param maybeJwt - A string to check
 * @category JWT
 */
export function ensureJwt(maybeJwt: string): asserts maybeJwt is Jwt {
  unpackJwt(maybeJwt as Jwt);
}

/**
 * Check is JWT signed by address from arguments or "sub_jwk"
 * @param jwt - JWT to check
 * @param address - Address to check signature
 * @category JWT
 */
export function verifyJwt(jwt: Jwt, address?: Encoded.AccountAddress): boolean {
  try {
    const { signer } = unpackJwt(jwt, address);
    return signer != null;
  } catch (error) {
    return false;
  }
}
