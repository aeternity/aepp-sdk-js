import { Network } from './rpc/types';
import { RpcConnectionError } from '../utils/errors';
import Node from '../Node';
import BrowserConnection from './connection/Browser';
import WalletConnectorFrameBase from './WalletConnectorFrameBase';

interface EventsWithNode {
  nodeChange: (node: Node) => void;
}

/**
 * Connect to wallet as iframe/web-extension, asks wallet to provide node url
 * In comparison with WalletConnectorFrame, this would work better for decentralized applications
 * @category aepp wallet communication
 */
export default class WalletConnectorFrameWithNode extends WalletConnectorFrameBase<EventsWithNode> {
  #node: Node = null as unknown as Node;

  /**
   * The node instance provided by wallet
   */
  get node(): Node {
    return this.#node;
  }

  protected override _updateNetwork(params: Network): void {
    if (params.node?.url == null) throw new RpcConnectionError('Missing URLs of the Node');
    this.#node = new Node(params.node.url);
    this.emit('nodeChange', this.#node);
  }

  /**
   * Connect to wallet
   * @param name - Aepp name
   * @param connection - Wallet connection object
   */
  static async connect(
    name: string,
    connection: BrowserConnection,
  ): Promise<WalletConnectorFrameWithNode> {
    const connector = new WalletConnectorFrameWithNode();
    await super._connect(name, connection, connector, true);
    return connector;
  }
}
