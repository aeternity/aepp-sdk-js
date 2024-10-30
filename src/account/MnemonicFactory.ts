import { mnemonicToSeed } from '@scure/bip39';
import tweetnaclAuth from 'tweetnacl-auth';
import AccountBaseFactory from './BaseFactory.js';
import AccountMemory from './Memory.js';
import { encode, Encoding, Encoded, decode } from '../utils/encoder.js';
import { concatBuffers } from '../utils/other.js';
import { UnexpectedTsError } from '../utils/errors.js';

export const ED25519_CURVE = Buffer.from('ed25519 seed');
const HARDENED_OFFSET = 0x80000000;

interface KeyTreeNode {
  secretKey: Uint8Array;
  chainCode: Uint8Array;
}

export function deriveKey(message: Uint8Array, key: Uint8Array): KeyTreeNode {
  const I = tweetnaclAuth.full(message, key);
  const IL = I.slice(0, 32);
  const IR = I.slice(32);
  return {
    secretKey: IL,
    chainCode: IR,
  };
}

export function derivePathFromKey(key: KeyTreeNode, segments: readonly number[]): KeyTreeNode {
  return segments.reduce(({ secretKey, chainCode }, segment) => {
    const indexBuffer = Buffer.allocUnsafe(4);
    indexBuffer.writeUInt32BE(segment + HARDENED_OFFSET, 0);
    const data = concatBuffers([Buffer.alloc(1, 0), secretKey, indexBuffer]);
    return deriveKey(data, chainCode);
  }, key);
}

interface Wallet {
  secretKey: Encoded.Bytearray;
  chainCode: Encoded.Bytearray;
}

/**
 * A factory class that generates instances of AccountMemory based on provided mnemonic phrase.
 */
export default class AccountMnemonicFactory extends AccountBaseFactory {
  readonly #mnemonic: string | undefined;

  #wallet: Wallet | undefined;

  /**
   * @param mnemonicOrWallet - BIP39-compatible mnemonic phrase or a wallet derived from mnemonic
   */
  constructor(mnemonicOrWallet: string | Wallet) {
    super();
    if (typeof mnemonicOrWallet === 'string') this.#mnemonic = mnemonicOrWallet;
    else this.#wallet = mnemonicOrWallet;
  }

  /**
   * Get a wallet to initialize AccountMnemonicFactory instead mnemonic phrase.
   * In comparison with mnemonic, the wallet can be used to derive aeternity accounts only.
   */
  async getWallet(): Promise<Wallet> {
    if (this.#wallet != null) return this.#wallet;
    if (this.#mnemonic == null)
      throw new UnexpectedTsError(
        'AccountMnemonicFactory should be initialized with mnemonic or wallet',
      );
    const seed = await mnemonicToSeed(this.#mnemonic);
    const masterKey = deriveKey(seed, ED25519_CURVE);
    const walletKey = derivePathFromKey(masterKey, [44, 457]);
    this.#wallet = {
      secretKey: encode(walletKey.secretKey, Encoding.Bytearray),
      chainCode: encode(walletKey.chainCode, Encoding.Bytearray),
    };
    return this.#wallet;
  }

  async #getAccountSecretKey(accountIndex: number): Promise<Encoded.AccountSecretKey> {
    const wallet = await this.getWallet();
    const walletKey = {
      secretKey: decode(wallet.secretKey),
      chainCode: decode(wallet.chainCode),
    };
    const raw = derivePathFromKey(walletKey, [accountIndex, 0, 0]).secretKey;
    return encode(raw, Encoding.AccountSecretKey);
  }

  /**
   * Get an instance of AccountMemory for a given account index.
   * @param accountIndex - Index of account
   */
  async initialize(accountIndex: number): Promise<AccountMemory> {
    return new AccountMemory(await this.#getAccountSecretKey(accountIndex));
  }
}
