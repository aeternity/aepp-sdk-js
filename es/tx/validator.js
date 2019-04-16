import {
  verify,
  decodeBase58Check,
  assertedType
} from '../utils/crypto'
import { encode } from '../tx/builder/helpers'

import { BigNumber } from 'bignumber.js'
import {
  BASE_VERIFICATION_SCHEMA, MIN_GAS_PRICE, OBJECT_ID_TX_TYPE,
  OBJECT_TAG_SIGNED_TRANSACTION,
  SIGNATURE_VERIFICATION_SCHEMA
} from './builder/schema'
import { calculateFee, unpackTx } from './builder'
import Node from '../node'

/**
 * Transaction validator
 * @module @aeternity/aepp-sdk/es/tx/validator
 * @export TransactionValidator
 * @example import TransactionValidator from '@aeternity/aepp-sdk/es/tx/validator'
 */

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
  insufficientBalanceForAmountFee ({ balance, amount = 0, fee }) {
    return BigNumber(balance).gt(BigNumber(amount).plus(fee))
  },
  // Insufficient Balance for Amount
  insufficientBalanceForAmount ({ balance, amount = 0 }) {
    return BigNumber(balance).gt(BigNumber(amount))
  },
  // IF NONCE USED
  nonceUsed ({ accountNonce, nonce }) {
    return BigNumber(nonce).gt(BigNumber(accountNonce))
  },
  // IF NONCE TO HIGH
  nonceHigh ({ accountNonce, nonce }) {
    return !(BigNumber(nonce).gt(BigNumber(accountNonce).plus(1)))
  },
  minGasPrice ({ gasPrice }) {
    return isNaN(gasPrice) || BigNumber(gasPrice).gte(BigNumber(MIN_GAS_PRICE))
  }
}

const resolveDataForBase = async (chain, { ownerPublicKey }) => {
  let accountNonce = 0
  let accountBalance = 0
  try {
    const { nonce, balance } = await chain.api.getAccountByPubkey(ownerPublicKey)
    accountNonce = nonce
    accountBalance = balance
  } catch (e) { console.log('We can not get info about this publicKey') }
  return {
    height: (await chain.api.getCurrentKeyBlockHeight()).height,
    balance: accountBalance,
    accountNonce,
    ownerPublicKey
  }
}

// Verification using SCHEMA
const verifySchema = (schema, data) => {
  // Verify through schema
  return schema.reduce(
    (acc, [msg, validatorKey, { key, type, txKey }]) => {
      if (!VALIDATORS[validatorKey](data)) acc.push({ msg: msg(data), txKey, type })
      return acc
    },
    []
  )
}

// TODO FINISH THIS
// async function customVerification(nodeApi, { tx, resolvedBaseData }) {
//    const [schema, resolver] = CUSTOM_VERIFICATION_SCHEMA[+tx.tag]
//
//    const resolvedCustomData = await resolver(nodeApi, { ...tx, ...resolvedBaseData })
//    return verifySchema(schema, { ...tx, ...resolvedBaseData, ...resolvedCustomData})
// }

/**
 * Unpack and verify transaction (verify nonce, ttl, fee, signature, account balance)
 * @function
 * @alias module:@aeternity/aepp-sdk/es/tx/validator
 *
 * @param {String} txHash Base64Check transaction hash
 * @param {Object} [options={}] Options
 * @param {String} [options.networkId] networkId Use in signature verification
 * @return {Promise<Object>} Object with verification errors and warnings
 */
async function unpackAndVerify (txHash, { networkId } = {}) {
  const { tx: unpackedTx, rlpEncoded, txType } = unpackTx(txHash)

  if (+unpackedTx.tag === OBJECT_TAG_SIGNED_TRANSACTION) {
    const { txType, tx } = unpackedTx.encodedTx
    const signatures = unpackedTx.signatures.map(raw => ({ raw, hash: encode(raw, 'sg') }))
    const rlpEncodedTx = unpackedTx.encodedTx.rlpEncoded

    return {
      validation: await this.verifyTx({ tx, signatures, rlpEncoded: rlpEncodedTx }, networkId),
      tx,
      signatures,
      txType
    }
  }
  return {
    validation: await this.verifyTx({ tx: unpackedTx, rlpEncoded }, networkId),
    tx: unpackedTx,
    txType
  }
}

const getOwnerPublicKey = (tx) =>
  tx[['senderId', 'accountId', 'ownerId', 'callerId', 'oracleId'].find(key => tx[key])].replace('ok_', 'ak_')

/**
 * Verify transaction (verify nonce, ttl, fee, signature, account balance)
 * @function
 * @alias module:@aeternity/aepp-sdk/es/tx/validator
 *
 * @param {Object} [data={}] data TX data object
 * @param {String} [data.tx] tx Transaction hash
 * @param {Array} [data.signatures] signatures Transaction signature's
 * @param {Array} [data.rlpEncoded] rlpEncoded RLP encoded transaction
 * @param {String} networkId networkId Use in signature verification
 * @return {Promise<Array>} Object with verification errors and warnings
 */
async function verifyTx ({ tx, signatures, rlpEncoded }, networkId) {
  networkId = networkId || this.nodeNetworkId || 'ae_mainnet'
  // Fetch data for verification
  const ownerPublicKey = getOwnerPublicKey(tx)
  const gas = tx.hasOwnProperty('gas') ? +tx.gas : 0
  const resolvedData = {
    minFee: calculateFee(0, OBJECT_ID_TX_TYPE[+tx.tag], { gas, params: tx, showWarning: false }),
    ...(await resolveDataForBase(this, { ownerPublicKey })),
    ...tx
  }
  const signatureVerification = signatures && signatures.length
    ? verifySchema(SIGNATURE_VERIFICATION_SCHEMA, {
      rlpEncoded,
      signature: signatures[0].raw,
      ownerPublicKey,
      networkId
    })
    : []
  const baseVerification = verifySchema(BASE_VERIFICATION_SCHEMA, resolvedData)
  // const customVerification = customVerification(this.api, { tx, resolvedBaseData })

  return [
    ...baseVerification,
    ...signatureVerification
    // ...customVerification.error
  ]
}

/**
 * Transaction Validator Stamp
 * This stamp give us possibility to unpack and validate some of transaction properties,
 * to make sure we can post it to the chain
 * @function
 * @alias module:@aeternity/aepp-sdk/es/tx/validator
 * @rtype Stamp
 * @param {Object} [options={}] - Initializer object
 * @param {Object} [options.url] - Node url
 * @param {Object} [options.internalUrl] - Node internal url
 * @return {Object} Transaction Validator instance
 * @example TransactionValidator({url: 'https://sdk-testnet.aepps.com'})
 */
const TransactionValidator = Node.compose({
  methods: {
    verifyTx,
    unpackAndVerify
  }
})

export default TransactionValidator
