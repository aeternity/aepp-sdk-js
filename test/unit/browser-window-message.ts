import { describe, it } from 'mocha';
import { expect } from 'chai';
import { stub } from 'sinon';
import '../index';
import {
  AlreadyConnectedError,
  BrowserWindowMessageConnection,
  MESSAGE_DIRECTION,
  NoWalletConnectedError,
  RpcConnectionError,
} from '../../src';
import { ImplPostMessage } from '../../src/aepp-wallet-communication/connection/BrowserWindowMessage';

type Emittable = ImplPostMessage & {
  emit: (event: { data: any; origin?: string; source?: any }) => void;
  posted: Array<{ message: any; targetOrigin: string }>;
};

/**
 * A window that records what was posted and lets the test emit arbitrary events, so that `origin`
 * and `source` can be forged the way a hostile frame would.
 */
function emittableWindow(): Emittable {
  const listeners: Array<(event: any) => void> = [];
  return {
    posted: [],
    addEventListener(onEvent: string, listener: (event: any) => void) {
      listeners.push(listener);
    },
    removeEventListener(onEvent: string, listener: (event: any) => void) {
      const index = listeners.indexOf(listener);
      if (index !== -1) listeners.splice(index, 1);
    },
    postMessage(message: any, targetOrigin: any) {
      this.posted.push({ message, targetOrigin });
    },
    emit({ data, origin = 'https://wallet.test', source }) {
      // copied because a listener may disconnect its connection while being notified
      [...listeners].forEach((listener) => listener({ data, origin, source }));
    },
  };
}

const rpcMessage = { jsonrpc: '2.0', method: 'connection.announcePresence' };

describe('BrowserWindowMessageConnection', () => {
  describe('connect', () => {
    it('is not connected before connect', () => {
      const connection = new BrowserWindowMessageConnection({ self: emittableWindow() });
      expect(connection.isConnected()).to.equal(false);
    });

    it('is connected after connect', () => {
      const connection = new BrowserWindowMessageConnection({ self: emittableWindow() });
      connection.connect(
        () => {},
        () => {},
      );
      expect(connection.isConnected()).to.equal(true);
    });

    it('fails to connect twice', () => {
      const connection = new BrowserWindowMessageConnection({ self: emittableWindow() });
      connection.connect(
        () => {},
        () => {},
      );
      expect(() =>
        connection.connect(
          () => {},
          () => {},
        ),
      ).to.throw(AlreadyConnectedError, 'You already connected');
    });

    it('fails to disconnect if not connected', () => {
      const connection = new BrowserWindowMessageConnection({ self: emittableWindow() });
      expect(() => connection.disconnect()).to.throw(
        NoWalletConnectedError,
        'You dont have connection. Please connect before',
      );
    });

    it('stops handling messages after disconnect', () => {
      const self = emittableWindow();
      const connection = new BrowserWindowMessageConnection({ self });
      const received: any[] = [];
      let disconnected = false;
      connection.connect(
        (message) => received.push(message),
        () => {
          disconnected = true;
        },
      );
      connection.disconnect();
      self.emit({ data: rpcMessage });
      expect(received).to.eql([]);
      expect(disconnected).to.equal(true);
      expect(connection.isConnected()).to.equal(false);
    });
  });

  describe('receiving', () => {
    /**
     * @returns the messages accepted by a connection built with the passed options
     */
    function bindReceiver(
      options: Omit<
        NonNullable<ConstructorParameters<typeof BrowserWindowMessageConnection>[0]>,
        'self'
      > = {},
    ): { self: Emittable; received: Array<[any, string, any]> } {
      const self = emittableWindow();
      const connection = new BrowserWindowMessageConnection({ ...options, self });
      const received: Array<[any, string, any]> = [];
      connection.connect(
        (message, origin, source) => received.push([message, origin, source]),
        () => {},
      );
      return { self, received };
    }

    it('accepts a jsonrpc message', () => {
      const { self, received } = bindReceiver();
      self.emit({ data: rpcMessage });
      expect(received).to.eql([[rpcMessage, 'https://wallet.test', undefined]]);
    });

    it('ignores a message with non-object data', () => {
      const { self, received } = bindReceiver();
      self.emit({ data: 'hello' });
      expect(received).to.eql([]);
    });

    it('ignores a message without jsonrpc 2.0', () => {
      const { self, received } = bindReceiver();
      self.emit({ data: { method: 'connection.announcePresence' } });
      self.emit({ data: { jsonrpc: '1.0', method: 'connection.announcePresence' } });
      expect(received).to.eql([]);
    });

    it('accepts a message from the expected origin', () => {
      const { self, received } = bindReceiver({ origin: 'https://wallet.test' });
      self.emit({ data: rpcMessage, origin: 'https://wallet.test' });
      expect(received.length).to.equal(1);
    });

    it('ignores a message from another origin', () => {
      const { self, received } = bindReceiver({ origin: 'https://wallet.test' });
      self.emit({ data: rpcMessage, origin: 'https://evil.test' });
      expect(received).to.eql([]);
    });

    it('accepts a message from the target window', () => {
      const target = emittableWindow();
      const { self, received } = bindReceiver({ target });
      self.emit({ data: rpcMessage, source: target });
      expect(received.length).to.equal(1);
    });

    it('ignores a message from a window other than target', () => {
      const target = emittableWindow();
      const { self, received } = bindReceiver({ target });
      self.emit({ data: rpcMessage, source: emittableWindow() });
      expect(received).to.eql([]);
    });

    it('unwraps a message of the expected direction', () => {
      const { self, received } = bindReceiver({ receiveDirection: MESSAGE_DIRECTION.to_aepp });
      self.emit({ data: { type: MESSAGE_DIRECTION.to_aepp, data: rpcMessage } });
      expect(received.length).to.equal(1);
      expect(received[0][0]).to.eql(rpcMessage);
    });

    it('ignores a message of another direction', () => {
      const { self, received } = bindReceiver({ receiveDirection: MESSAGE_DIRECTION.to_aepp });
      self.emit({ data: { type: MESSAGE_DIRECTION.to_waellet, data: rpcMessage } });
      expect(received).to.eql([]);
    });
  });

  describe('sending', () => {
    it('fails to send a message without target', () => {
      const connection = new BrowserWindowMessageConnection({ self: emittableWindow() });
      expect(() => connection.sendMessage(rpcMessage)).to.throw(
        RpcConnectionError,
        "Can't send messages without target",
      );
    });

    it('sends a message to any origin by default', () => {
      const target = emittableWindow();
      const connection = new BrowserWindowMessageConnection({ self: emittableWindow(), target });
      connection.sendMessage(rpcMessage);
      expect(target.posted).to.eql([{ message: rpcMessage, targetOrigin: '*' }]);
    });

    it('sends a message to the configured origin', () => {
      const target = emittableWindow();
      const connection = new BrowserWindowMessageConnection({
        self: emittableWindow(),
        target,
        origin: 'https://wallet.test',
      });
      connection.sendMessage(rpcMessage);
      expect(target.posted).to.eql([{ message: rpcMessage, targetOrigin: 'https://wallet.test' }]);
    });

    it('wraps a message into the send direction', () => {
      const target = emittableWindow();
      const connection = new BrowserWindowMessageConnection({
        self: emittableWindow(),
        target,
        sendDirection: MESSAGE_DIRECTION.to_waellet,
      });
      connection.sendMessage(rpcMessage);
      expect(target.posted).to.eql([
        {
          message: { type: MESSAGE_DIRECTION.to_waellet, data: rpcMessage },
          targetOrigin: '*',
        },
      ]);
    });
  });

  describe('debug', () => {
    /**
     * @returns the arguments `console.log` was called with while passing a message both ways
     */
    function collectLogs(debug: boolean): unknown[][] {
      const self = emittableWindow();
      const target = emittableWindow();
      const connection = new BrowserWindowMessageConnection({ self, target, debug });
      connection.connect(
        () => {},
        () => {},
      );
      const log = stub(console, 'log');
      try {
        connection.sendMessage(rpcMessage);
        self.emit({ data: rpcMessage, source: target });
      } finally {
        log.restore();
      }
      return log.args;
    }

    it('does not log messages by default', () => {
      expect(collectLogs(false)).to.eql([]);
    });

    it('logs sent and received messages', () => {
      const logs = collectLogs(true);
      expect(logs.length).to.equal(2);
      expect(logs[0]).to.eql(['Send message:', rpcMessage]);
      expect(logs[1][0]).to.equal('Receive message:');
      expect((logs[1][1] as { data: unknown }).data).to.eql(rpcMessage);
    });
  });
});
