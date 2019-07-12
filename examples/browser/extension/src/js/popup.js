import "../css/popup.css"

function sendToBackground(method, params) {
    chrome.runtime.sendMessage({
        jsonrpc: "2.0",
        id: null,
        method,
        params
    })
}

// Render
function render(data) {
    // @TODO create list with sdks and his transaction with ability to accept/decline signing
}

function clickSign({target, value}) {
    const [sdkId, tx] = target.id.split['-'];
    signResponse({value, sdkId, tx})
}

function signResponse({value, sdkId, tx}) {
    sendToBackground('txSign', {value, sdkId, tx})
}
