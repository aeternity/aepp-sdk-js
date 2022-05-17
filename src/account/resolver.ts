/**
 * AccountResolver module
 * @module @aeternity/aepp-sdk/es/accounts/resolver
 * @export AccountResolver
 */

import MemoryAccount, { Keypair } from './memory'
import AccountBase, { isAccountBase, _AccountBase } from './base'
import { NotImplementedError, TypeError } from '../utils/errors'
import { EncodedData } from '../utils/encoder'
import type stampit from '@stamp/it' // eslint-disable-line @typescript-eslint/no-unused-vars

export type Account = Keypair | _AccountBase | any

export class _AccountResolver extends _AccountBase {
  async address ({ onAccount }: { onAccount?: Account } = {}): Promise<EncodedData<'ak'>> {
    return await this._resolveAccount(onAccount).address()
  }

  async sign (
    data: string, { onAccount, ...options }: { onAccount?: Account } = {}
  ): Promise<Uint8Array> {
    return await this._resolveAccount(onAccount).sign(data, options)
  }

  async signTransaction (
    tx: EncodedData<'tx'>,
    { onAccount, ...options }: { onAccount?: Account } & Parameters<_AccountBase['signTransaction']>[1] = {}
  ): Promise<EncodedData<'tx'>> {
    return await this._resolveAccount(onAccount)
      .signTransaction(tx, { ...options, networkId: this.getNetworkId(options) })
  }

  async signMessage (
    message: string,
    { onAccount, ...options }: { onAccount?: Account } & Parameters<_AccountBase['signMessage']>[1] = {}
  ): Promise<string | Uint8Array> {
    return await this._resolveAccount(onAccount).signMessage(message, options)
  }

  /**
   * Resolves an account
   * @param {Object} account ak-address, instance of AccountBase, or keypair
   * @returns {AccountBase}
   * @private
   */
  _resolveAccount (account?: Account): _AccountBase {
    switch (account !== null && typeof account) {
      case 'string':
        throw new NotImplementedError('Address in AccountResolver')
      case 'object':
        return isAccountBase(account) ? account : MemoryAccount({ keypair: account })
      default:
        throw new TypeError(
          'Account should be an address (ak-prefixed string), ' +
          `keypair, or instance of AccountBase, got ${String(account)} instead`)
    }
  }
}

/**
 * Stateless resolver of account passed in `onAccount` option
 * @function
 * @alias module:@aeternity/aepp-sdk/es/accounts/resolver
 * @rtype Stamp
 * @return {Object} AccountResolver instance
 * @example
 * const resolver = AccountResolver()
 * account = MemoryAccount({ keypair: 'keypair_object' })
 * resolver.address({ onAccount: account }) // Get account's address
 */
export default AccountBase.compose<_AccountResolver>({
  methods: {
    address: _AccountResolver.prototype.address,
    sign: _AccountResolver.prototype.sign,
    signTransaction: _AccountResolver.prototype.signTransaction,
    signMessage: _AccountResolver.prototype.signMessage,
    _resolveAccount: _AccountResolver.prototype._resolveAccount
  }
})
