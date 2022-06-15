import AeSdkBase, { Account } from './AeSdkBase'
import AccountBase from './account/base'
import { decode, EncodedData } from './utils/encoder'
import { UnavailableAccountError } from './utils/errors'

export default class AeSdk extends AeSdkBase {
  accounts: { [key: EncodedData<'ak'>]: AccountBase } = {}
  selectedAddress?: EncodedData<'ak'>

  _resolveAccount (account: Account | EncodedData<'ak'> = this.selectedAddress): AccountBase {
    if (typeof account === 'string') {
      const address = account as EncodedData<'ak'>
      decode(address)
      if (this.accounts[address] == null) throw new UnavailableAccountError(account)
      account = this.accounts[address]
    }
    return super._resolveAccount(account)
  }

  /**
   * Get accounts addresses
   * @alias module:@aeternity/aepp-sdk/es/accounts/multiple
   * @returns {String[]}
   * @example addresses()
   */
  addresses (): Array<EncodedData<'ak'>> {
    return Object.keys(this.accounts) as Array<EncodedData<'ak'>>
  }

  /**
   * Add specific account
   * @alias module:@aeternity/aepp-sdk/es/accounts/multiple
   * @param {Object} account - Account instance
   * @param {Object} [options={}] - Options
   * @param {Boolean} [options.select] - Select account
   * @returns {void}
   * @example addAccount(account)
   */
  async addAccount (account: AccountBase, { select }: { select?: boolean } = {}): Promise<void> {
    const address = await account.address()
    this.accounts[address] = account
    if (select === true) this.selectAccount(address)
  }

  /**
   * Remove specific account
   * @alias module:@aeternity/aepp-sdk/es/accounts/multiple
   * @param {String} address - Address of account to remove
   * @returns {void}
   * @example removeAccount(address)
   */
  removeAccount (address: EncodedData<'ak'>): void {
    if (this.accounts[address] == null) {
      console.warn(`removeAccount: Account for ${address} not available`)
      return
    }
    delete this.accounts[address] // eslint-disable-line @typescript-eslint/no-dynamic-delete
    if (this.selectedAddress === address) delete this.selectedAddress
  }

  /**
   * Select specific account
   * @alias module:@aeternity/aepp-sdk/es/account/selector
   * @instance
   * @param {String} address - Address of account to select
   * @example selectAccount('ak_xxxxxxxx')
   */
  selectAccount (address: EncodedData<'ak'>): void {
    decode(address)
    if (this.accounts[address] == null) throw new UnavailableAccountError(address)
    this.selectedAddress = address
  }
}
