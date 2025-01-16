import { mnemonicToSeed, mnemonicToSeedSync } from '@scure/bip39';
import tweetnaclAuth from 'tweetnacl-auth';
import AccountBaseFactory from './BaseFactory.js';
import AccountMemory from './Memory.js';
import { encode, Encoding, Encoded, decode } from '../utils/encoder.js';
import { concatBuffers } from '../utils/other.js';
import { ArgumentError } from '../utils/errors.js';

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
  #mnemonicOrWalletOrSeed: string | Wallet | Uint8Array;

  /**
   * @param mnemonicOrWalletOrSeed - BIP39-compatible mnemonic phrase or a wallet/seed derived from
   * mnemonic
   */
  constructor(mnemonicOrWalletOrSeed: string | Wallet | Uint8Array) {
    super();
    this.#mnemonicOrWalletOrSeed = mnemonicOrWalletOrSeed;
  }

  #getWallet(sync: true): Wallet;
  #getWallet(sync: false): Wallet | Promise<Wallet>;
  #getWallet(sync: boolean): Wallet | Promise<Wallet> {
    const setWalletBySeed = (seed: Uint8Array): Wallet => {
      const masterKey = deriveKey(seed, ED25519_CURVE);
      const walletKey = derivePathFromKey(masterKey, [44, 457]);
      this.#mnemonicOrWalletOrSeed = {
        secretKey: encode(walletKey.secretKey, Encoding.Bytearray),
        chainCode: encode(walletKey.chainCode, Encoding.Bytearray),
      };
      return this.#mnemonicOrWalletOrSeed;
    };

    if (ArrayBuffer.isView(this.#mnemonicOrWalletOrSeed)) {
      if (this.#mnemonicOrWalletOrSeed.length !== 64) {
        throw new ArgumentError('seed length', 64, this.#mnemonicOrWalletOrSeed.length);
      }
      return setWalletBySeed(this.#mnemonicOrWalletOrSeed);
    }
    if (typeof this.#mnemonicOrWalletOrSeed === 'object') return this.#mnemonicOrWalletOrSeed;
    return sync
      ? setWalletBySeed(mnemonicToSeedSync(this.#mnemonicOrWalletOrSeed))
      : mnemonicToSeed(this.#mnemonicOrWalletOrSeed).then(setWalletBySeed);
  }

  /**
   * Get a wallet to initialize AccountMnemonicFactory instead mnemonic phrase.
   * In comparison with mnemonic, the wallet can be used to derive aeternity accounts only.
   */
  async getWallet(): Promise<Wallet> {
    return this.#getWallet(false);
  }

  /**
   * The same as `getWallet` but synchronous.
   */
  getWalletSync(): Wallet {
    return this.#getWallet(true);
  }

  #getAccountByWallet(accountIndex: number, wallet: Wallet): AccountMemory {
    const walletKey = {
      secretKey: decode(wallet.secretKey),
      chainCode: decode(wallet.chainCode),
    };
    const raw = derivePathFromKey(walletKey, [accountIndex, 0, 0]).secretKey;
    return new AccountMemory(encode(raw, Encoding.AccountSecretKey));
  }

  /**
   * Get an instance of AccountMemory for a given account index.
   * @param accountIndex - Index of account
   */
  async initialize(accountIndex: number): Promise<AccountMemory> {
    const wallet = await this.getWallet();
    return this.#getAccountByWallet(accountIndex, wallet);
  }

  /**
   * The same as `initialize` but synchronous.
   */
  initializeSync(accountIndex: number): AccountMemory {
    const wallet = this.getWalletSync();
    return this.#getAccountByWallet(accountIndex, wallet);
  }
}
