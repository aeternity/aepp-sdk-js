import browser from 'webextension-polyfill';
import {
  BrowserRuntimeConnection, BrowserWindowMessageConnection, MESSAGE_DIRECTION, connectionProxy,
} from '@aeternity/aepp-sdk';

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

  const port = browser.runtime.connect();
  const extConnection = new BrowserRuntimeConnection({ port });
  const pageConnection = new BrowserWindowMessageConnection({
    target: window,
    origin: window.origin,
    sendDirection: MESSAGE_DIRECTION.to_aepp,
    receiveDirection: MESSAGE_DIRECTION.to_waellet,
  });
  connectionProxy(pageConnection, extConnection);
})();
