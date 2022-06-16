import BigNumber from 'bignumber.js'
import { MIN_GAS_PRICE, TX_TYPE, TxParamsCommon } from './builder/schema'
import { AE_AMOUNT_FORMATS } from '../utils/amount-formatter'
import { buildTx } from './builder'
import { isKeyOfObject } from '../utils/other'

const BASE_GAS = 15000
const GAS_PER_BYTE = 20
const KEY_BLOCK_INTERVAL = 3

/**
 * Calculate the Base fee gas
 * @see {@link https://github.com/aeternity/protocol/blob/master/consensus/README.md#gas}
 * @param txType - The transaction type
 * @returns The base fee
 * @example
 * ```js
 * TX_FEE_BASE('channelForceProgress') => new BigNumber(30 * 15000)
 * ```
 */
const TX_FEE_BASE_GAS = (txType: TX_TYPE): BigNumber => {
  const feeFactors = {
    [TX_TYPE.channelForceProgress]: 30,
    [TX_TYPE.channelOffChain]: 0,
    [TX_TYPE.channelOffChainCallContract]: 0,
    [TX_TYPE.channelOffChainCreateContract]: 0,
    [TX_TYPE.channelOffChainUpdateDeposit]: 0,
    [TX_TYPE.channelOffChainUpdateWithdrawal]: 0,
    [TX_TYPE.channelOffChainUpdateTransfer]: 0,
    [TX_TYPE.contractCreate]: 5,
    [TX_TYPE.contractCall]: 12,
    [TX_TYPE.gaAttach]: 5,
    [TX_TYPE.gaMeta]: 5,
    [TX_TYPE.payingFor]: 1 / 5
  } as const
  const factor = feeFactors[txType as keyof typeof feeFactors] ?? 1
  return new BigNumber(factor * BASE_GAS)
}

/**
 * Calculate fee for Other types of transactions
 * @see {@link https://github.com/aeternity/protocol/blob/master/consensus/README.md#gas}
 * @param txType - The transaction type
 * @param txSize - The transaction size
 * @returns parameters - The transaction parameters
 * @returns parameters.relativeTtl - The relative ttl
 * @returns parameters.innerTxSize - The size of the inner transaction
 * @returns The Other fee
 * @example
 * ```js
 * TX_FEE_OTHER_GAS('oracleResponse',10, { relativeTtl: 10, innerTxSize: 10 })
 *  => new BigNumber(10).times(20).plus(Math.ceil(32000 * 10 / Math.floor(60 * 24 * 365 / 2)))
 * ```
 */
const TX_FEE_OTHER_GAS = (
  txType: TX_TYPE,
  txSize: number,
  { relativeTtl, innerTxSize }: { relativeTtl: number, innerTxSize: number }
): BigNumber => {
  switch (txType) {
    case TX_TYPE.oracleRegister:
    case TX_TYPE.oracleExtend:
    case TX_TYPE.oracleQuery:
    case TX_TYPE.oracleResponse:
      return new BigNumber(txSize)
        .times(GAS_PER_BYTE)
        .plus(
          Math.ceil(32000 * relativeTtl / Math.floor(60 * 24 * 365 / KEY_BLOCK_INTERVAL))
        )
    case TX_TYPE.gaMeta:
    case TX_TYPE.payingFor:
      return new BigNumber(txSize).minus(innerTxSize).times(GAS_PER_BYTE)
    default:
      return new BigNumber(txSize).times(GAS_PER_BYTE)
  }
}

function getOracleRelativeTtl (params: any, txType: TX_TYPE): number {
  const ttlKeys = {
    [TX_TYPE.oracleRegister]: 'oracleTtlValue',
    [TX_TYPE.oracleExtend]: 'oracleTtlValue',
    [TX_TYPE.oracleQuery]: 'queryTtlValue',
    [TX_TYPE.oracleResponse]: 'responseTtlValue'
  } as const

  if (!isKeyOfObject(txType, ttlKeys)) return 1
  else return params[ttlKeys[txType]]
}

/**
 * Calculate fee based on tx type and params
 */
function buildFee (
  txType: TX_TYPE,
  { params, vsn, denomination }:
  { params: TxParamsCommon, vsn?: number, denomination?: AE_AMOUNT_FORMATS }
): BigNumber {
  const { rlpEncoded: { length } } = buildTx(params, txType, { vsn, denomination })

  return TX_FEE_BASE_GAS(txType)
    .plus(TX_FEE_OTHER_GAS(txType, length, {
      relativeTtl: getOracleRelativeTtl(params, txType),
      innerTxSize: [TX_TYPE.gaMeta, TX_TYPE.payingFor].includes(txType)
        ? params.tx.tx.encodedTx.rlpEncoded.length
        : 0
    }))
    .times(MIN_GAS_PRICE)
}

/**
 * Calculate min fee
 * @param txType - Transaction type
 * @param options - Options object
 * @param options.params - Tx params
 * @example
 * ```js
 * calculateMinFee('spendTx', { gasLimit, params })
 * ```
 */
export default function calculateMinFee (
  txType: TX_TYPE,
  { params, vsn, denomination }:
  { params: TxParamsCommon, vsn?: number, denomination?: AE_AMOUNT_FORMATS }
): BigNumber {
  let fee = new BigNumber(0)
  let previousFee
  do {
    previousFee = fee
    fee = buildFee(txType, { params: { ...params, fee }, vsn, denomination })
  } while (!fee.eq(previousFee))
  return fee
}
