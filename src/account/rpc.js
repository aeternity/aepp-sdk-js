/**
 * AccountRpc module
 * @module @aeternity/aepp-sdk/es/account/rpc
 * @export AccountRpc
 */
import AccountBase from './base'
import { METHODS } from '../utils/aepp-wallet-communication/schema'
import { NotImplementedError } from '../utils/errors'

/**
 * Account provided by wallet
 * @alias module:@aeternity/aepp-sdk/es/account/rpc
 * @function
 * @rtype Stamp
 * @param {Object} param Init params object
 * @param {Object} param.rpcClient RpcClient instance
 * @param {Object} param.address RPC account address
 * @return {Object} AccountRpc instance
 */
export default AccountBase.compose({
  init ({ rpcClient, address }) {
    this._rpcClient = rpcClient
    this._address = address
  },
  methods: {
    sign () {
      throw new NotImplementedError('RAW signing using wallet')
    },
    async address () {
      return this._address
    },
    /**
     * @function signTransaction
     * @instance
     * @rtype (tx: String, options = {}) => Promise
     * @return {Promise<String>} Signed transaction
     */
    async signTransaction (tx, options) {
      return this._rpcClient.request(METHODS.sign, {
        ...options,
        onAccount: this._address,
        tx,
        returnSigned: true,
        networkId: this.getNetworkId(options)
      })
    },
    /**
     * @function signMessage
     * @instance
     * @rtype (message: String, options = {}) => Promise
     * @return {Promise<String>} Signed message
     */
    async signMessage (message, options) {
      return this._rpcClient.request(
        METHODS.signMessage, { ...options, onAccount: this._address, message }
      )
    }
  }
})
