/* global browser */

import {
  BrowserRuntimeConnection, BrowserWindowMessageConnection, MESSAGE_DIRECTION, connectionProxy,
} from '@aeternity/aepp-sdk';
import Browser from 'webextension-polyfill';

(async () => {
  console.log('Waiting until document is ready');
  await new Promise((resolve) => {
    const interval = setInterval(() => {
      // TODO: ensure that there is no corresponding event
      if (document.readyState !== 'complete') return;
      clearInterval(interval);
      resolve();
    }, 100);
  });
  console.log('Document is ready');

  const extConnection = new BrowserRuntimeConnection({ setPort: () => Browser.runtime.connect() });
  const pageConnection = new BrowserWindowMessageConnection({
    target: window,
    origin: window.origin,
    sendDirection: MESSAGE_DIRECTION.to_aepp,
    receiveDirection: MESSAGE_DIRECTION.to_waellet,
  });
  connectionProxy(pageConnection, extConnection);
})();
