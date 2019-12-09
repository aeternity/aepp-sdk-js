const readyStateCheckInterval = setInterval(function () {
  if (document.readyState === "complete") {
    clearInterval(readyStateCheckInterval)

    const port = chrome.runtime.connect()
    port.onMessage.addListener(function (msg) {
      window.postMessage({ type: 'to_aepp', data: msg }, window.origin)
    })

    window.addEventListener('message', function (event) {
      // We only accept messages from AEPP and exclude from our self
      if (event.source !== window) return
      if (event.data.type !== 'to_wallet') return
      port.postMessage(event.data.data)
    }, false)
  }
}, 10)
