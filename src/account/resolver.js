/**
 * AccountResolver module
 * @module @aeternity/aepp-sdk/es/accounts/resolver
 * @export AccountResolver
 */

import MemoryAccount from './memory'
import AccountBase, { isAccountBase } from './base'
import { NotImplementedError, TypeError } from '../utils/errors'

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
export default AccountBase.compose({
  methods: {
    async address ({ onAccount } = {}) {
      return this._resolveAccount(onAccount).address()
    },
    async sign (data, { onAccount } = {}) {
      return this._resolveAccount(onAccount).sign(data)
    },
    async signTransaction (tx, { onAccount, ...options } = {}) {
      return this._resolveAccount(onAccount)
        .signTransaction(tx, { ...options, networkId: this.getNetworkId(options) })
    },
    async signMessage (message, { onAccount, ...options } = {}) {
      return this._resolveAccount(onAccount).signMessage(message, options)
    },
    /**
     * Resolves an account
     * @param {Object} account ak-address, instance of AccountBase, or keypair
     * @returns {AccountBase}
     * @private
     */
    _resolveAccount (account) {
      switch (account !== null && typeof account) {
        case 'string':
          throw new NotImplementedError('Address in AccountResolver')
        case 'object':
          return isAccountBase(account) ? account : MemoryAccount({ keypair: account })
        default:
          throw new TypeError(
            'Account should be an address (ak-prefixed string), ' +
            `keypair, or instance of AccountBase, got ${account} instead`)
      }
    }
  }
})
