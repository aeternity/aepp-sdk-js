import AccountBase from './Base';
import { METHODS } from '../aepp-wallet-communication/schema';
import { ArgumentError, NotImplementedError, UnsupportedProtocolError } from '../utils/errors';
import { Encoded } from '../utils/encoder';
import RpcClient from '../aepp-wallet-communication/rpc/RpcClient';
import { AeppApi, WalletApi } from '../aepp-wallet-communication/rpc/types';
import { AensName } from '../tx/builder/constants';

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

  override async signTransaction(
    tx: Encoded.Transaction,
    { innerTx, networkId }: Parameters<AccountBase['signTransaction']>[1] = {},
  ): Promise<Encoded.Transaction> {
    if (networkId == null) throw new ArgumentError('networkId', 'provided', networkId);
    const res = await this._rpcClient.request(METHODS.sign, {
      onAccount: this.address,
      tx,
      returnSigned: true,
      networkId,
      innerTx,
    });
    if (res.signedTransaction == null) {
      throw new UnsupportedProtocolError('signedTransaction is missed in wallet response');
    }
    return res.signedTransaction;
  }

  override async signMessage(message: string): Promise<Uint8Array> {
    const { signature } = await this._rpcClient
      .request(METHODS.signMessage, { onAccount: this.address, message });
    return Buffer.from(signature, 'hex');
  }

  override async signTypedData(
    data: Encoded.ContractBytearray,
    aci: Parameters<AccountBase['signTypedData']>[1],
    {
      name, version, contractAddress, networkId,
    }: Parameters<AccountBase['signTypedData']>[2] = {},
  ): Promise<Encoded.Signature> {
    const { signature } = await this._rpcClient.request(METHODS.signTypedData, {
      onAccount: this.address,
      domain: {
        name, version, networkId, contractAddress,
      },
      aci,
      data,
    });
    return signature;
  }

  override async signDelegationToContract(
    contractAddress: Encoded.ContractAddress,
  ): Promise<Encoded.Signature> {
    const { signature } = await this._rpcClient.request(METHODS.signDelegationToContract, {
      onAccount: this.address,
      contractAddress,
    });
    return signature;
  }

  override async signNameDelegationToContract(
    contractAddress: Encoded.ContractAddress,
    name: AensName,
  ): Promise<Encoded.Signature> {
    const { signature } = await this._rpcClient.request(METHODS.signDelegationToContract, {
      onAccount: this.address,
      contractAddress,
      name,
    });
    return signature;
  }

  override async signOracleQueryDelegationToContract(
    contractAddress: Encoded.ContractAddress,
    oracleQueryId: Encoded.OracleQueryId,
  ): Promise<Encoded.Signature> {
    const { signature } = await this._rpcClient.request(METHODS.signDelegationToContract, {
      onAccount: this.address,
      contractAddress,
      oracleQueryId,
    });
    return signature;
  }
}
