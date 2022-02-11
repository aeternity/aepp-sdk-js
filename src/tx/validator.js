import { verify, hash } from '../utils/crypto'
import { encode, decode } from './builder/helpers'

import BigNumber from 'bignumber.js'
import { MIN_GAS_PRICE, PROTOCOL_VM_ABI, TX_TYPE } from './builder/schema'
import { calculateFee, unpackTx } from './builder'
import { UnsupportedProtocolError } from '../utils/errors'

/**
 * Transaction validator
 * @module @aeternity/aepp-sdk/es/tx/validator
 * @export verifyTransaction
 * @example import { verifyTransaction } from '@aeternity/aepp-sdk'
 */

const validators = [
  ({ encodedTx, signatures }, { account, node, parentTxTypes }) => {
    if ((encodedTx ?? signatures) === undefined) return []
    if (signatures.length !== 1) return [] // TODO: Support multisignature?
    const prefix = Buffer.from([
      node.nodeNetworkId,
      ...parentTxTypes.includes(TX_TYPE.payingFor) ? ['inner_tx'] : []
    ].join('-'))
    const txWithNetworkId = Buffer.concat([prefix, encodedTx.rlpEncoded])
    const txHashWithNetworkId = Buffer.concat([prefix, hash(encodedTx.rlpEncoded)])
    const decodedPub = decode(account.id, 'ak')
    if (verify(txWithNetworkId, signatures[0], decodedPub) ||
      verify(txHashWithNetworkId, signatures[0], decodedPub)) return []
    return [{
      message: 'Signature cannot be verified, please ensure that you transaction have' +
        ' the correct prefix and the correct private key for the sender address',
      key: 'InvalidSignature',
      checkedKeys: ['encodedTx', 'signatures']
    }]
  },
  ({ encodedTx, tx }, { node, parentTxTypes, txType }) => {
    if ((encodedTx ?? tx) === undefined) return []
    return verifyTransaction(
      encode((encodedTx ?? tx).rlpEncoded, 'tx'),
      node,
      [...parentTxTypes, txType]
    )
  },
  (tx, { txType }) => {
    if (tx.fee === undefined) return []
    const minFee = calculateFee(0, txType, {
      gas: +tx.gas || 0, params: tx, showWarning: false, vsn: tx.VSN
    })
    if (new BigNumber(minFee).lte(tx.fee)) return []
    return [{
      message: `Fee ${tx.fee} is too low, minimum fee for this transaction is ${minFee}`,
      key: 'InsufficientFee',
      checkedKeys: ['fee']
    }]
  },
  ({ ttl }, { height }) => {
    if (ttl === undefined) return []
    ttl = +ttl
    if (ttl === 0 || ttl >= height) return []
    return [{
      message: `TTL ${ttl} is already expired, current height is ${height}`,
      key: 'ExpiredTTL',
      checkedKeys: ['ttl']
    }]
  },
  ({ amount, fee, nameFee, tx }, { account, parentTxTypes, txType }) => {
    if ((amount ?? fee ?? nameFee) === undefined) return []
    const cost = new BigNumber(fee).plus(nameFee || 0).plus(amount || 0)
      .plus(txType === TX_TYPE.payingFor ? tx.tx.encodedTx.tx.fee : 0)
      .minus(parentTxTypes.includes(TX_TYPE.payingFor) ? fee : 0)
    if (cost.lte(account.balance)) return []
    return [{
      message: `Account balance ${account.balance} is not enough to execute the transaction that costs ${cost.toFixed()}`,
      key: 'InsufficientBalance',
      checkedKeys: ['amount', 'fee', 'nameFee']
    }]
  },
  ({ nonce }, { account, parentTxTypes }) => {
    if (nonce === undefined || parentTxTypes.includes(TX_TYPE.gaMeta)) return []
    nonce = +nonce
    const validNonce = account.nonce + 1
    if (nonce === validNonce) return []
    return [{
      ...nonce < validNonce
        ? {
            message: `Nonce ${nonce} is already used, valid nonce is ${validNonce}`,
            key: 'NonceAlreadyUsed'
          }
        : {
            message: `Nonce ${nonce} is too high, valid nonce is ${validNonce}`,
            key: 'NonceHigh'
          },
      checkedKeys: ['nonce']
    }]
  },
  ({ gasPrice }) => {
    if (gasPrice === undefined) return []
    if (gasPrice >= MIN_GAS_PRICE) return []
    return [{
      message: `Gas price ${gasPrice} must be bigger then ${MIN_GAS_PRICE}`,
      key: 'MinGasPrice',
      checkedKeys: ['gasPrice']
    }]
  },
  ({ ctVersion, abiVersion }, { txType, node }) => {
    const { consensusProtocolVersion } = node.getNodeInfo()
    const protocol = PROTOCOL_VM_ABI[consensusProtocolVersion]
    if (!protocol) throw new UnsupportedProtocolError(`Unsupported protocol: ${consensusProtocolVersion}`)
    // If not contract create tx
    if (!ctVersion) ctVersion = { abiVersion }
    const txProtocol = protocol[txType]
    if (!txProtocol) return []
    if (Object.entries(ctVersion).some(([key, value]) => !txProtocol[key].includes(+value))) {
      return [{
        message: `ABI/VM version ${JSON.stringify(ctVersion)} is wrong, supported is: ${JSON.stringify(txProtocol)}`,
        key: 'VmAndAbiVersionMismatch',
        checkedKeys: ['ctVersion', 'abiVersion']
      }]
    }
    return []
  },
  async ({ contractId }, { txType, node }) => {
    if (TX_TYPE.contractCall !== txType) return []
    try {
      const { active } = await node.api.getContract(contractId)
      if (active) return []
      return [{
        message: `Contract ${contractId} is not active`,
        key: 'ContractNotActive',
        checkedKeys: ['contractId']
      }]
    } catch (error) {
      if (!error.response?.body?.reason) throw error
      return [{
        message: error.response.body.reason,
        key: 'ContractNotFound',
        checkedKeys: ['contractId']
      }]
    }
  }
]

const getSenderAddress = tx => [
  'senderId', 'accountId', 'ownerId', 'callerId',
  'oracleId', 'fromId', 'initiator', 'gaId', 'payerId'
]
  .map(key => tx[key])
  .filter(a => a)
  .map(a => a.replace(/^ok_/, 'ak_'))[0]

/**
 * Transaction Validator
 * This function validates some of transaction properties,
 * to make sure it can be posted it to the chain
 * @function
 * @alias module:@aeternity/aepp-sdk/es/tx/validator
 * @rtype (tx: String, node) => void
 * @param {String} transaction Base64Check-encoded transaction
 * @param {Object} node Node to validate transaction against
 * @param {String[]} [parentTxTypes] Types of parent transactions
 * @return {Promise<Object[]>} Array with verification errors
 * @example const errors = await verifyTransaction(transaction, node)
 */
export default async function verifyTransaction (transaction, node, parentTxTypes = []) {
  const { tx, txType } = unpackTx(transaction)

  const address = getSenderAddress(tx) ??
    (txType === TX_TYPE.signed ? getSenderAddress(tx.encodedTx.tx) : null)
  const [account, { height }] = await Promise.all([
    address && node.api.getAccountByPubkey(address).catch(() => ({
      id: address,
      balance: new BigNumber(0),
      nonce: 0
    })),
    node.api.getCurrentKeyBlockHeight()
  ])

  return (await Promise.all(
    validators.map(v => v(tx, { txType, node, account, height, parentTxTypes })))
  ).flat()
}
