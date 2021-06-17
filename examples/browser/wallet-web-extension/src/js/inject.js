import {
  BrowserRuntimeConnection, BrowserWindowMessageConnection, AeppWalletSchema,
  ContentScriptBridge, AeppWalletHelpers
} from 'AE_SDK_MODULES'

const readyStateCheckInterval = setInterval(function () {
  if (document.readyState === 'complete') {
    clearInterval(readyStateCheckInterval)

    const port = AeppWalletHelpers.getBrowserAPI().runtime.connect()
    const extConnection = BrowserRuntimeConnection({
      connectionInfo: {
        description: 'Content Script to Extension connection',
        origin: window.origin
      },
      port
    })
    const pageConnection = BrowserWindowMessageConnection({
      connectionInfo: {
        description: 'Content Script to Page  connection',
        origin: window.origin
      },
      origin: window.origin,
      sendDirection: AeppWalletSchema.MESSAGE_DIRECTION.to_aepp,
      receiveDirection: AeppWalletSchema.MESSAGE_DIRECTION.to_waellet
    })

    const bridge = ContentScriptBridge({ pageConnection, extConnection })
    bridge.run()
  }
}, 10)
