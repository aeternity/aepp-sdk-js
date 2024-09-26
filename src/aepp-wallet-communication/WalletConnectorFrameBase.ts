import EventEmitter from 'eventemitter3';
import AccountRpc from '../account/Rpc';
import { Encoded } from '../utils/encoder';
import { Accounts, RPC_VERSION, Network, WalletApi, AeppApi, NetworkToSelect } from './rpc/types';
import RpcClient from './rpc/RpcClient';
import { METHODS, SUBSCRIPTION_TYPES } from './schema';
import { NoWalletConnectedError } from '../utils/errors';
import BrowserConnection from './connection/Browser';

interface EventsBase {
  accountsChange: (accounts: AccountRpc[]) => void;
  disconnect: (p: any) => void;
}

export default abstract class WalletConnectorFrameBase<T extends {}> extends EventEmitter<
  EventsBase | T
> {
  #rpcClient?: RpcClient<WalletApi, AeppApi>;

  #getRpcClient(): RpcClient<WalletApi, AeppApi> {
    if (this.#rpcClient == null)
      throw new NoWalletConnectedError('You are not connected to Wallet');
    return this.#rpcClient;
  }

  /**
   * Is connected to wallet
   */
  get isConnected(): boolean {
    return this.#rpcClient != null;
  }

  #accounts: AccountRpc[] = [];

  /**
   * Accounts provided by wallet over subscription
   */
  get accounts(): AccountRpc[] {
    return this.#accounts;
  }

  protected constructor() {
    super();
  }

  protected abstract _updateNetwork(params: Network): void;

  #updateAccounts(params: Accounts): void {
    const addresses = [
      ...new Set([...Object.keys(params.current), ...Object.keys(params.connected)]),
    ] as Encoded.AccountAddress[];
    this.#accounts = addresses.map((address) => new AccountRpc(this.#getRpcClient(), address));
    this.emit('accountsChange', this.#accounts);
  }

  static async _connect(
    name: string,
    connection: BrowserConnection,
    connector: WalletConnectorFrameBase<any>,
    connectNode: boolean,
  ): Promise<void> {
    let disconnectParams: any;

    const client = new RpcClient<WalletApi, AeppApi>(
      connection,
      () => {
        connector.#rpcClient = undefined;
        connector.#accounts = [];
        connector.emit('disconnect', disconnectParams);
      },
      {
        [METHODS.updateAddress]: connector.#updateAccounts.bind(connector),
        [METHODS.updateNetwork]: connector._updateNetwork.bind(connector),
        [METHODS.closeConnection]: (params) => {
          disconnectParams = params;
          client.connection.disconnect();
        },
        [METHODS.readyToConnect]: () => {},
      },
    );
    connector.#rpcClient = client;
    const walletInfo = await connector.#rpcClient.request(METHODS.connect, {
      name,
      version: RPC_VERSION,
      connectNode,
    });
    connector._updateNetwork(walletInfo);
  }

  /**
   * Disconnect from wallet
   */
  disconnect(): void {
    const client = this.#getRpcClient();
    client.notify(METHODS.closeConnection, { reason: 'bye' });
    client.connection.disconnect();
  }

  /**
   * Request accounts from wallet
   */
  async getAccounts(): Promise<AccountRpc[]> {
    const client = this.#getRpcClient();
    const addresses = await client.request(METHODS.address, undefined);
    return addresses.map((address) => new AccountRpc(client, address));
  }

  /**
   * Subscribe for wallet accounts, get account updates adding handler to `accountsChange` event
   * @param type - Subscription type
   * @param value - Should be one of 'current' (the selected account), 'connected' (all)
   * @returns Accounts from wallet
   */
  async subscribeAccounts(
    type: SUBSCRIPTION_TYPES,
    value: 'current' | 'connected',
  ): Promise<AccountRpc[]> {
    const result = await this.#getRpcClient().request(METHODS.subscribeAddress, { type, value });
    this.#updateAccounts(result.address);
    return this.#accounts;
  }

  /**
   * Ask wallet to select a network
   */
  async askToSelectNetwork(network: NetworkToSelect): Promise<void> {
    await this.#getRpcClient().request(METHODS.updateNetwork, network);
  }
}
