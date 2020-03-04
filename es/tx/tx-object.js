import stampit from '@stamp/it'
import { assertedType } from '../utils/crypto'
import { buildTx, unpackTx } from './builder'
import { TX_TYPE } from './builder/schema'
import { encode } from './builder/helpers'

const buildTransaction = (type, params, options = {}) => {
  if (typeof params !== 'object') throw new Error('"params" should be an object')
  if (typeof type !== 'string' || !Object.values(TX_TYPE).includes(type)) throw new Error(`Unknown transaction type ${type}`)
  const { rlpEncoded, binary, tx: encodedTx, txObject } = buildTx(params, type, options)
  return { rlpEncoded, binary, encodedTx, params: txObject, type }
}

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

export const TxObject = stampit({
  init ({ tx, params, type, options = {} } = {}) {
    if (params && type) return Object.assign(this, buildTransaction(type, params, options))
    if (tx) return Object.assign(this, unpackTransaction(tx))
    throw new Error('Invalid TxObject arguments. Please provide one of { tx: "tx_asdasd23..." } or { type: "spendTx", params: {...} }')
  },
  statics: {
    fromString: (tx) => TxObject({ tx }),
    fromRlp: (tx) => TxObject({ tx })
  },
  methods: {
    recalculateFee: () => true,
    setProp: (props = {}) => true,
    validate: () => true,
    type: () => this.type,
    getSignature: () => true,
    addSignature: () => true
  }
})

export default TxObject
