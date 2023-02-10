import { AlreadyConnectedError, NoWalletConnectedError } from '../../utils/errors';

/**
 * Browser connection base interface
 * @category aepp wallet communication
 */
export default abstract class BrowserConnection {
  debug: boolean;

  protected constructor({ debug = false }: { debug?: boolean }) {
    this.debug = debug;
  }

  /**
   * Connect
   * @param onMessage - Message handler
   * @param onDisconnect - trigger when runtime connection in closed
   */
  connect(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onMessage: (message: any, origin: string, source: any) => void,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onDisconnect: () => void,
  ): void {
    if (this.isConnected()) throw new AlreadyConnectedError('You already connected');
  }

  /**
   * Disconnect
   */
  disconnect(): void {
    if (!this.isConnected()) throw new NoWalletConnectedError('You dont have connection. Please connect before');
  }

  /**
   * Receive message
   */
  protected receiveMessage(message: any): void {
    if (this.debug) console.log('Receive message:', message);
  }

  /**
   * Send message
   */
  sendMessage(message: any): void {
    if (this.debug) console.log('Send message:', message);
  }

  /**
   * Check if connected
   * @returns Is connected
   */
  abstract isConnected(): boolean;
}
