import {
  verify,
  decodeBase58Check,
  assertedType
} from '../utils/crypto'
import Epoch from '../epoch'

import { BigNumber } from 'bignumber.js'

async function verifyTx ({ txObject, signature, encodedTx }) {
  return signature
    ? {
      ErrSignatureVerfication: validateSignature(encodedTx, signature[0], txObject.senderId),
      ...(await validateBase(txObject, encodedTx))
    }
    : validateBase(txObject, encodedTx)
}

// -------------------

// Verify signature
function validateSignature (data, sig, pub, networkId = 'ae_mainnet') {
  const txWithNetworkId = Buffer.concat([Buffer.from(networkId), data])
  return verify(txWithNetworkId, sig, decodeBase58Check(assertedType(pub, 'ak')))
}

async function validateBase (txObject, encodedTx) {
  const { ttl, nonce, amount, fee, senderId: accountId } = txObject

  const minFee = 15000 + 20 * (encodedTx.length - 2) // -2 is 2 bytes for 20000 fee
  const height = await this.height()
  const balance = await this.balance(accountId, { format: false })
  const { nonce: accountNonce } = await this.api.getAccountByPubkey(accountId)

  return {
    ErrInsufficientFee: minFee <= +fee ? true : fee,
    ErrExpiredTTL: +ttl !== 0 ? (height < +ttl ? true : height) : true,
    ErrInsufficientBalanceForAmountFee: BigNumber(balance).gt(BigNumber(amount).plus(+fee)) ? true : balance,
    ErrInsufficientBalanceForAmount: BigNumber(balance).gt(BigNumber(amount)) ? true : balance,
    ErrNonceUsed: +accountNonce <= (+nonce) ? true : (+accountNonce + 1),
    WarnNonceHigh: +nonce > (+accountNonce + 1) ? (+accountNonce + 1) : true
  }
}

/**
 * Transaction Validator Stamp
 */
const TransactionValidator = Epoch.compose({
  methods: {
    verifyTx,
    validateSignature
  }
})

export default TransactionValidator
