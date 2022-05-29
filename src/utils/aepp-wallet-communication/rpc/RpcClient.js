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
import { InvalidRpcMessageError, DuplicateCallbackError, MissingCallbackError } from '../../errors'

/**
 * Contain functionality for using RPC conection
 * @alias module:@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client
 * @function
 * @rtype Stamp
 * @param {Object} param Init params object
 * @param {String} param.name Client name
 * @param {Object} param.connection Connection object
 * @param {Function} param.onDisconnect Disconnect callback
 * @param {Object} param.methods Object containing handlers for each request by name
 * @return {Object}
 */
export default stampit({
  init ({ connection, onDisconnect, methods }) {
    this.connection = connection
    this._callbacks = {}
    this._messageId = 0
    this._methods = methods
    connection.connect(this._handleMessage.bind(this), onDisconnect)
  },
  methods: {
    async _handleMessage (msg, origin) {
      if (msg?.jsonrpc !== '2.0') throw new InvalidRpcMessageError(msg)
      if ((msg.result ?? msg.error) != null) {
        this._processResponse(msg)
        return
      }

      // TODO: remove methods as far it is not required in JSON RPC
      const response = { id: msg.id, method: msg.method }
      try {
        response.result = await this._methods[msg.method](msg.params, origin)
      } catch (error) {
        response.error = error instanceof RpcError ? error : new RpcInternalError()
      }
      if (response.id) this._sendMessage(response, true)
    },
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
      if (this._callbacks[msgId] != null) {
        throw new DuplicateCallbackError()
      }
      return new Promise((resolve, reject) => {
        this._callbacks[msgId] = { resolve, reject }
      })
    },
    /**
     * Make a notification
     * @function request
     * @instance
     * @rtype (name: String, params: Object) => Promise
     * @param {String} name Method name
     * @param {Object} params Method params
     * @return {Promise} Promise which will be resolved after receiving response message
     */
    notify (name, params) {
      this.sendMessage({ method: name, params }, true)
    },
    /**
     * Process response message
     * @function processResponse
     * @instance
     * @rtype (msg: Object, transformResult: Function) => void
     * @param {Object} msg Message object
     * @return {void}
     */
    _processResponse ({ id, error, result }) {
      if (!this._callbacks[id]) throw new MissingCallbackError(id)
      if (result) this._callbacks[id].resolve(result)
      else this._callbacks[id].reject(RpcError.deserialize(error))
      delete this._callbacks[id]
    }
  }
})
