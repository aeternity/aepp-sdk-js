import AeSdkBase, { Account } from './AeSdkBase';
import AccountBase from './account/Base';
import { decode, Encoded } from './utils/encoder';
import { UnavailableAccountError } from './utils/errors';

export default class AeSdk extends AeSdkBase {
  accounts: { [key: Encoded.AccountAddress]: AccountBase } = {};

  selectedAddress?: Encoded.AccountAddress;

  _resolveAccount(
    account: Account | Encoded.AccountAddress = this.selectedAddress,
  ): AccountBase {
    if (typeof account === 'string') {
      const address = account as Encoded.AccountAddress;
      decode(address);
      if (this.accounts[address] == null) throw new UnavailableAccountError(account);
      account = this.accounts[address];
    }
    return super._resolveAccount(account);
  }

  /**
   * Get accounts addresses
   * @example addresses()
   */
  addresses(): Encoded.AccountAddress[] {
    return Object.keys(this.accounts) as Encoded.AccountAddress[];
  }

  /**
   * Add specific account
   * @param account - Account instance
   * @param options - Options
   * @param options.select - Select account
   * @example addAccount(account)
   */
  async addAccount(account: AccountBase, { select }: { select?: boolean } = {}): Promise<void> {
    const address = await account.address();
    this.accounts[address] = account;
    if (select === true) this.selectAccount(address);
  }

  /**
   * Remove specific account
   * @param address - Address of account to remove
   * @example removeAccount(address)
   */
  removeAccount(address: Encoded.AccountAddress): void {
    if (this.accounts[address] == null) {
      console.warn(`removeAccount: Account for ${address} not available`);
      return;
    }
    delete this.accounts[address]; // eslint-disable-line @typescript-eslint/no-dynamic-delete
    if (this.selectedAddress === address) delete this.selectedAddress;
  }

  /**
   * Select specific account
   * @param address - Address of account to select
   * @example selectAccount('ak_xxxxxxxx')
   */
  selectAccount(address: Encoded.AccountAddress): void {
    decode(address);
    if (this.accounts[address] == null) throw new UnavailableAccountError(address);
    this.selectedAddress = address;
  }
}
