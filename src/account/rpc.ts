/**
 * AccountRpc module
 * @module @aeternity/aepp-sdk/es/account/rpc
 */
import AccountBase from './base'
import { METHODS } from '../utils/aepp-wallet-communication/schema'
import { NotImplementedError } from '../utils/errors'
import { EncodedData } from '../utils/encoder'

/**
 * Account provided by wallet
 * @alias module:@aeternity/aepp-sdk/es/account/rpc
 * @param param
 * @param param.rpcClient RpcClient instance
 * @param param.address RPC account address
 * @returns AccountRpc instance
 */
export default class AccountRpc extends AccountBase {
  _rpcClient: any
  _address: EncodedData<'ak'>

  constructor (
    { rpcClient, address, ...options }:
    { rpcClient: any, address: EncodedData<'ak'> } & ConstructorParameters<typeof AccountBase>[0]
  ) {
    super(options)
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
   * @instance
   * @returns {Promise<String>} Signed transaction
   */
  async signTransaction (
    tx: EncodedData<'tx'>,
    { innerTx, networkId }: Parameters<AccountBase['signTransaction']>[1] = {}
  ): Promise<EncodedData<'tx'>> {
    if (innerTx != null) throw new NotImplementedError('innerTx option in AccountRpc')
    const res = await this._rpcClient.request(METHODS.sign, {
      onAccount: this._address,
      tx,
      returnSigned: true
    })
    return res.signedTransaction
  }

  /**
   * @instance
   * @returns {Promise<String>} Signed message
   */
  async signMessage (
    message: string, { returnHex = false }: Parameters<AccountBase['signMessage']>[1] = {}
  ): Promise<string | Uint8Array> {
    const { signature } = await this._rpcClient.request(
      METHODS.signMessage, { onAccount: this._address, message }
    )
    return returnHex ? signature : Buffer.from(signature, 'hex')
  }
}
