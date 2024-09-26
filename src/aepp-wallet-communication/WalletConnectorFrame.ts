import { Network } from './rpc/types';
import BrowserConnection from './connection/Browser';
import WalletConnectorFrameBase from './WalletConnectorFrameBase';

interface EventsNetworkId {
  networkIdChange: (networkId: string) => void;
}

/**
 * Connect to wallet as iframe/web-extension
 * @category aepp wallet communication
 */
export default class WalletConnectorFrame extends WalletConnectorFrameBase<EventsNetworkId> {
  #networkId = '';

  /**
   * The last network id reported by wallet
   */
  get networkId(): string {
    return this.#networkId;
  }

  protected override _updateNetwork(params: Network): void {
    this.#networkId = params.networkId;
    this.emit('networkIdChange', this.#networkId);
  }

  /**
   * Connect to wallet
   * @param name - Aepp name
   * @param connection - Wallet connection object
   */
  static async connect(
    name: string,
    connection: BrowserConnection,
  ): Promise<WalletConnectorFrame> {
    const connector = new WalletConnectorFrame();
    await WalletConnectorFrame._connect(name, connection, connector, false);
    return connector;
  }
}
