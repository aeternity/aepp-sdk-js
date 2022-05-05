import BigNumber from 'bignumber.js'
import { decode as rlpDecode, encode as rlpEncode, NestedUint8Array } from 'rlp'
import { AE_AMOUNT_FORMATS, formatAmount } from '../../utils/amount-formatter'
import { hash } from '../../utils/crypto'
import { Field } from './field-types'

import {
  DEFAULT_FEE,
  FIELD_TYPES,
  OBJECT_ID_TX_TYPE,
  TxField,
  TxType,
  TX_DESERIALIZATION_SCHEMA,
  TX_FEE_BASE_GAS,
  TX_FEE_OTHER_GAS,
  TX_SERIALIZATION_SCHEMA,
  TX_TYPE,
  VSN
} from './schema'
import {
  readInt,
  readId,
  readPointers,
  writeId,
  writeInt,
  buildPointers,
  encode,
  decode,
  Pointer
} from './helpers'
import { toBytes } from '../../utils/bytes'
import MPTree, { MPTreeBinary } from '../../utils/mptree'
import { InvalidTxParamsError, SchemaNotFoundError } from '../../utils/errors'
import { EncodedData } from '../../utils/encoder'

/**
 * JavaScript-based Transaction builder
 * @module @aeternity/aepp-sdk/es/tx/builder
 * @example import { calculateFee } from '@aeternity/aepp-sdk'
 */

/**
 * @interface TxOptionsCommon
 * These options are common and can be provided to every tx-type.
 */
interface TxOptionsCommon {
  /**
   * You can specify the account that should be used to sign a transaction.
   *
   * The account needs to be provided to the SDK instance in order to be used for signing.
   *
   * The default value is the first account defined in the account array of the SDK instance
   *
   */
  onAccount?: string

  /**
   * The default behavior might cause problems if you perform many transactions in a short period
   * of time.
   *
   * You might want to implement your own nonce management and provide the nonce "manually"
   *
   * The default value can be obtained via node API
   *
   * 2 different strategies to use in order to determine the next nonce,
   * See option `strategy` to learn more.
   */
  nonce?: number

  /**
   * The strategy to obtain next nonce for an account via node API
   *
   * If set to `max`, then the greatest nonce seen in the account or currently
   * in the transaction pool is incremented with 1 and returned.
   *
   * If the strategy is set to `continuity`, then transactions in the mempool are checked
   * if there are gaps - missing nonces that prevent transactions
   * with greater nonces to get included
   * @default 'max'
   *
   */
  strategy?: 'max' | 'continuity'

  /**
   * Should be set if you want the transaction
   * to be only valid until a certain block height is reached.
   * @default 0
   */
  ttl?: number

  /**
   * The minimum fee is dependent on the tx-type.
   *
   * The default value is calculated for each tx-type.
   */
  fee?: number

  /**
   * Should be used for signing an inner transaction that will be wrapped in a `PayingForTx`.
   * @default false
   */
  innerTx?: boolean

  /**
   * If set to true the transaction will be verified prior to broadcasting it.
   * @default false
   */
  verify?: boolean

  /**
   * Wait for transactions to be mined.
   *
   * You can get the tx object that contains the tx-hash immediately by setting to `false`
   * and should implement your own logic to watch for mined transactions.
   *
   * @default true
   */
  waitMined?: boolean
}
interface TxOptionsContract extends TxOptionsCommon {
  /**
   * To be used for providing `aettos` (or `AE` with respective denomination)
   * to a contract related transaction.
   * @default 0
   */
  amount?: number

  /**
   * You can specify the denomination of the `amount`
   * that will be provided to the contract related transaction.
   * @default 'aettos'
   */
  denomination?: string

  /**
   * Maximum amount of gas to be consumed by the transaction.
   * Learn more on {@link https://github.com/aeternity/aepp-sdk-js/blob/develop/docs/transaction-options.md#how-to-estimate-gas How to estimate gas?}
   */
  gasLimit?: number

  /**
   * To increase chances to get your transaction included quickly you can use a higher gasPrice.
   * @default 1e9
   */
  gasPrice?: number
}

interface TxOptionsNameUpdate extends TxOptionsCommon {
  /**
   * This option is an indicator for indexing tools to know how long (in seconds)
   * they could or should cache the name information.
   * @default 84600
   */
  clientTtl?: number

  /**
    * This option tells the protocol the relative TTL based on the current block height.
    * @default 180000
    */
  nameTtl?: number
}

interface TxOptionsNameClaim extends TxOptionsCommon {
  /**
   * The fee in `aettos` that will be payed to claim the name.
   *
   * For bids in an auction you need to explicitely calculate the required `nameFee`
   * based on the last bid
   *
   * The default value is calculated based on the length of the name
   */
  nameFee?: number
}

interface TxOptionsOracleRegister extends TxOptionsCommon {
  /**
   * The fee in `aettos` that the oracle requests in order to provide a response.
   * @default 30000
   */
  queryFee?: number

  /**
   * The TTL of the oracle that defines its expiration.
   * @default {type:'delta', value:500}
   */
  oracleTtl?: {
    type?: 'delta' | 'block'
    value?: number
  }
}

interface TxOptionsOracleQuery extends TxOptionsCommon {
  /**
   * The fee in `aettos` that will be payed to the oracle.
   * @default 30000
   */
  queryFee?: number

  /**
   * The TTL of the query that defines its expiration.
   * The oracle needs to respond before the `queryTtl` expires.
   * @default {type:'delta', value:10}
   */
  queryTtl?: {
    type?: 'delta' | 'block'
    value?: number
  }

  /**
   * The TTL of the response that defines its expiration.
   * The response of the oracle will be garbage collected after its expiration.
   * @default {type:'delta', value:10}
   */
  responseTtl?: {
    type?: 'delta' | 'block'
    value?: number
  }
}

interface TxOptionsSpend extends TxOptionsCommon {
  /**
   * u can specify the denomination of the
   * `amount` that will be provided to the contract related transaction.
   * @default 'aettos'
   */
  denomination?: string
}

type TxBuildParams = TxOptionsContract | TxOptionsSpend |
TxOptionsNameClaim | TxOptionsNameUpdate | TxOptionsOracleQuery | TxOptionsOracleRegister

const ORACLE_TTL_TYPES = {
  delta: 'delta',
  block: 'block'
}

// SERIALIZE AND DESERIALIZE PART
function deserializeField (
  value: any,
  type: string | typeof Field | Function,
  prefix: string | string[]
): any {
  if (value === undefined || value === null) return ''
  switch (type) {
    case FIELD_TYPES.ctVersion: {
      const [vm, , abi] = value
      return {
        vmVersion: readInt(Buffer.from([vm])),
        abiVersion: readInt(Buffer.from([abi]))
      }
    }
    case FIELD_TYPES.amount:
    case FIELD_TYPES.int:
      return readInt(value)
    case FIELD_TYPES.id:
      return readId(value)
    case FIELD_TYPES.ids:
      return value.map(readId)
    case FIELD_TYPES.bool:
      return value[0] === 1
    case FIELD_TYPES.binary:
      return encode(value, prefix.toString())
    case FIELD_TYPES.stateTree:
      return encode(value, 'ss')
    case FIELD_TYPES.string:
      return value.toString()
    case FIELD_TYPES.payload:
      return encode(value, 'ba')
    case FIELD_TYPES.pointers:
      return readPointers(value)
    case FIELD_TYPES.rlpBinary:
      return unpackTx(value, true)
    case FIELD_TYPES.rlpBinaries:
      return value.map((v: Buffer) => unpackTx(v, true))
    case FIELD_TYPES.rawBinary:
      return value
    case FIELD_TYPES.hex:
      return value.toString('hex')
    case FIELD_TYPES.offChainUpdates:
      return value.map((v: Buffer) => unpackTx(v, true))
    case FIELD_TYPES.callStack:
      // TODO: fix this
      return [readInt(value)]
    case FIELD_TYPES.mptrees:
      return value.map((t: MPTreeBinary) => new MPTree(t))
    case FIELD_TYPES.callReturnType:
      switch (readInt(value)) {
        case '0':
          return 'ok'
        case '1':
          return 'error'
        case '2':
          return 'revert'
        default:
          return value
      }
    case FIELD_TYPES.sophiaCodeTypeInfo:
      return value.reduce(
        (acc: object, [funHash, fnName, argType, outType]: [
          funHash: Buffer,
          fnName: string,
          argType: string,
          outType: string
        ]) => ({
          ...acc,
          [fnName.toString()]: { funHash, argType, outType }
        }),
        {}
      )
    default:
      if (
        type instanceof Object &&
        'deserialize' in type &&
        type.prototype instanceof Field) return type.deserialize(value)
      return value
  }
}

function serializeField (value: any,
  type: string | Function | typeof Field,
  prefix: string, params: any): any {
  switch (type) {
    case FIELD_TYPES.amount:
    case FIELD_TYPES.int:
      return writeInt(value)
    case FIELD_TYPES.id:
      return writeId(value)
    case FIELD_TYPES.ids:
      return value.map(writeId)
    case FIELD_TYPES.bool:
      return Buffer.from([(Boolean(value) !== undefined && value !== null) ? 1 : 0])
    case FIELD_TYPES.binary:
      return decode(value, prefix)
    case FIELD_TYPES.stateTree:
      return decode(value, 'ss')
    case FIELD_TYPES.hex:
      return Buffer.from(value, 'hex')
    case FIELD_TYPES.signatures:
      return value.map(Buffer.from)
    case FIELD_TYPES.payload:
      return typeof value === 'string' && value.split('_')[0] === 'ba'
        ? decode(value as EncodedData<'ba'>, 'ba')
        : toBytes(value)
    case FIELD_TYPES.string:
      return toBytes(value)
    case FIELD_TYPES.pointers:
      return buildPointers(value)
    case FIELD_TYPES.rlpBinary:
      return value.rlpEncoded ?? value
    case FIELD_TYPES.mptrees:
      return value.map((t: typeof Field) => t.serialize(''))
    case FIELD_TYPES.ctVersion:
      return Buffer.from([...toBytes(value.vmVersion), 0, ...toBytes(value.abiVersion)])
    case FIELD_TYPES.callReturnType:
      switch (value) {
        case 'ok': return writeInt(0)
        case 'error': return writeInt(1)
        case 'revert': return writeInt(2)
        default: return value
      }
    default:
      if (
        type instanceof Object &&
        'serialize' in type &&
        type.prototype instanceof Field) {
        return type.serialize(value, params)
      }
      return value
  }
}

function validateField (
  value: any, type: string | Function | typeof Field,
  prefix: string | string[]): string | undefined {
  // All fields are required
  if (value === undefined || value === null) return 'Field is required'

  // Validate type of value
  switch (type) {
    case FIELD_TYPES.amount:
    case FIELD_TYPES.int: {
      if (isNaN(value) && !BigNumber.isBigNumber(value)) {
        return `${String(value)} is not of type Number or BigNumber`
      }
      if (new BigNumber(value).lt(0)) return `${String(value)} must be >= 0`
      return
    }
    case FIELD_TYPES.id: {
      const prefixes = Array.isArray(prefix) ? prefix : [prefix]
      if (!prefixes.includes(value.split('_')[0])) {
        return `'${String(value)}' prefix doesn't match expected prefix '${prefix.toString()}'`
      }
      return
    }
    case FIELD_TYPES.ctVersion:
      if (!(Boolean(value?.abiVersion) && Boolean(value?.vmVersion))) {
        return 'Value must be an object with "vmVersion" and "abiVersion" fields'
      }
      return
    case FIELD_TYPES.pointers:
      if (!Array.isArray(value)) return 'Value must be of type Array'
      if (value.some((p: Pointer) => !(Boolean(p?.key) && Boolean(p?.id)))) {
        return 'Value must contains only object\'s like \'{key: "account_pubkey", id: "ak_lkamsflkalsdalksdlasdlasdlamd"}\''
      }
      if (value.length > 32) {
        return `Expected 32 pointers or less, got ${value.length} instead`
      }
  }
}

function transformParams (
  params: any, schema: TxField[], { denomination }: {denomination?: string} = {}): any {
  params = schema
    .filter(([, t]) => t === FIELD_TYPES.amount)
    .reduce(
      (acc, [key]) => ({ ...params, [key]: formatAmount(params[key], { denomination }) }),
      params
    )
  const schemaKeys = schema.map(([k]) => k)
  return Object
    .entries(params)
    .reduce(
      (acc: any, [key, value]: [key: string,
        value: {
          type: string
          value: number
        }]) => {
        if (schemaKeys.includes(key)) acc[key] = value
        if (['oracleTtl', 'queryTtl', 'responseTtl'].includes(key)) {
          acc[`${key}Type`] = value.type === ORACLE_TTL_TYPES.delta ? 0 : 1
          acc[`${key}Value`] = value.value
        }
        return acc
      },
      {}
    )
}

// INTERFACE

function getOracleRelativeTtl (params: any, txType: string): number {
  const ttlKey = {
    [TX_TYPE.oracleRegister]: 'oracleTtl',
    [TX_TYPE.oracleExtend]: 'oracleTtl',
    [TX_TYPE.oracleQuery]: 'queryTtl',
    [TX_TYPE.oracleResponse]: 'responseTtl'
  }[txType]

  if (params[`${ttlKey}Value`] > 0) { return params[`${ttlKey}Value`] }
  if (params[ttlKey]?.value > 0) { return params[ttlKey].value }
  return 1
}

/**
 * Calculate min fee
 * @alias module:@aeternity/aepp-sdk/es/tx/builder/index
 * @param txType - Transaction type
 * @param options - Options object
 * @param options.gasLimit
 * @param options.params - Tx params
 * @example calculateMinFee('spendTx', { gasLimit, params })
 */
export function calculateMinFee (txType: string, { params, vsn }: {
  gasLimit?: string | number
  params?: Object
  vsn?: number
}): string {
  const multiplier = new BigNumber(1e9) // 10^9 GAS_PRICE
  if (params === null || params === undefined) {
    return new BigNumber(DEFAULT_FEE).times(multiplier).toString(10)
  }

  let actualFee = buildFee(txType, { params: { ...params, fee: 0 }, multiplier, vsn })
  let expected = new BigNumber(0)

  while (!actualFee.eq(expected)) {
    actualFee = buildFee(txType, {
      params: { ...params, fee: actualFee }, multiplier, vsn
    })
    expected = actualFee
  }
  return expected.toString(10)
}

/**
 * Calculate fee based on tx type and params
 * @param txType
 * @param options.params
 * @param options.multiplier
 * @param options.vsn
 * @return {BigNumber}
 */
function buildFee (txType: string, { params, multiplier, vsn }:
{params: any, multiplier: BigNumber, vsn?: number}): BigNumber {
  const { rlpEncoded: txWithOutFee } = buildTx({ ...params }, txType, { vsn })
  const txSize = txWithOutFee.length
  return TX_FEE_BASE_GAS(txType)
    .plus(TX_FEE_OTHER_GAS(txType, txSize, {
      relativeTtl: getOracleRelativeTtl(params, txType),
      innerTxSize: [TX_TYPE.gaMeta, TX_TYPE.payingFor].includes(txType)
        ? params.tx.tx.encodedTx.rlpEncoded.length
        : 0
    }))
    .times(multiplier)
}

/**
 * Calculate fee
 * @alias module:@aeternity/aepp-sdk/es/tx/builder
 * @rtype (fee, txType, gasLimit = 0) => String
 * @param fee - fee
 * @param txType - Transaction type
 * @param options - Options object
 * @param options.gasLimit
 * @param options.params - Tx params
 * @example calculateFee(null, 'spendTx', { gasLimit, params })
 */
export function calculateFee (
  fee: number = 0, txType: string, { gasLimit = 0, params, showWarning = true, vsn }: {
    gasLimit?: number
    params?: any
    showWarning?: boolean
    vsn?: number
  } = {}
): number | string {
  if ((params === undefined || params === null) && showWarning) console.warn(`Can't build transaction fee, we will use DEFAULT_FEE(${DEFAULT_FEE})`)

  return fee > 0 ? fee : calculateMinFee(txType, { params, gasLimit, vsn })
}

/**
 * Validate transaction params
 * @function
 * @alias module:@aeternity/aepp-sdk/es/tx/builder
 * @param params Object with tx params
 * @param schema Transaction schema
 * @param excludeKeys  Array of keys to exclude for validation
 * @return Object with validation errors
 */
export function validateParams (
  params: any, schema: TxField[], { excludeKeys = [] }: {excludeKeys: string[]}): object {
  return Object.fromEntries(
    schema
      // TODO: allow optional keys in schema
      .filter(([key]) => !excludeKeys.includes(key) &&
        !['payload', 'nameFee', 'deposit'].includes(key))
      .map(([key, type, prefix]) => [key, validateField(params[key], type, prefix)])
      .filter(([, message]) => message)
  )
}

interface TxOptionsRaw {
  excludeKeys?: string[]
  denomination?: string
}
/**
 * Build binary transaction
 * @function
 * @alias module:@aeternity/aepp-sdk/es/tx/builder
 * @param params Object with tx params
 * @param schema Transaction schema
 * @param [options={}] options
 * @param [options.excludeKeys=[]] Array of keys to exclude for validation and build
 * @param [options.denomination='aettos'] Denomination of amounts
 * @throws {Error} Validation error
 * @return Array with binary fields of transaction
 */
export function buildRawTx (
  params: any,
  schema: TxField[],
  { excludeKeys = [], denomination = AE_AMOUNT_FORMATS.AETTOS }: TxOptionsRaw = {}
): Buffer[] {
  const filteredSchema = schema.filter(([key]) => !excludeKeys.includes(key))

  // Transform `amount` type fields to `aettos`
  params = transformParams(params, filteredSchema, { denomination })
  // Validation
  const valid = validateParams(params, schema, { excludeKeys })
  if (Object.keys(valid).length > 0) {
    throw new InvalidTxParamsError('Transaction build error. ' + JSON.stringify(valid))
  }

  return filteredSchema
    .map(([key, fieldType, prefix]: [keyof TxBuildParams, string, string]) => serializeField(
      params[key], fieldType, prefix, params))
}

/**
 * Unpack binary transaction
 * @function
 * @alias module:@aeternity/aepp-sdk/es/tx/builder
 * @param binary Array with binary transaction field's
 * @param schema Transaction schema
 * @return Object with transaction field's
 */
export function unpackRawTx (binary: Uint8Array | NestedUint8Array, schema: TxField[]): TxType {
  return schema
    .reduce<any>(
    (
      acc,
      [key, fieldType, prefix],
      index
    ) => Object.assign(acc, { [key]: deserializeField(binary[index], fieldType, prefix) }),
    {}
  )
}

/**
 * Get transaction serialization/deserialization schema
 * @alias module:@aeternity/aepp-sdk/es/tx/builder
 * @param {{ vsn: String,fieldIndex: string | number, isDeserialized: Boolean }}
 * @throws {Error} Schema not found error
 * @return Schema
 */
const getSchema = ({ vsn, objId, type }: {
  vsn: number | string
  objId?: string
  type?: string
}): [schema: TxField[], tag:string | number] => {
  const isDeserialize = Boolean(objId)
  const firstKey = isDeserialize ? objId : type
  const schema = isDeserialize ? TX_DESERIALIZATION_SCHEMA : TX_SERIALIZATION_SCHEMA

  if (firstKey !== undefined && schema[firstKey] !== undefined &&
    schema[firstKey][vsn] !== undefined && Boolean(firstKey) && Boolean(schema[firstKey]) &&
    Boolean(schema[firstKey][vsn])) {
    return schema[firstKey][vsn]
  } else {
    if (firstKey !== undefined && (schema[firstKey] === undefined || schema[firstKey] === null)) {
      throw new SchemaNotFoundError(`Transaction ${isDeserialize ? 'deserialization' : 'serialization'} not implemented for ${isDeserialize ? 'tag ' + (objId ?? '') : (type ?? '')}`)
    }
    throw new SchemaNotFoundError(`Transaction ${isDeserialize ? 'deserialization' : 'serialization'} not implemented for ${isDeserialize ? 'tag ' + (objId ?? '') : (type ?? '')} version ${vsn}`)
  }
}

interface TxHash {
  tx: string
  rlpEncoded: Buffer
  binary: Uint8Array | NestedUint8Array
  txObject: TxType
}
/**
 * Build transaction hash
 * @function
 * @alias module:@aeternity/aepp-sdk/es/tx/builder
 * @param params Object with tx params
 * @param type Transaction type
 * @param [options={}] options
 * @param [options.excludeKeys] Array of keys to exclude for validation and build
 * @param [options.prefix] Prefix of transaction
 * @throws {Error} Validation error
 * @returns object
 * @returns object.tx Base64Check transaction hash with 'tx_' prefix
 * @returns object.rlpEncoded rlp encoded transaction
 * @returns object.binary binary transaction
 */
export function buildTx (
  params: any,
  type: string,
  { excludeKeys = [], prefix = 'tx', vsn = VSN, denomination = AE_AMOUNT_FORMATS.AETTOS } = {}
): TxHash {
  const [schema, tag] = getSchema({ type, vsn })
  const binary = buildRawTx(
    { ...params, VSN: vsn, tag },
    schema,
    { excludeKeys, denomination: ('denomination' in params ? params.denomination : undefined) ?? denomination }
  ).filter((e?: Buffer) => e !== undefined)

  const rlpEncoded = Buffer.from(rlpEncode(binary))
  const tx: string = encode(rlpEncoded, prefix)

  return { tx, rlpEncoded, binary, txObject: unpackRawTx(binary, schema) }
}

interface TxHashUnpacked {
  txType: string
  tx: TxType
  rlpEncoded: Buffer | string
  binary: Uint8Array | NestedUint8Array
}
/**
 * Unpack transaction hash
 * @function
 * @alias module:@aeternity/aepp-sdk/es/tx/builder
 * @param encodedTx String or RLP encoded transaction array
 * (if fromRlpBinary flag is true)
 * @param fromRlpBinary Unpack from RLP encoded transaction (default: false)
 * @param prefix - Prefix of data
 * @returns object
 * @returns object.tx Object with transaction param's
 * @returns object.rlpEncoded rlp encoded transaction
 * @returns object.binary binary transaction
 */
export function unpackTx (encodedTx: string | Buffer, fromRlpBinary: boolean = false, prefix: string = 'tx'): TxHashUnpacked {
  const rlpEncoded = fromRlpBinary
    ? encodedTx
    : decode(encodedTx.toString() as EncodedData<string>, prefix)
  const binary = rlpDecode(rlpEncoded)

  const objId = readInt(binary[0] as Buffer)
  const vsn = readInt(binary[1] as Buffer)
  const [schema] = getSchema({ objId, vsn })

  return {
    txType: OBJECT_ID_TX_TYPE[objId],
    tx: unpackRawTx(binary, schema),
    rlpEncoded,
    binary
  }
}

/**
 * Build a transaction hash
 * @function
 * @alias module:@aeternity/aepp-sdk/es/tx/builder
 * @param rawTx base64 or rlp encoded transaction
 * @return Transaction hash
 */
export function buildTxHash (rawTx: string | Buffer): string {
  const data = typeof rawTx === 'string' && rawTx.startsWith('tx_')
    ? decode(rawTx as EncodedData<'tx'>, 'tx')
    : rawTx
  return encode(hash(data), 'th')
}

export default {
  calculateMinFee,
  calculateFee,
  unpackTx,
  unpackRawTx,
  buildTx,
  buildRawTx,
  validateParams,
  buildTxHash
}
