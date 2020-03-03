import stampit from '@stamp/it'
import { assertedType } from '../utils/crypto'
import { isHex } from '../utils/string'
import { buildTx, unpackTx } from './builder'
import { TX_TYPE } from './builder/schema'

const buildTransaction = (type, params, options = {}) => {
  if (typeof params !== 'object') throw new Error('"params" should be an object')
  if (typeof type !== 'string' || !Object.values(TX_TYPE).includes(type)) throw new Error(`Unknown transaction type ${type}`)
  return buildTx(params, type, options)
}

const unpackTransaction = (tx) => {
  if (!tx) throw new Error(`Invalid transaction: ${tx}`)
  if (typeof tx === 'string') {
    if (!assertedType(tx, 'tx', true)) throw new Error('Invalid transaction string. Tx should be `tx` prefixed base58c string')
    return unpackTx(isHex(tx) ? Buffer.from(tx, 'hex') : tx, isHex(tx))
  }
}

export const TxObject = stampit({
  init ({ tx, params, type }) {
    if (params && type) return Object.assign(this, buildTransaction(type, params))
    if (tx) return Object.assign(this, unpackTransaction(tx))
    throw new Error('Invalid TxObject arguments. Please provide one of { tx: "tx_asdasd23..." } or { type: "spendTx", params: {...} }')
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
