/* global browser */

import {
  BrowserRuntimeConnection, BrowserWindowMessageConnection, AeppWalletSchema, ContentScriptBridge
} from '@aeternity/aepp-sdk'

(async () => {
  console.log('Waiting until document is ready')
  await new Promise((resolve) => {
    const interval = setInterval(() => {
      // TODO: ensure that there is no corresponding event
      if (document.readyState !== 'complete') return
      clearInterval(interval)
      resolve()
    }, 100)
  })
  console.log('Document is ready')

  const port = browser.runtime.connect()
  const extConnection = BrowserRuntimeConnection({
    connectionInfo: {
      description: 'Content Script to Extension connection',
      origin: window.origin
    },
    port
  })
  const pageConnection = BrowserWindowMessageConnection({
    connectionInfo: {
      description: 'Content Script to Page connection',
      origin: window.origin
    },
    origin: window.origin,
    sendDirection: AeppWalletSchema.MESSAGE_DIRECTION.to_aepp,
    receiveDirection: AeppWalletSchema.MESSAGE_DIRECTION.to_waellet
  })

  const bridge = ContentScriptBridge({ pageConnection, extConnection })
  bridge.run()
})()
