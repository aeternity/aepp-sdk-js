import { send } from '../../spend';
import { Encoded } from '../../utils/encoder';
import { METHODS, SUBSCRIPTION_TYPES, WALLET_TYPE } from '../schema';

export interface WalletInfo {
  id: string;
  name: string;
  networkId: string;
  origin: string;
  type: WALLET_TYPE;
}

export interface Accounts {
  connected: { [pub: Encoded.AccountAddress]: {} };
  current: { [pub: Encoded.AccountAddress]: {} };
}

export interface Node {
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
    p: { tx: Encoded.Transaction; onAccount: Encoded.AccountAddress; returnSigned: boolean }
  ) => Promise<{
    /**
     * @deprecated this is not a hash at all, will be removed later at the same time
     * as dropping ability to broadcast transaction by wallet
     */
    transactionHash?: Awaited<ReturnType<typeof send>>;
    signedTransaction?: Encoded.Transaction;
  }>);

  [METHODS.signMessage]: (
    p: { message: string; onAccount: Encoded.AccountAddress }
  ) => Promise<{ signature: string }>;
}

export interface AeppApi {
  [METHODS.updateAddress]: (a: Accounts) => void;
  [METHODS.updateNetwork]: (a: Network) => void;
  [METHODS.readyToConnect]: (w: WalletInfo) => void;
  [METHODS.closeConnection]: (p: any) => void;
}
