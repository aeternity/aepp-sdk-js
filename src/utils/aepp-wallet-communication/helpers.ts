/**
 * Browser helper functions
 */
import { NoBrowserFoundError } from '../errors'
import RpcClient, { Connection, Message, Accounts, MessageError } from './rpc/rpc-client'

interface Browser {
  extension?: any
  runtime?: any
  chrome?: boolean
  firefox?: boolean
}

export const getBrowserAPI = (force = false): Browser => {
  const { chrome, browser } = window
  // Chrome, Opera support
  if (typeof chrome !== 'undefined' && chrome === Object(chrome)) return chrome
  // Firefox support
  if (typeof browser !== 'undefined' && browser === Object(browser)) return browser
  if (!force) throw new NoBrowserFoundError()
  return {}
}

export const isInIframe = (): boolean => window !== window.parent

type SendMessage = (
  { id, method, params, result, error }: Message, isNotificationOrResponse?: boolean) => number

/**
 * RPC helper functions
 */
export const sendMessage = (connection: Connection): SendMessage => {
  let messageId = 0

  return ({
    id,
    method,
    params,
    result,
    error
  }: Message, isNotificationOrResponse: boolean = false): number => {
    // Increment id for each request
    isNotificationOrResponse || (messageId += 1)
    id = isNotificationOrResponse ? (id ?? null) : messageId
    const msgData = params != null
      ? { params }
      : result != null
        ? { result }
        : { error }
    connection.sendMessage({
      jsonrpc: '2.0',
      ...id != null ? { id } : {},
      method,
      ...msgData
    })
    return id
  }
}

export const getHandler = (
  schema: {[key: string]: Function},
  msg: Message,
  { debug = false } = {}): Function => {
  const handler = schema[msg.method]
  if (handler == null || typeof handler !== 'function') {
    debug && console.log(`Unknown message method ${msg.method}`)
    return () => async () => true
  }
  return handler
}

export const message = (method: string, params: object = {}): {
  method: string
  params: object
} => ({ method, params })

export const responseMessage = (id: number,
  method: string,
  { error, result }: { error?: MessageError, result?: any} = {}): Partial<Message> =>
  ({ id, method, ...(error != null ? { error } : { result }) })

export const sendResponseMessage = (client: RpcClient) => (id: number, method: string, data: any) =>
  client.sendMessage(responseMessage(id, method, data), true)

export const isValidAccounts = (accounts: Accounts): accounts is Required<Accounts> => {
  return typeof accounts === 'object' &&
    accounts.connected != null &&
    accounts.current != null
}
