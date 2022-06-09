import { verify, hash } from '../utils/crypto'
import { encode, decode } from './builder/helpers'
import BigNumber from 'bignumber.js'
import { PROTOCOL_VM_ABI, RawTxObject, TxSchema, TxParamsCommon, TxType, TX_TYPE, TxTypeSchemas } from './builder/schema'
import { calculateFee, TxUnpacked, unpackTx } from './builder'
import { UnsupportedProtocolError } from '../utils/errors'
import { concatBuffers, isKeyOfObject } from '../utils/other'
import { EncodedData } from '../utils/encoder'
import { Node } from '../chain'
import { VmVersion } from '.'

/**
 * Transaction validator
 * @module @aeternity/aepp-sdk/es/tx/validator
 * @export verifyTransaction
 * @example import { verifyTransaction } from '@aeternity/aepp-sdk'
 */

interface Account {
  balance: string
  id: EncodedData<'ak'>
  kind: string
  nonce: number | BigNumber | string
  payable: boolean
}

interface ValidatorResult {
  message: string
  key: string
  checkedKeys: string[]
}

const validators = [
  ({
    encodedTx,
    signatures
  }: {
    encodedTx: TxUnpacked<TxSchema>
    signatures: Buffer[]
  },
  {
    account,
    node,
    parentTxTypes
  }: {
    account: Account
    node: Node
    parentTxTypes: string[]
  }): ValidatorResult[] => {
    if ((encodedTx ?? signatures) === undefined) return []
    if (signatures.length !== 1) return [] // TODO: Support multisignature?
    const prefix = Buffer.from([
      node.nodeNetworkId,
      ...parentTxTypes.includes(TX_TYPE.payingFor) ? ['inner_tx'] : []
    ].join('-'))
    const txWithNetworkId = concatBuffers([prefix, encodedTx.rlpEncoded])
    const txHashWithNetworkId = concatBuffers([prefix, hash(encodedTx.rlpEncoded)])
    const decodedPub = decode(account.id)
    if (verify(txWithNetworkId, signatures[0], decodedPub) ||
      verify(txHashWithNetworkId, signatures[0], decodedPub)) return []
    return [{
      message: 'Signature cannot be verified, please ensure that you transaction have' +
        ' the correct prefix and the correct private key for the sender address',
      key: 'InvalidSignature',
      checkedKeys: ['encodedTx', 'signatures']
    }]
  },
  async ({
    encodedTx,
    tx
  }: {
    encodedTx: TxUnpacked<TxSchema>
    tx: TxSchema
  }, {
    node,
    parentTxTypes,
    txType
  }: {
    node: any
    parentTxTypes: string[]
    txType: TxType
  }): Promise<ValidatorResult[]> => {
    if ((encodedTx ?? tx) === undefined) return []
    return await verifyTransaction(
      encode((encodedTx ?? tx).rlpEncoded, 'tx'),
      node,
      [...parentTxTypes, txType]
    )
  },
  (tx: any, { txType }: {txType: TxType}): ValidatorResult[] => {
    if (tx.fee === undefined) return []
    const minFee = calculateFee(0, txType, {
      gasLimit: +tx?.gasLimit ?? 0, params: tx, showWarning: false, vsn: tx.VSN
    })
    if (new BigNumber(minFee).lte(tx.fee)) return []
    return [{
      message: `Fee ${tx.fee as string} is too low, minimum fee for this transaction is ${minFee.toString()}`,
      key: 'InsufficientFee',
      checkedKeys: ['fee']
    }]
  },
  ({ ttl }: {ttl: number}, { height }: {height: number}): ValidatorResult[] => {
    if (ttl === undefined) return []
    ttl = +ttl
    if (ttl === 0 || ttl >= height) return []
    return [{
      message: `TTL ${ttl} is already expired, current height is ${height}`,
      key: 'ExpiredTTL',
      checkedKeys: ['ttl']
    }]
  },
  ({ amount, fee, nameFee, tx }: {
    amount: number
    fee: number
    nameFee: number
    tx: TxUnpacked<any> & {
      tx: TxTypeSchemas['signedTx']
    }
  }, { account, parentTxTypes, txType }: {
    account: TxTypeSchemas['account']
    parentTxTypes: string[]
    txType: TxType
  }): ValidatorResult[] => {
    if ((amount ?? fee ?? nameFee) === undefined) return []
    const cost = new BigNumber(fee).plus(nameFee ?? 0).plus(amount ?? 0)
      .plus(txType === TX_TYPE.payingFor ? (tx.tx.encodedTx.tx).fee : 0)
      .minus(parentTxTypes.includes(TX_TYPE.payingFor) ? fee : 0)
    if (cost.lte(account.balance)) return []
    return [{
      message: `Account balance ${account.balance.toString()} is not enough to execute the transaction that costs ${cost.toFixed()}`,
      key: 'InsufficientBalance',
      checkedKeys: ['amount', 'fee', 'nameFee']
    }]
  },
  ({ nonce }: {nonce: number}, { account, parentTxTypes }: {
    account: TxTypeSchemas['account']
    parentTxTypes: string[]
  }): ValidatorResult[] => {
    if (nonce == null || parentTxTypes.includes(TX_TYPE.gaMeta)) return []
    nonce = +nonce
    const validNonce = account.nonce as number + 1
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
  ({ ctVersion, abiVersion }: {
    ctVersion: Partial<VmVersion>
    abiVersion: number
  }, { txType, node }: {
    txType: TxType
    node: Node
  }): ValidatorResult[] => {
    const { consensusProtocolVersion } = node.getNodeInfo()

    if (!isKeyOfObject(consensusProtocolVersion, PROTOCOL_VM_ABI)) {
      throw new UnsupportedProtocolError(`Unsupported protocol: ${consensusProtocolVersion}`)
    }
    const protocol =
      PROTOCOL_VM_ABI[consensusProtocolVersion] as typeof
      PROTOCOL_VM_ABI[keyof typeof PROTOCOL_VM_ABI]

    // If not contract create tx
    if (ctVersion == null) ctVersion = { abiVersion }
    const txProtocol = protocol[txType as keyof typeof protocol]
    if (txProtocol == null) return []
    if (Object.entries(ctVersion).some(
      ([
        key,
        value
      ]: [
        key:keyof typeof txProtocol,
        value:any]) => !(txProtocol[key].includes(+value as never)))) {
      return [{
        message: `ABI/VM version ${JSON.stringify(ctVersion)} is wrong, supported is: ${JSON.stringify(txProtocol)}`,
        key: 'VmAndAbiVersionMismatch',
        checkedKeys: ['ctVersion', 'abiVersion']
      }]
    }
    return []
  },
  async ({ contractId }: {
    contractId: EncodedData<'ct'>
  }, { txType, node }: {
    txType: TxType
    node: Node
  }) => {
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
      if (error.response?.parsedBody?.reason == null) throw error
      return [{
        message: error.response.parsedBody.reason,
        key: 'ContractNotFound',
        checkedKeys: ['contractId']
      }]
    }
  }
]

const getSenderAddress = (tx: TxParamsCommon | RawTxObject<TxSchema>): EncodedData<'ak'> => [
  'senderId', 'accountId', 'ownerId', 'callerId',
  'oracleId', 'fromId', 'initiator', 'gaId', 'payerId'
]
  .map((key: keyof TxSchema) => tx[key])
  .filter(a => a)
  .map((a) => a?.toString().replace(/^ok_/, 'ak_'))[0] as EncodedData<'ak'>

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
export default async function verifyTransaction (
  transaction: Buffer | EncodedData<'tx'>,
  node: any,
  parentTxTypes: string[] = []): Promise<ValidatorResult[]> {
  const { tx, txType } = unpackTx(transaction)
  const address = getSenderAddress(tx) ??
    (txType === TX_TYPE.signed
      ? getSenderAddress(
        (tx as TxTypeSchemas[typeof txType]).encodedTx.tx
      )
      : null)
  const [account, { height }] = await Promise.all([
    address != null && node.api.getAccountByPubkey(address).catch(() => ({
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
