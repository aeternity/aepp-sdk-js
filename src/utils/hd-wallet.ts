import nacl from 'tweetnacl';
import { full as hmac } from 'tweetnacl-auth';
import { fromString } from 'bip32-path';
import { decryptKey, encryptKey } from './crypto';
import { encode } from './encoder';
import { CryptographyError } from './errors';
import { bytesToHex } from './bytes';
import { concatBuffers } from './other';

/**
 * @category exception
 */
export class DerivationError extends CryptographyError {
  constructor(message: string) {
    super(message);
    this.name = 'DerivationError';
  }
}

const ED25519_CURVE = Buffer.from('ed25519 seed');
const HARDENED_OFFSET = 0x80000000;

interface KeyTreeNode {
  secretKey: Uint8Array;
  chainCode: Uint8Array;
}

interface HDWallet {
  secretKey: string;
  chainCode: string;
}

interface Account {
  secretKey: string;
  publicKey: string;
}

type Dec<N extends number> = [-1, 0, 1, 2, 3, 4][N];
type Bip32PathT<MaxLen extends number, H extends 'H' | 'h' | '\''> = MaxLen extends -1
  ? `${number}${H}`
  : Bip32PathT<Dec<MaxLen>, H> | `${Bip32PathT<Dec<MaxLen>, H>}/${number}${H}`;
type Bip32Path<MaxLen extends number> =
  '' | Bip32PathT<MaxLen, 'H'> | Bip32PathT<MaxLen, 'h'> | Bip32PathT<MaxLen, '\''>;

export function derivePathFromKey(path: Bip32Path<5>, key: KeyTreeNode): KeyTreeNode {
  const segments = path === '' ? [] : fromString(path).toPathArray();
  segments.forEach((segment, i) => {
    if (segment < HARDENED_OFFSET) {
      throw new DerivationError(`Segment #${i + 1} is not hardened`);
    }
  });

  return segments.reduce((parentKey, segment) => deriveChild(parentKey, segment), key);
}

export function derivePathFromSeed(path: 'm' | `m/${Bip32Path<5>}`, seed: Uint8Array): KeyTreeNode {
  if (!['m', 'm/'].includes(path.slice(0, 2))) {
    throw new DerivationError('Root element is required');
  }
  const masterKey = getMasterKeyFromSeed(seed);
  return derivePathFromKey(path.slice(2) as Bip32Path<5>, masterKey);
}

function formatAccount(keys: nacl.SignKeyPair): Account {
  const { secretKey, publicKey } = keys;
  return {
    secretKey: bytesToHex(secretKey),
    publicKey: encode(publicKey, 'ak'),
  };
}

export function getKeyPair(secretKey: Uint8Array): nacl.SignKeyPair {
  return nacl.sign.keyPair.fromSeed(secretKey);
}

export function getMasterKeyFromSeed(seed: Uint8Array): KeyTreeNode {
  const I = hmac(seed, ED25519_CURVE);
  const IL = I.slice(0, 32);
  const IR = I.slice(32);
  return {
    secretKey: IL,
    chainCode: IR,
  };
}

export function deriveChild({ secretKey, chainCode }: KeyTreeNode, index: number): KeyTreeNode {
  if (index < HARDENED_OFFSET) {
    throw new DerivationError(`Segment ${index} is not hardened`);
  }
  const indexBuffer = Buffer.allocUnsafe(4);
  indexBuffer.writeUInt32BE(index, 0);

  const data = concatBuffers([Buffer.alloc(1, 0), secretKey, indexBuffer]);

  const I = hmac(data, chainCode);
  const IL = I.slice(0, 32);
  const IR = I.slice(32);
  return {
    secretKey: IL,
    chainCode: IR,
  };
}

export function generateSaveHDWalletFromSeed(seed: Uint8Array, password: string): HDWallet {
  const walletKey = derivePathFromSeed('m/44h/457h', seed);
  return {
    secretKey: bytesToHex(encryptKey(password, walletKey.secretKey)),
    chainCode: bytesToHex(encryptKey(password, walletKey.chainCode)),
  };
}

export function getSaveHDWalletAccounts(saveHDWallet: HDWallet, password: string, accountCount: number): Account[] {
  const walletKey = {
    secretKey: decryptKey(password, Buffer.from(saveHDWallet.secretKey, 'hex')),
    chainCode: decryptKey(password, Buffer.from(saveHDWallet.chainCode, 'hex')),
  };
  return (new Array(accountCount)).fill(undefined)
    .map((_, idx) => formatAccount(getKeyPair(derivePathFromKey(`${idx}h/0h/0h`, walletKey).secretKey)));
}

export const getHdWalletAccountFromSeed = (seed: Uint8Array, accountIdx: number): Account & { idx: number } => {
  const walletKey = derivePathFromSeed('m/44h/457h', seed);
  const derived = derivePathFromKey(`${accountIdx}h/0h/0h`, walletKey);
  const keyPair = getKeyPair(derived.secretKey);
  return {
    ...formatAccount(keyPair),
    idx: accountIdx,
  };
};
