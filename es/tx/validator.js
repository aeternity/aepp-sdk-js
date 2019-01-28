/* eslint-disable no-use-before-define */
import {
  verify,
  decodeBase58Check,
  assertedType
} from '../utils/crypto'
import EpochChain from '../chain/epoch'

import { BigNumber } from 'bignumber.js'
import {
  BASE_VERIFICATION_SCHEMA, OBJECT_ID_TX_TYPE,
  OBJECT_TAG_SIGNED_TRANSACTION,
  SIGNATURE_VERIFICATION_SCHEMA
} from './schema'
import { calculateFee, unpackTx } from './builder'

const VALIDATORS = {
  // VALIDATE SIGNATURE
  signature ({ rlpEncoded, signature, ownerPublicKey, networkId = 'ae_mainnet' }) {
    const txWithNetworkId = Buffer.concat([Buffer.from(networkId), rlpEncoded])
    return verify(txWithNetworkId, signature, decodeBase58Check(assertedType(ownerPublicKey, 'ak')))
  },
  // VALIDATE IF ENOUGH FEE
  insufficientFee ({ minFee, fee }) {
    return BigNumber(minFee).lte(BigNumber(fee))
  },
  // VALIDATE IF TTL VALID
  expiredTTL ({ ttl, height }) {
    return BigNumber(ttl).eq(0) || BigNumber(ttl).gte(BigNumber(height))
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
    return BigNumber(nonce).gt(BigNumber(accountNonce))
  },
  // IF NONCE TO HIGH
  nonceHigh ({ accountNonce, nonce }) {
    return !(BigNumber(nonce).gt(BigNumber(accountNonce).plus(1)))
  }
}

const resolveDataForBase = async (chain, { rlpEncoded, ownerPublicKey }) => {
  let accountNonce = 0
  let accountBalance = 0
  try {
    const { nonce, balance } = await chain.api.getAccountByPubkey(ownerPublicKey)
    accountNonce = nonce
    accountBalance = balance
  } catch (e) { console.log('We can not get info about this publicKey') }
  return {
    height: await chain.height(),
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

function unpackAndVerify (txHash, { networkId } = {}) {
  const { tx: unpackedTx, rlpEncoded } = unpackTx(txHash)

  if (+unpackedTx.tag === OBJECT_TAG_SIGNED_TRANSACTION) {
    const tx = unpackedTx.encodedTx.tx
    const signatures = unpackedTx.signatures
    const rlpEncodedTx = unpackedTx.encodedTx.rlpEncoded

    return this.verifyTx({ tx, signatures, rlpEncoded: rlpEncodedTx }, networkId)
  }
  return this.verifyTx({ tx: unpackedTx, rlpEncoded }, networkId)
}

const getOwnerPublicKey = (tx) =>
  tx[['senderId', 'accountId', 'ownerId', 'callerId', 'oracleId'].find(key => tx[key])].replace('ok_', 'ak_')

// Verify transaction
async function verifyTx ({ tx, signatures, rlpEncoded }, networkId) {
  networkId = networkId || this.nodeNetworkId || 'ae_mainnet'
  // Fetch data for verification
  const ownerPublicKey = getOwnerPublicKey(tx)
  const resolvedData = {
    minFee: calculateFee(0, OBJECT_ID_TX_TYPE[+tx.tag], { params: tx }),
    ...(await resolveDataForBase(this, { ownerPublicKey, rlpEncoded, tx })),
    ...tx
  }
  const signatureVerification = signatures && signatures.length
    ? verifySchema(SIGNATURE_VERIFICATION_SCHEMA, {
      rlpEncoded,
      signature: signatures[0],
      ownerPublicKey,
      networkId
    })
    : { error: {}, warning: {} }
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
const TransactionValidator = EpochChain.compose({
  methods: {
    verifyTx,
    unpackAndVerify
  }
})

export default TransactionValidator
