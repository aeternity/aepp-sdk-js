import AccountBase from './Base';
import { METHODS } from '../aepp-wallet-communication/schema';
import { ArgumentError, NotImplementedError, UnsupportedProtocolError } from '../utils/errors';
import { Encoded } from '../utils/encoder';
import RpcClient from '../aepp-wallet-communication/rpc/RpcClient';
import { AeppApi, WalletApi } from '../aepp-wallet-communication/rpc/types';

/**
 * Account provided by wallet
 * @param params - Params
 * @param params.rpcClient - RpcClient instance
 * @param params.address - RPC account address
 * @returns AccountRpc instance
 */
export default class AccountRpc extends AccountBase {
  _rpcClient: RpcClient<WalletApi, AeppApi>;

  override readonly address: Encoded.AccountAddress;

  constructor(rpcClient: RpcClient<WalletApi, AeppApi>, address: Encoded.AccountAddress) {
    super();
    this._rpcClient = rpcClient;
    this.address = address;
  }

  // eslint-disable-next-line class-methods-use-this
  async sign(): Promise<Uint8Array> {
    throw new NotImplementedError('RAW signing using wallet');
  }

  /**
   * @returns Signed transaction
   */
  override async signTransaction(
    tx: Encoded.Transaction,
    { innerTx, networkId }: Parameters<AccountBase['signTransaction']>[1] = {},
  ): Promise<Encoded.Transaction> {
    if (innerTx != null) throw new NotImplementedError('innerTx option in AccountRpc');
    if (networkId == null) throw new ArgumentError('networkId', 'provided', networkId);
    const res = await this._rpcClient.request(METHODS.sign, {
      onAccount: this.address,
      tx,
      returnSigned: true,
      networkId,
    });
    if (res.signedTransaction == null) {
      throw new UnsupportedProtocolError('signedTransaction is missed in wallet response');
    }
    return res.signedTransaction;
  }

  /**
   * @returns Signed message
   */
  override async signMessage(message: string): Promise<Uint8Array> {
    const { signature } = await this._rpcClient
      .request(METHODS.signMessage, { onAccount: this.address, message });
    return Buffer.from(signature, 'hex');
  }
}
