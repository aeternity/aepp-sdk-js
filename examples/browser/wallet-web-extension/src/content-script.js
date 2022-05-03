import {
  BrowserRuntimeConnection, BrowserWindowMessageConnection, MESSAGE_DIRECTION, ContentScriptBridge
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

  const extConnection = BrowserRuntimeConnection({
    connectionInfo: {
      description: 'Content Script to Extension connection',
      origin: window.origin
    }
  })
  const pageConnection = BrowserWindowMessageConnection({
    connectionInfo: {
      description: 'Content Script to Page connection',
      origin: window.origin
    },
    origin: window.origin,
    sendDirection: MESSAGE_DIRECTION.to_aepp,
    receiveDirection: MESSAGE_DIRECTION.to_waellet
  })

  const bridge = ContentScriptBridge({ pageConnection, extConnection })
  bridge.run()
})()
