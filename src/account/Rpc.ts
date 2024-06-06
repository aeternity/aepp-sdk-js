import AccountBase from './Base';
import { METHODS } from '../aepp-wallet-communication/schema';
import { ArgumentError, NotImplementedError, UnsupportedProtocolError } from '../utils/errors';
import {
  Encoded, Encoding, decode, encode,
} from '../utils/encoder';
import RpcClient from '../aepp-wallet-communication/rpc/RpcClient';
import { AeppApi, WalletApi } from '../aepp-wallet-communication/rpc/types';
import { AensName, ConsensusProtocolVersion } from '../tx/builder/constants';
import { packDelegation } from '../tx/builder/delegation';
import { DelegationTag } from '../tx/builder/delegation/schema';

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

  async sign(dataRaw: string | Uint8Array): Promise<Uint8Array> {
    const data = encode(Buffer.from(dataRaw), Encoding.Bytearray);
    const { signature } = await this._rpcClient
      .request(METHODS.unsafeSign, { onAccount: this.address, data });
    return decode(signature);
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
    { consensusProtocolVersion, isOracle }: {
      consensusProtocolVersion?: ConsensusProtocolVersion;
      isOracle?: boolean;
    } = {},
  ): Promise<Encoded.Signature> {
    if (isOracle == null) {
      const protocol = (consensusProtocolVersion != null) ? ConsensusProtocolVersion[consensusProtocolVersion] : 'unknown';
      console.warn(`AccountRpc:signDelegationToContract: isOracle is not set. By default, sdk would generate an AENS preclaim delegation signature, but it won't be the same as the oracle delegation signature in Ceres (current protocol is ${protocol}).`);
    }
    if (consensusProtocolVersion === ConsensusProtocolVersion.Ceres) {
      const delegation = packDelegation({
        tag: isOracle === true ? DelegationTag.Oracle : DelegationTag.AensPreclaim,
        accountAddress: this.address,
        contractAddress,
      });
      return this.signDelegation(delegation);
    }
    throw new NotImplementedError('');
  }

  override async signNameDelegationToContract(
    contractAddress: Encoded.ContractAddress,
    name: AensName,
    { consensusProtocolVersion }: { consensusProtocolVersion?: ConsensusProtocolVersion } = {},
  ): Promise<Encoded.Signature> {
    if (consensusProtocolVersion === ConsensusProtocolVersion.Ceres) {
      const delegation = packDelegation({
        tag: DelegationTag.AensName, accountAddress: this.address, contractAddress, nameId: name,
      });
      return this.signDelegation(delegation);
    }
    throw new NotImplementedError('');
  }

  override async signAllNamesDelegationToContract(
    contractAddress: Encoded.ContractAddress,
    { consensusProtocolVersion }: { consensusProtocolVersion?: ConsensusProtocolVersion } = {},
  ): Promise<Encoded.Signature> {
    if (consensusProtocolVersion === ConsensusProtocolVersion.Ceres) {
      const delegation = packDelegation({
        tag: DelegationTag.AensWildcard, accountAddress: this.address, contractAddress,
      });
      return this.signDelegation(delegation);
    }
    throw new NotImplementedError('');
  }

  override async signDelegation(delegation: Encoded.Bytearray): Promise<Encoded.Signature> {
    const { signature } = await this._rpcClient.request(
      METHODS.signDelegation,
      { delegation, onAccount: this.address },
    );
    return signature;
  }
}
