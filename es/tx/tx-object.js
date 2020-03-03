import stampit from '@stamp/it'
import { assertedType } from '../utils/crypto'
import { isHex } from '../utils/string'
import { buildTx, unpackTx } from './builder'
import { TX_TYPE } from './builder/schema'

const prepareTx = (tx, type) => {
  if (!tx) throw new Error('Transaction is required!')
  // Encoded Tx or raw tx as hex
  if (typeof tx === 'string') {
    if (isHex(tx)) {
      return unpackTx(Buffer.from(tx, 'hex'))
    }
    if (assertedType(tx, 'tx', true)) {
      return unpackTx(tx)
    }
  }
  if (typeof tx === 'object') {
    if (!type || Object.prototype.hasOwnProperty.apply(TX_TYPE, type)) throw new Error(`Unknown transaction type ${type}`)
    return buildTx(tx, type)
  }
}

export const TxObject = stampit({
  init (tx, type) {
    if (!tx) throw new Error('Invalid transaction')
    const txData = prepareTx(tx, type)
    return Object.assign(this, txData)
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
