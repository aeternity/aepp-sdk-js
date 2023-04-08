import { Runtime } from 'webextension-polyfill';
import BrowserConnection from './Browser';
import { UnexpectedTsError } from '../../utils/errors';

/**
 * BrowserRuntimeConnection
 * Handle browser runtime communication
 * @category aepp wallet communication
 */
export default class BrowserRuntimeConnection extends BrowserConnection {
  port: Runtime.Port;

  #listeners?: [(message: any, port: Runtime.Port) => void, () => void];

  constructor({ port, ...options }: { port: Runtime.Port; debug: boolean }) {
    super(options);
    this.port = port;
  }

  override disconnect(): void {
    super.disconnect();
    this.port.disconnect();
    if (this.#listeners == null) throw new UnexpectedTsError();
    this.port.onMessage.removeListener(this.#listeners[0]);
    this.port.onDisconnect.removeListener(this.#listeners[1]);
    this.#listeners = undefined;
  }

  override connect(
    onMessage: (message: any, origin: string, source: Runtime.Port) => void,
    onDisconnect: () => void,
  ): void {
    super.connect(onMessage, onDisconnect);
    this.#listeners = [
      (message, port) => {
        this.receiveMessage(message);
        // TODO: make `origin` optional because sender url is not available on aepp side
        onMessage(message, port.sender?.url ?? '', port);
      },
      onDisconnect,
    ];
    this.port.onMessage.addListener(this.#listeners[0]);
    this.port.onDisconnect.addListener(this.#listeners[1]);
  }

  override sendMessage(message: any): void {
    super.sendMessage(message);
    this.port.postMessage(message);
  }

  isConnected(): boolean {
    return this.#listeners != null;
  }
}
