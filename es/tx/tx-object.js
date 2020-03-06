/**
 * TxObject module
 * @module @aeternity/aepp-sdk/es/tx/tx-object
 * @export TxObject
 * @example import TxObject from '@aeternity/aepp-sdk/es/tx/tx-object'
 */
import stampit from '@stamp/it'
import { assertedType } from '../utils/crypto'
import { buildTx, calculateFee, unpackTx } from './builder'
import { TX_TYPE } from './builder/schema'
import { encode } from './builder/helpers'

/**
 * Build transaction from object
 * @alias module:@aeternity/aepp-sdk/es/tx/tx-object
 * @param {String} type Transaction type
 * @param {Object} params Transaction params
 * @param {Object} [options={}] Options
 * @throws {Error} Arguments validation error's
 * @return {{ encodedTx: String, binary: Array<Buffer>, rlpEncoded: Buffer, params: Object, type: String }}
 */
const buildTransaction = (type, params, options = {}) => {
  if (typeof params !== 'object') throw new Error('"params" should be an object')
  if (typeof type !== 'string' || !Object.values(TX_TYPE).includes(type)) throw new Error(`Unknown transaction type ${type}`)
  const fee = this.calculateFee(params)
  const { rlpEncoded, binary, tx: encodedTx, txObject } = buildTx({ ...params, fee }, type, options)
  return { rlpEncoded, binary, encodedTx, params: txObject, type }
}

/**
 * Unpack transaction from RLP encoded binary or base64c string
 * @alias module:@aeternity/aepp-sdk/es/tx/tx-object
 * @param {Buffer|String} tx RLP encoded binary or base64c(rlpBinary) string
 * @throws {Error} Arguments validation error's
 * @return {{ encodedTx: String, binary: Array<Buffer>, rlpEncoded: Buffer, type: String, params: Object }}
 */
const unpackTransaction = (tx) => {
  if (!tx) throw new Error(`Invalid transaction: ${tx}`)
  if (typeof tx === 'string') {
    if (!assertedType(tx, 'tx', true)) throw new Error('Invalid transaction string. Tx should be `tx` prefixed base58c string')
    const { txType: type, tx: params, rlpEncoded, binary } = unpackTx(tx)
    return { encodedTx: tx, type, params, rlpEncoded, binary }
  }
  if (Buffer.isBuffer(tx)) {
    const { txType: type, tx: params, rlpEncoded, binary } = unpackTx(tx, true)
    return { encodedTx: encode(tx, 'tx'), type, params, rlpEncoded, binary }
  }
}

/**
 * Helper which build or unpack transaction base on constructor arguments
 * Need to provide one of arguments: [tx] -> unpack flow or [params, type] -> build flow
 * @alias module:@aeternity/aepp-sdk/es/tx/tx-object
 * @param {Buffer|String} [tx] Transaction rlp binary or vase64c string
 * @param {Object} params Transaction params
 * @param {String} type Transaction type
 * @param {Object} [options={}] Options
 * @throws {Error} Arguments validation error's
 * @return {{encodedTx: String, binary: Array<Buffer>, rlpEncoded: Buffer, type: String, params: Object}}
 */
const initTransaction = ({ tx, params, type, options = {} } = {}) => {
  if (params && type) return buildTransaction(type, params, options)
  if (tx) return unpackTransaction(tx)
  throw new Error('Invalid TxObject arguments. Please provide one of { tx: "tx_asdasd23..." } or { type: "spendTx", params: {...} }')
}

/**
 * Transaction Validator Stamp
 * This stamp give us possibility to unpack and validate some of transaction properties,
 * to make sure we can post it to the chain
 * @function
 * @alias module:@aeternity/aepp-sdk/es/tx/tx-object
 * @rtype Stamp
 * @param {Object} [options={}] - Initializer object
 * @param {Buffer|String} [options.tx] - Rlp binary or base64c transaction
 * @param {Object} [options.params] - Transaction params
 * @param {String} [options.type] - Transaction type
 * @param {Object} [options.options] - Build options
 * @return {Object} TxObject instance
 * @example TxObject({ params: {...}, type: 'spendTx' })
 */
export const TxObject = stampit({
  init ({ tx, params, type, options = {} } = {}) {
    this.options = options
    Object.assign(this, initTransaction({ tx, params, type, options }))

    if (this.type === TX_TYPE.signed) {
      const { signatures, encodedTx: { txType, tx } } = this.params
      this.signatures = signatures
      this.params = tx
      this.type = txType
      this.isSigned = true
    }
  },
  statics: {
    /**
     * Create txObject from base64c RLP encoded transaction string with 'tx_' prefix
     * @alias module:@aeternity/aepp-sdk/es/tx/tx-object
     * @static
     * @param {String} tx Transaction string (tx_23fsdgsdfg...)
     * @return {TxObject}
     */
    fromString: (tx) => TxObject({ tx }),
    /**
     * Create txObject from transaction RLP binary
     * @alias module:@aeternity/aepp-sdk/es/tx/tx-object
     * @static
     * @param {Buffer} tx Transaction RLP binary
     * @return {TxObject}
     */
    fromRlp: (tx) => TxObject({ tx })
  },
  methods: {
    /**
     * Rebuild transaction with new params and recalculate fee
     * @alias module:@aeternity/aepp-sdk/es/tx/tx-object
     * @param {Object} props Transaction properties for update
     * @return {TxObject}
     */
    setProp (props = {}) {
      if (typeof props !== 'object') throw new Error('Props should be an object')
      this.isSigned = false
      this.signatures = []
      const fee = this.calculateFee(props)

      Object.assign(this, buildTransaction(this.type, { ...this.props, ...props, fee }, this.options))
      return this
    },
    /**
     * Get signatures
     * @alias module:@aeternity/aepp-sdk/es/tx/tx-object
     * @return {Array} Array of signatures
     */
    getSignatures () {
      if (!this.isSigned) throw new Error('Signature not found, transaction is not signed')
      return this.signatures
    },
    /**
     * Add signature
     * @alias module:@aeternity/aepp-sdk/es/tx/tx-object
     * @param {Buffer} signature Signature to add
     * @return {void}
     */
    addSignature (signature) {
      if (!this.isSigned) throw new Error('Signature not found, transaction is not signed')
      if (!Buffer.isBuffer(signature)) throw new Error('Invalid signature, signature must be of type Buffer')
      Object.assign(this, buildTransaction(TX_TYPE.signed, { encodedTx: this.rlpEncoded, signatures: [[...this.signatures, signature]] }))

      const { signatures, encodedTx: { txType, tx } } = this.params
      this.signatures = signatures
      this.params = tx
      this.type = txType
      this.isSigned = true
    },
    /**
     * Calculate fee
     * @alias module:@aeternity/aepp-sdk/es/tx/tx-object
     * @param {Object} props
     * @return {String} fee
     */
    calculateFee (props = {}) {
      const params = { ...this.params, ...props }
      return calculateFee(params.fee, this.type, { gas: params.gas, params, vsn: params.vsn })
    }
  }
})

export default TxObject
