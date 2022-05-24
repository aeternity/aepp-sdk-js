/**
 * AccountRpc module
 * @module @aeternity/aepp-sdk/es/account/rpc
 * @export AccountRpc
 */
import AccountBase, { _AccountBase } from './base'
import { METHODS } from '../utils/aepp-wallet-communication/schema'
import { NotImplementedError } from '../utils/errors'
import { EncodedData } from '../utils/encoder'
import type stampit from '@stamp/it' // eslint-disable-line @typescript-eslint/no-unused-vars

class _AccountRpc extends _AccountBase {
  _rpcClient: any
  _address: EncodedData<'ak'>

  init (
    { rpcClient, address, ...options }: { rpcClient: any, address: EncodedData<'ak'> } & Parameters<_AccountBase['init']>[0]
  ): void {
    super.init(options)
    this._rpcClient = rpcClient
    this._address = address
  }

  async sign (data: string | Buffer, options?: any): Promise<Uint8Array> {
    throw new NotImplementedError('RAW signing using wallet')
  }

  async address (): Promise<EncodedData<'ak'>> {
    return this._address
  }

  /**
   * @function signTransaction
   * @instance
   * @rtype (tx: String, options = {}) => Promise
   * @return {Promise<String>} Signed transaction
   */
  async signTransaction (
    tx: EncodedData<'tx'>, options: Parameters<_AccountBase['signTransaction']>[1]
  ): Promise<EncodedData<'tx'>> {
    return this._rpcClient.request(METHODS.sign, {
      ...options,
      onAccount: this._address,
      tx,
      returnSigned: true
    })
  }

  /**
   * @function signMessage
   * @instance
   * @rtype (message: String, options = {}) => Promise
   * @return {Promise<String>} Signed message
   */
  async signMessage (
    message: string, options: Parameters<_AccountBase['signMessage']>[1]
  ): Promise<string | Uint8Array> {
    return this._rpcClient.request(
      METHODS.signMessage, { ...options, onAccount: this._address, message }
    )
  }
}

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
export default AccountBase.compose<_AccountRpc>({
  init: _AccountRpc.prototype.init,
  methods: {
    sign: _AccountRpc.prototype.sign,
    address: _AccountRpc.prototype.address,
    signTransaction: _AccountRpc.prototype.signTransaction,
    signMessage: _AccountRpc.prototype.signMessage
  }
})