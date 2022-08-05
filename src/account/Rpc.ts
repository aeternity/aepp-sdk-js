import AccountBase from './Base';
import { METHODS } from '../aepp-wallet-communication/schema';
import { NotImplementedError } from '../utils/errors';
import { Encoded } from '../utils/encoder';

/**
 * Account provided by wallet
 * @param params - Params
 * @param params.rpcClient - RpcClient instance
 * @param params.address - RPC account address
 * @returns AccountRpc instance
 */
export default class AccountRpc extends AccountBase {
  _rpcClient: any;

  override readonly address: Encoded.AccountAddress;

  constructor(
    { rpcClient, address }: { rpcClient: any; address: Encoded.AccountAddress },
  ) {
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
    const res = await this._rpcClient.request(METHODS.sign, {
      onAccount: this.address,
      tx,
      returnSigned: true,
      /**
       * @deprecated Wallet provided networkId will be used (current network)
       * required to maintain backward compatibility with wallets using SDK v11.0.1 and below
       * @see {@link https://github.com/aeternity/aepp-sdk-js/commit/153fd89a52c4eab39fcd659b356b36d32129c1ba}
       */
      networkId,
    });
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
