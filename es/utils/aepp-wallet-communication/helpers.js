/**
 * Browser helper functions
 */
/* eslint-disable no-undef */
export const getBrowserAPI = (force = false) => {
  if (chrome === Object(chrome) && chrome.runtime) return chrome
  if (browser === Object(browser) && browser.runtime) return browser
  if (!force) throw new Error('Browser is not detected')
  return {}
}

export const isInIframe = () => window !== window.parent

export const getWindow = () => {
  if (!window) throw new Error('Browser is not detected')
  return window
}

/**
 * RPC helper functions
 */
export const sendMessage = (connection) => {
  let messageId = 0

  return ({ id, method, params, result, error }, isNotificationOrResponse = false) => {
    // Increment id for each request
    isNotificationOrResponse || (messageId += 1)
    id = isNotificationOrResponse ? (id || null) : messageId
    const msgData = params
      ? { params }
      : result
        ? { result }
        : { error }
    connection.sendMessage({
      jsonrpc: '2.0',
      ...id ? { id } : {},
      method,
      ...msgData
    })
    return id
  }
}

export const receive = (handler) => (msg) => {
  if (!msg || !msg.jsonrpc || msg.jsonrpc !== '2.0' || !msg.method) {
    console.warn('Receive invalid message', msg)
    return
  }
  handler(msg)
}

export const getHandler = (schema, msg) => {
  const handler = schema[msg.method]
  if (!handler || typeof handler !== 'function') {
    console.log(`Unknown message method ${msg.method}`)
    return () => () => true
  }
  return handler
}

export const message = (method, params = {}) => ({ method, params })

export const responseMessage = (id, method, { error, result } = {}) => ({ id, method, ...(error ? { error } : { result }) })

export const sendResponseMessage = (client) => (id, method, data) => client.sendMessage(responseMessage(id, method, data), true)

export const voidFn = () => undefined
