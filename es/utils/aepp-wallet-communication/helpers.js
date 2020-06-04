/**
 * Browser helper functions
 */
/* eslint-disable no-undef */
import { isMemoryAccount } from '../../account/selector'

const isWeb = () => location && location.protocol && location.protocol.startsWith('http')

export const getBrowserAPI = (force = false) => {
  // Chrome, Opera support
  if (typeof chrome !== 'undefined' && chrome === Object(chrome)) return chrome
  // Firefox support
  if (typeof browser !== 'undefined' && browser === Object(browser)) return browser
  if (!force) throw new Error('Browser is not detected')
  return {}
}

const isExtensionContext = () => {
  const browser = getBrowserAPI(true)
  return typeof browser === 'object' && browser && typeof browser.extension === 'object'
}

export const isContentScript = () => isExtensionContext() && isWeb()

export const isInIframe = () => window !== window.parent

export const getWindow = (force = false) => {
  if (!window && !force) throw new Error('Browser is not detected')
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

export const receive = (handler) => (msg, origin) => {
  if (!msg || !msg.jsonrpc || msg.jsonrpc !== '2.0' || !msg.method) {
    console.warn('Receive invalid message', msg)
    return
  }
  handler(msg, origin)
}

export const getHandler = (schema, msg, { debug = false } = {}) => {
  const handler = schema[msg.method]
  if (!handler || typeof handler !== 'function') {
    debug && console.log(`Unknown message method ${msg.method}`)
    return () => () => true
  }
  return handler
}

export const message = (method, params = {}) => ({ method, params })

export const responseMessage = (id, method, { error, result } = {}) => ({ id, method, ...(error ? { error } : { result }) })

export const sendResponseMessage = (client) => (id, method, data) => client.sendMessage(responseMessage(id, method, data), true)

export const voidFn = () => undefined

export const isValidAccounts = (accounts) => (['', 'connected', 'current'].filter(k => typeof (k ? accounts[k] : accounts) === 'object')).length === 3

export const resolveOnAccount = (addresses, onAccount, opt = {}) => {
  if (!addresses.find(a => a === onAccount)) {
    if (typeof opt.onAccount !== 'object' || !isMemoryAccount(opt.onAccount)) throw new Error('Provided onAccount should be a MemoryAccount')
    onAccount = opt.onAccount
  }
  return onAccount
}
