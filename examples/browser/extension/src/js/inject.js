const readyStateCheckInterval = setInterval(function () {
  if (document.readyState === "complete") {
    clearInterval(readyStateCheckInterval)

    const port = chrome.runtime.connect()
    port.onMessage.addListener(function (msg) {
      window.postMessage(msg, '*')
    })

    window.addEventListener('message', function (event) {
      // We only accept messages from ourselves
      // if (["connection.announcePresence"].includes(event.data.method)) return
      if (event.data.result || event.data.error) return
      if (event.source !== window) return
      port.postMessage(event.data)

      // Todo Think about how to exclude messages from ourself without changing message structure (page <-> content)
      // if (event.data.type && (event.data.type == "FROM_PAGE")) {
      //   console.log("Content script received: " + event.data.text);
      // }
    }, false)
  }
}, 10)

