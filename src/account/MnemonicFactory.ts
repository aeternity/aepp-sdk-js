import { mnemonicToSeed } from '@scure/bip39';
import AccountBaseFactory from './BaseFactory';
import AccountMemory from './Memory';
import { generateSaveHDWalletFromSeed, getSaveHDWalletAccounts } from '../utils/hd-wallet';
import { Encoding, encode } from '../utils/encoder';
import { InternalError } from '../utils/errors';

/**
 * A factory class that generates instances of AccountMemory based on provided mnemonic phrase.
 */
export default class AccountMnemonicFactory extends AccountBaseFactory {
  readonly #mnemonic: string;

  /**
   * @param mnemonic - BIP39-compatible mnemonic phrase
   */
  constructor(mnemonic: string) {
    super();
    this.#mnemonic = mnemonic;
  }

  /**
   * Get an instance of AccountMemory for a given account index.
   * @param accountIndex - Index of account
   */
  async initialize(accountIndex: number): Promise<AccountMemory> {
    // TODO: improve performance, don't use AES
    const seed = await mnemonicToSeed(this.#mnemonic);
    const wallet = generateSaveHDWalletFromSeed(seed, '');
    const account = getSaveHDWalletAccounts(wallet, '', accountIndex + 1).at(-1);
    if (account == null) throw new InternalError('Account can\'t be empty');
    const secretKey = encode(
      Buffer.from(account.secretKey, 'hex').subarray(0, 32),
      Encoding.AccountSecretKey,
    );
    return new AccountMemory(secretKey);
  }
}
