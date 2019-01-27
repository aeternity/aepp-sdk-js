/* eslint-disable no-use-before-define */
import {
  verify,
  decodeBase58Check,
  assertedType
} from '../utils/crypto'
import Epoch from '../epoch'

import { BigNumber } from 'bignumber.js'
import { BASE_VERIFICATION_SCHEMA, SIGNATURE_VERIFICATION_SCHEMA } from './schema'

const VALIDATORS = {
  // VALIDATE SIGNATURE
  signature ({ encodedTx, signature, ownerPublicKey, networkId = 'ae_mainnet' }) {
    const txWithNetworkId = Buffer.concat([Buffer.from(networkId), encodedTx])
    return verify(txWithNetworkId, signature, decodeBase58Check(assertedType(ownerPublicKey, 'ak')))
  },
  // VALIDATE IF ENOUGH FEE
  insufficientFee ({ minFee, fee }) {
    return minFee <= +fee
  },
  // VALIDATE IF TTL VALID
  expiredTTL ({ ttl, height }) {
    return +ttl === 0 || ttl >= height
  },
  // Insufficient Balance for Amount plus Fee
  insufficientBalanceForAmountFee ({ balance, amount, fee }) {
    return BigNumber(balance).gt(BigNumber(amount).plus(fee))
  },
  // Insufficient Balance for Amount
  insufficientBalanceForAmount ({ balance, amount }) {
    return BigNumber(balance).gt(BigNumber(amount))
  },
  // IF NONCE USED
  nonceUsed ({ accountNonce, nonce }) {
    return BigNumber(nonce).gt(BigNumber(nonce))
  },
  // IF NONCE TO HIGH
  nonceHigh ({ accountNonce, nonce }) {
    return !(BigNumber(nonce).gt(BigNumber(accountNonce).plus(1)))
  }
}

const resolveDataForBase = async (nodeApi, { encodedTx, ownerPublicKey }) => {
  let accountNonce = 0
  let accountBalance = 0
  try {
    const { nonce, balance } = await nodeApi.getAccountByPubkey(ownerPublicKey)
    accountNonce = nonce
    accountBalance = balance
  } catch (e) {}
  return {
    minFee: 1500 + 20 * (encodedTx.length - 2),
    height: await nodeApi.height(),
    balance: accountBalance,
    accountNonce,
    ownerPublicKey
  }
}

// Verification using SCHEMA
const verifySchema = (schema, data) => {
  // Verify through schema
  return schema.reduce(
    (acc, [msg, validatorKey, { key, type }]) => {
      if (!VALIDATORS[validatorKey](data)) acc[type][key] = msg(data)
      return acc
    },
    { error: {}, warning: {} }
  )
}

// TODO FINISH THIS
// async function customVerification(nodeApi, { tx, resolvedBaseData }) {
//    const [schema, resolver] = CUSTOM_VERIFICATION_SCHEMA[+tx.tag]
//
//    const resolvedCustomData = await resolver(nodeApi, { ...tx, ...resolvedBaseData })
//    return verifySchema(schema, { ...tx, ...resolvedBaseData, ...resolvedCustomData})
// }

// Verify transaction
async function verifyTx ({ tx, signature, encodedTx }, networkId) {
  // Fetch data for verification
  const ownerPublicKey = tx.senderId // TODO prepare fn for getting publicKey for each of transaction type's
  const resolvedData = { ...(await resolveDataForBase(this.api, { ownerPublicKey, encodedTx, tx })), ...tx }

  const signatureVerification = verifySchema(SIGNATURE_VERIFICATION_SCHEMA, {
    encodedTx,
    signature: signature[0],
    ownerPublicKey,
    networkId
  })
  const baseVerification = verifySchema(BASE_VERIFICATION_SCHEMA, resolvedData)
  // const customVerification = customVerification(this.api, { tx, resolvedBaseData })

  return {
    error: {
      ...baseVerification.error,
      ...signatureVerification.error
      // ...customVerification.error
    },
    warning: {
      ...baseVerification.warning
      // ...customVerification.warning
    }
  }
}

/**
 * Transaction Validator Stamp
 */
const TransactionValidator = Epoch.compose({
  methods: {
    verifyTx
  }
})

export default TransactionValidator
