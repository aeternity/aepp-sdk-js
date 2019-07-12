// Subscribe from postMessages from page
const readyStateCheckInterval = setInterval(function () {
    if (document.readyState === "complete") {
        clearInterval(readyStateCheckInterval)

        // Handle message from background and redirect to page
        chrome.runtime.onMessage.addListener(({ data }, sender) => {
            window.postMessage(data, '*')
        })
    }
}, 10)

