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
const unpackTransaction = (tx, options) => {
  if (!tx) throw new Error(`Invalid transaction: ${tx}`)
  if (typeof tx === 'string') {
    if (isHex(tx)) return unpackTx(Buffer.from(tx, 'hex'))
    if (!assertedType(tx, 'tx', true)) throw new Error('Invalid transaction string. Tx should be `ak` prefixed base58c string')
    return unpackTx(isHex(tx) ? Buffer.from(tx, 'hex') : tx, isHex(tx))
  }
}

export const TxObject = stampit({
  init ({ tx, params, type }) {
    if (params && type) return Object.assign(this, buildTransaction(params, type))
    if (tx) return Object.assign(this, unpackTransaction(tx))
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
