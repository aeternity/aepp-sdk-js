import AeSdkBase, { Account } from './AeSdkBase';
import AccountBase from './account/Base';
import AccountRpc from './account/Rpc';
import { decode, Encoded } from './utils/encoder';
import {
  Accounts, RPC_VERSION, WalletInfo, Network, WalletApi, AeppApi,
} from './aepp-wallet-communication/rpc/types';
import RpcClient from './aepp-wallet-communication/rpc/RpcClient';
import { METHODS, SUBSCRIPTION_TYPES } from './aepp-wallet-communication/schema';
import {
  AlreadyConnectedError,
  NoWalletConnectedError,
  UnsubscribedAccountError,
  UnAuthorizedAccountError,
  RpcConnectionError,
} from './utils/errors';
import Node from './Node';
import BrowserConnection from './aepp-wallet-communication/connection/Browser';

/**
 * RPC handler for AEPP side
 * Contain functionality for wallet interaction and connect it to sdk
 * @category aepp wallet communication
 */
export default class AeSdkAepp extends AeSdkBase {
  name: string;

  onAddressChange: (a: Accounts) => void;

  onDisconnect: (p: any) => void;

  onNetworkChange: (a: Network) => void;

  rpcClient?: RpcClient<WalletApi, AeppApi>;

  _accounts?: Accounts;

  /**
   * @param options - Options
   * @param options.name - Aepp name
   * @param options.onAddressChange - Call-back function for update address event
   * @param options.onDisconnect - Call-back function for disconnect event
   * @param options.onNetworkChange - Call-back function for update network event
   */
  constructor({
    name,
    onAddressChange = () => {},
    onDisconnect = () => {},
    onNetworkChange = () => {},
    ...other
  }: {
    name: string;
    onAddressChange: (a: Accounts) => void;
    onDisconnect: (p: any) => void;
    onNetworkChange: (a: Network) => void;
  } & ConstructorParameters<typeof AeSdkBase>[0]) {
    super(other);
    this.onAddressChange = onAddressChange;
    this.onDisconnect = onDisconnect;
    this.onNetworkChange = onNetworkChange;
    this.name = name;
  }

  _resolveAccount(account: Account = this.addresses()[0]): AccountBase {
    if (typeof account === 'string') {
      const address = account as Encoded.AccountAddress;
      decode(address);
      if (!this.addresses().includes(address)) throw new UnAuthorizedAccountError(address);
      account = new AccountRpc({ rpcClient: this.rpcClient, address });
    }
    if (account == null) this._ensureAccountAccess();
    return super._resolveAccount(account);
  }

  addresses(): Encoded.AccountAddress[] {
    if (this._accounts == null) return [];
    const current = Object.keys(this._accounts.current)[0];
    return [
      ...current != null ? [current] : [], ...Object.keys(this._accounts.connected),
    ] as Encoded.AccountAddress[];
  }

  /**
   * Connect to wallet
   * @param connection - Wallet connection object
   * @param options - Options
   * @param options.connectNode - Request wallet to bind node
   * @param options.name - Node name
   * @param options.select - Select this node as current
   */
  async connectToWallet(
    connection: BrowserConnection,
    { connectNode = false, name = 'wallet-node', select = false }:
    { connectNode?: boolean; name?: string; select?: boolean } = {},
  ): Promise<WalletInfo> {
    if (this.rpcClient != null) throw new AlreadyConnectedError('You are already connected to wallet');
    let disconnectParams: any;
    const client = new RpcClient<WalletApi, AeppApi>(
      connection,
      () => {
        delete this.rpcClient;
        delete this._accounts;
        this.onDisconnect(disconnectParams);
      },
      {
        [METHODS.updateAddress]: (params) => {
          this._accounts = params;
          this.onAddressChange(params);
        },
        [METHODS.updateNetwork]: (params) => {
          const { node } = params;
          if (node != null) this.addNode(node.name, new Node(node.url), true);
          this.onNetworkChange(params);
        },
        [METHODS.closeConnection]: (params) => {
          disconnectParams = params;
          client.connection.disconnect();
        },
        [METHODS.readyToConnect]: () => {},
      },
    );
    const { node, ...walletInfo } = await client
      .request(METHODS.connect, { name: this.name, version: RPC_VERSION, connectNode });
    if (connectNode) {
      if (node == null) throw new RpcConnectionError('Missing URLs of the Node');
      this.addNode(name, new Node(node.url), select);
    }
    this.rpcClient = client;
    return walletInfo;
  }

  /**
   * Disconnect from wallet
   */
  disconnectWallet(): void {
    this._ensureConnected();
    this.rpcClient.notify(METHODS.closeConnection, { reason: 'bye' });
    this.rpcClient.connection.disconnect();
  }

  /**
   * Ask addresses from wallet
   * @returns Addresses from wallet
   */
  async askAddresses(): Promise<Encoded.AccountAddress[]> {
    this._ensureAccountAccess();
    return this.rpcClient.request(METHODS.address, undefined);
  }

  /**
   * Subscribe for addresses from wallet
   * @param type - Subscription type
   * @param value - Should be one of 'current' (the selected account), 'connected' (all)
   * @returns Accounts from wallet
   */
  async subscribeAddress(
    type: SUBSCRIPTION_TYPES,
    value: 'current' | 'connected',
  ): Promise<ReturnType<WalletApi[METHODS.subscribeAddress]>> {
    this._ensureConnected();
    const result = await this.rpcClient.request(METHODS.subscribeAddress, { type, value });
    this._accounts = result.address;
    return result;
  }

  _ensureConnected(): asserts this is AeSdkAepp & { rpcClient: NonNullable<AeSdkAepp['rpcClient']> } {
    if (this.rpcClient != null) return;
    throw new NoWalletConnectedError('You are not connected to Wallet');
  }

  _ensureAccountAccess(): asserts this is AeSdkAepp & { rpcClient: NonNullable<AeSdkAepp['rpcClient']> } {
    this._ensureConnected();
    if (this.addresses().length !== 0) return;
    throw new UnsubscribedAccountError();
  }
}
