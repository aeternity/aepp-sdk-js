import stampit from '@stamp/it'
import * as R from 'ramda'
import { responseMessage } from '../utils/aepp-wallet-communication/helpers'


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


function addCallback (msgId, callback) {
  if (this.callbacks.hasOwnProperty(msgId)) throw new Error('Callback Already exist')
  this.callbacks[msgId] = callback
}

function sendMessage ({ id, method, params, result, error }, isNotificationOrResponse = false) {
  isNotificationOrResponse || (this.messageId += 1)
  id = isNotificationOrResponse ? (id || null) : this.messageId
  const msgData = params
    ? { params }
    : result
      ? { result }
      : { error }
  this.connection.sendMessage({
    jsonrpc: '2.0',
    ...id ? { id } : {},
    method,
    ...msgData,
  })
}

const receive = (handler, ins) => (msg) => {
  // Increment id for each request
  if (msg.id && +msg.id > ins.messageId) ins.messageId += 1
  handler(msg)
}


export const WalletClient = stampit({
  init ({ id, name, network, icons, connection, handlers: [onMessage, onDisconnect] }) {
    this.id = id
    this.connection = connection
    this.info = { name, network, icons }
    this.messageId = 0
    // {
    //    [msg.id]: { resolve, reject }
    // }
    this.callbacks = {}
    connection.connect(receive(onMessage, this), onDisconnect)
  },
  methods: {
    addCallback,
    sendMessage
  }
})
