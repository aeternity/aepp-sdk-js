import stampit from '@stamp/it'
import { SUBSCRIPTION_TYPES } from '../schema'

export const WalletClients = stampit({
  init () {
    this.clients = new Map()
  },
  methods: {
    hasClient ({ id }) {
      return this.clients.has(id)
    },
    addClient (id, client) {
      if (this.hasClient(id)) throw new Error('Client already exist')
      this.clients.set(id, WalletClient({ ...client, id }))
    },
    getClient (id) {
      return this.clients.get(id)
    },
    updateClientInfo (id, info) {
      const client = this.getClient(id)
      client.info = { ...client.info, ...info }
      this.clients.set(id, client)
    }
  }
})

function addCallback (msgId) {
  if (this.callbacks.hasOwnProperty(msgId)) throw new Error('Callback Already exist')
  return new Promise((resolve, reject) => {
    this.callbacks[msgId] = { resolve, reject }
  })
}

function addAction (action, [accept, deny]) {
  if (this.callbacks.hasOwnProperty(action.id)) throw new Error('Action for this request already exist')
  this.actions[action.id] = { ...action, accept, deny }
  return this.actions[action.id]
}

function resolveCallback (msgId, args = []) {
  if (!this.callbacks[msgId]) throw new Error(`Can't find callback for this messageId ${msgId}`)
  this.callbacks[msgId].resolve(...args)
}

function rejectCallback (msgId, args = []) {
  if (!this.callbacks[msgId]) throw new Error(`Can't find callback for this messageId ${msgId}`)
  return this.callbacks[msgId].reject(...args)
}

const sendMessage = (messageId, connection) => ({ id, method, params, result, error }, isNotificationOrResponse = false) => {
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

const receive = (handler, msgId) => (msg) => {
  // Increment id for each request
  if (msg.id && +msg.id > msgId) msgId += 1
  handler(msg)
}

export const WalletClient = stampit({
  init ({ id, name, network, icons, connection, handlers: [onMessage, onDisconnect] }) {
    let messageId = 0
    this.id = id
    this.connection = connection
    this.info = { name, network, icons }
    // {
    //    [msg.id]: { resolve, reject }
    // }
    this.callbacks = {}
    this.actions = {}
    this.addressSubscription = []
    this.sendMessage = sendMessage(messageId, this.connection)

    connection.connect(receive(onMessage, messageId), onDisconnect)
  },
  methods: {
    updateSubscription (type, value) {
      if (type === SUBSCRIPTION_TYPES.subscribe && !this.addressSubscription.includes(value)) {
        this.addressSubscription.push(value)
      }
      if (type === SUBSCRIPTION_TYPES.unsubscribe && this.addressSubscription.includes(value)) {
        this.addressSubscription = this.addressSubscription.filter(s => s !== value)
      }
    },
    addAction,
    addCallback,
    resolveCallback,
    rejectCallback
  }
})
