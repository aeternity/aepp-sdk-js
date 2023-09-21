import { Encoded } from '../../utils/encoder';
import { Domain, AciValue } from '../../utils/typed-data';
import { METHODS, SUBSCRIPTION_TYPES, WALLET_TYPE } from '../schema';
import { TransformNodeType } from '../../Node';
import { SignedTx } from '../../apis/node';
import { AensName } from '../../tx/builder/constants';

export interface WalletInfo {
  id: string;
  name: string;
  networkId: string;
  origin: string; // TODO: origin needs to be provided by transport
  type: WALLET_TYPE;
}

export interface Accounts {
  connected: { [pub: Encoded.AccountAddress]: {} };
  current: { [pub: Encoded.AccountAddress]: {} };
}

export interface Node {
  // TODO: name is not used, can be removed
  name: string;
  url: string;
}

export interface Network {
  networkId: string;
  node?: Node;
}

type Icons = Array<{ src: string; sizes?: string; type?: string; purpose?: string }>;

export const RPC_VERSION = 1;

export interface WalletApi {
  [METHODS.connect]: (
    p: { name: string; icons?: Icons; version: typeof RPC_VERSION; connectNode: boolean }
  ) => Promise<WalletInfo & { node?: Node }>;

  [METHODS.closeConnection]: (p: any) => void;

  [METHODS.subscribeAddress]: (
    p: { type: SUBSCRIPTION_TYPES; value: 'connected' | 'current' }
  ) => Promise<{ subscription: Array<'connected' | 'current'>; address: Accounts }>;

  [METHODS.address]: () => Promise<Encoded.AccountAddress[]>;

  [METHODS.sign]: ((
    p: {
      tx: Encoded.Transaction;
      onAccount: Encoded.AccountAddress;
      returnSigned: boolean;
      /**
       * @deprecated Wallet provided networkId will be used (current network)
       * required to maintain backward compatibility with wallets using SDK v11.0.1 and below
       * @see {@link https://github.com/aeternity/aepp-sdk-js/commit/153fd89a52c4eab39fcd659b356b36d32129c1ba}
       */
      networkId: string;
      innerTx?: boolean;
    }
  ) => Promise<{
    /**
     * @deprecated this is not a hash at all, will be removed later at the same time
     * as dropping ability to broadcast transaction by wallet
     */
    transactionHash?: Partial<TransformNodeType<SignedTx>> & {
      hash: Encoded.TxHash;
      rawTx: Encoded.Transaction;
    };
    signedTransaction?: Encoded.Transaction;
  }>);

  [METHODS.signMessage]: (
    p: { message: string; onAccount: Encoded.AccountAddress }
  ) => Promise<{ signature: string }>;

  [METHODS.signTypedData]: (
    p: {
      domain: Domain;
      aci: AciValue;
      data: Encoded.ContractBytearray;
      onAccount: Encoded.AccountAddress;
    },
  ) => Promise<{ signature: Encoded.Signature }>;

  [METHODS.signDelegationToContract]: (
    p: {
      contractAddress: Encoded.ContractAddress;
      name?: AensName;
      oracleQueryId?: Encoded.OracleQueryId;
      onAccount: Encoded.AccountAddress;
    },
  ) => Promise<{ signature: Encoded.Signature }>;
}

export interface AeppApi {
  [METHODS.updateAddress]: (a: Accounts) => void;
  [METHODS.updateNetwork]: (a: Network) => void;
  [METHODS.readyToConnect]: (w: WalletInfo) => void;
  [METHODS.closeConnection]: (p: any) => void;
}
