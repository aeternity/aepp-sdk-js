import stampit from '@stamp/it'
import * as R from 'ramda'


export const WalletClients = stampit({
  init () {
    this.clients = new Map()
  },
  methods: {
    hasClient ({ id }) {
      return this.clients.has(id)
    },
    addClient (client) {
      if (this.hasClient(client.id)) throw new Error('Client already exist')
      this.clients.set(client.id, WalletClient(client))
    },
    getClient (id) {
      return this.clients.get(id)
    }
  }
})


const addCallback = (msgId, callback) => {
  if (this.callbacks.hasOwnProperty(msgId)) throw new Error('Callback Already exist')
  this.callbacks[msgId] = callback
}

const sendMessage = ({ id, method, params }, isNotificationOrResponse = false) => {
  isNotificationOrResponse || (this.messageId += 1)
  id = R.ifElse(isNotificationOrResponse, id || null, this.messageId)

  this.connection.sendMessage({
    jsonrpc: '2.0',
    ...R.ifElse(id, { id }, {}),
    method,
    params,
  })
}


export const WalletClient = stampit({
  init ({ id, name, network, icons, connection }) {
    this.id = id
    this.name = name
    this.network = network
    this.icons = icons
    this.connection = connection
    this.messageId = 0
    // {
    //    [msg.id]: { resolve, reject }
    // }
    this.callbacks = {}
  },
  methods: {
    addCallback,
    sendMessage
  }
})
