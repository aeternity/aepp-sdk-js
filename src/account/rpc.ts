import AccountBase from './base'
import { METHODS } from '../utils/aepp-wallet-communication/schema'
import { NotImplementedError } from '../utils/errors'
import { EncodedData } from '../utils/encoder'

/**
 * Account provided by wallet
 * @param params - Params
 * @param params.rpcClient - RpcClient instance
 * @param params.address - RPC account address
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

  async sign (data: string | Uint8Array, options?: any): Promise<Uint8Array> {
    throw new NotImplementedError('RAW signing using wallet')
  }

  async address (): Promise<EncodedData<'ak'>> {
    return this._address
  }

  /**
   * @returns Signed transaction
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
   * @returns Signed message
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
