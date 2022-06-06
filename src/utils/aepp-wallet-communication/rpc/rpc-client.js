/**
 * RpcClient module
 *
 * @module @aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client
 * @export { RpcClient, RpcClients }
 * @example
 * import RpcClient from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client'
 */
import stampit from '@stamp/it'

import { RpcError, RpcInternalError } from '../schema'
import { InvalidRpcMessageError, MissingCallbackError } from '../../errors'

/**
 * Contain functionality for using RPC conection
 * @alias module:@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client
 * @function
 * @rtype Stamp
 * @param {Object} param Init params object
 * @param {Object} param.connection Connection object
 * @param {Function} param.onDisconnect Disconnect callback
 * @param {Object} param.methods Object containing handlers for each request by name
 * @return {Object}
 */
export default stampit({
  init ({ id, connection, onDisconnect, methods }) {
    this.id = id
    this.connection = connection
    // {
    //    [msg.id]: { resolve, reject }
    // }
    this.callbacks = {}

    this._messageId = 0

    const handleMessage = async (msg, origin) => {
      if (!msg || !msg.jsonrpc || msg.jsonrpc !== '2.0' || !msg.method) {
        throw new InvalidRpcMessageError(msg)
      }
      if ((msg.result ?? msg.error) != null) {
        this.processResponse(msg)
        return
      }

      // TODO: remove methods as far it is not required in JSON RPC
      const response = { id: msg.id, method: msg.method }
      try {
        response.result = await methods[msg.method](msg.params, origin)
      } catch (error) {
        response.error = error instanceof RpcError ? error : new RpcInternalError()
      }
      if (response.id) this._sendMessage(response, true)
    }

    connection.connect(handleMessage, onDisconnect)
  },
  methods: {
    _sendMessage ({ id, method, params, result, error }, isNotificationOrResponse = false) {
      if (!isNotificationOrResponse) this._messageId += 1
      id = isNotificationOrResponse ? (id ?? null) : this._messageId
      const msgData = params
        ? { params }
        : result
          ? { result }
          : { error }
      this.connection.sendMessage({
        jsonrpc: '2.0',
        ...id ? { id } : {},
        method,
        ...msgData
      })
      return id
    },
    /**
     * Make a request
     * @function request
     * @instance
     * @rtype (name: String, params: Object) => Promise
     * @param {String} name Method name
     * @param {Object} params Method params
     * @return {Promise} Promise which will be resolved after receiving response message
     */
    request (name, params) {
      const msgId = this._sendMessage({ method: name, params })
      return new Promise((resolve, reject) => {
        this.callbacks[msgId] = { resolve, reject }
      })
    },
    /**
     * Make a notification
     * @param {String} name Method name
     * @param {Object} params Method params
     */
    notify (name, params) {
      this._sendMessage({ method: name, params }, true)
    },
    /**
     * Process response message
     * @function processResponse
     * @instance
     * @rtype (msg: Object, transformResult: Function) => void
     * @param {Object} msg Message object
     * @return {void}
     */
    processResponse ({ id, error, result }) {
      if (!this.callbacks[id]) throw new MissingCallbackError(id)
      if (result) this.callbacks[id].resolve(result)
      else this.callbacks[id].reject(RpcError.deserialize(error))
      delete this.callbacks[id]
    }
  }
})
