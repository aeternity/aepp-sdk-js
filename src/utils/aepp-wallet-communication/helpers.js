/**
 * Browser helper functions
 */
import { isAccountBase } from '../../account/base'

export const getBrowserAPI = (force = false) => {
  const { chrome, browser } = window
  // Chrome, Opera support
  if (typeof chrome !== 'undefined' && chrome === Object(chrome)) return chrome
  // Firefox support
  if (typeof browser !== 'undefined' && browser === Object(browser)) return browser
  if (!force) throw new Error('Browser is not detected')
  return {}
}

export const isInIframe = () => window !== window.parent

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

export const getHandler = (schema, msg, { debug = false } = {}) => {
  const handler = schema[msg.method]
  if (!handler || typeof handler !== 'function') {
    debug && console.log(`Unknown message method ${msg.method}`)
    return () => async () => true
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
    if (typeof opt.onAccount !== 'object' || !isAccountBase(opt.onAccount)) throw new Error('Provided onAccount should be an AccountBase')
    onAccount = opt.onAccount
  }
  return onAccount
}
