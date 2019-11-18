/* eslint-disable no-undef */
export const getBrowserAPI = () => {
  if (chrome && chrome.runtime) return chrome
  if (browser && browser.runtime) return browser
  throw new Error('Browser is not detected')
}

export const getWindow = () => {
  if (!window) throw new Error('Browser is not detected')
  return window
}

export const message = (method, params) => ({ method, params })

export const responseMessage = (id, method, { error, result } = {}) => ({ id, method, ...(error ? { error } : { result }) })

export const sendResponseMessage = (client) => (id, method, data) => client.sendMessage(responseMessage(id, method, data), true)

export const isInIframe = () => window !== window.parent

export const getHandler = (schema, msg) => {
  const handler = schema[msg.method]
  if (!handler || typeof handler !== 'function') {
    console.log(`Unknown message method ${msg.method}`)
    return () => () => true
  }
  return handler
}
