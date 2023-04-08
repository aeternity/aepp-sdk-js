import AeSdkBase from './AeSdkBase';
import { OnAccount } from './AeSdkMethods';
import AccountBase from './account/Base';
import { decode, Encoded } from './utils/encoder';
import { UnavailableAccountError } from './utils/errors';

export default class AeSdk extends AeSdkBase {
  accounts: { [key: Encoded.AccountAddress]: AccountBase } = {};

  selectedAddress?: Encoded.AccountAddress;

  constructor(
    { accounts, ...options }: { accounts?: AccountBase[] }
    & ConstructorParameters<typeof AeSdkBase>[0] = {},
  ) {
    super(options);
    accounts?.forEach((account, idx) => this.addAccount(account, { select: idx === 0 }));
  }

  override _resolveAccount(account: OnAccount = this.selectedAddress): AccountBase {
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
  override addresses(): Encoded.AccountAddress[] {
    return Object.keys(this.accounts) as Encoded.AccountAddress[];
  }

  /**
   * Add specific account
   * @param account - Account instance
   * @param options - Options
   * @param options.select - Select account
   * @example addAccount(account)
   */
  addAccount(account: AccountBase, { select }: { select?: boolean } = {}): void {
    const { address } = account;
    this.accounts[address] = account;
    if (select === true) this.selectAccount(address);
  }

  /**
   * Remove specific account
   * @param address - Address of account to remove
   * @example removeAccount(address)
   */
  removeAccount(address: Encoded.AccountAddress): void {
    if (this.accounts[address] == null) throw new UnavailableAccountError(address);
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
