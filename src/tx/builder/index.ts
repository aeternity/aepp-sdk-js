import { AeAmountFormats } from './../../utils/amount-formatter'
import { EncodedData, EncodingType } from './../../utils/encoder'
import BigNumber from 'bignumber.js'
import { decode as rlpDecode, encode as rlpEncode, NestedUint8Array } from 'rlp'
import { AE_AMOUNT_FORMATS, formatAmount } from '../../utils/amount-formatter'
import { hash } from '../../utils/crypto'
import { Field } from './field-types'

import {
  DEFAULT_FEE,
  FIELD_TYPES,
  OBJECT_ID_TX_TYPE,
  RawTxObject,
  TxField,
  TxTypeSchemas,
  TxParamsCommon,
  TxType,
  TX_DESERIALIZATION_SCHEMA,
  TX_FEE_BASE_GAS,
  TX_FEE_OTHER_GAS,
  TX_SERIALIZATION_SCHEMA,
  TX_TYPE,
  TxSchema
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
  Pointer,
  buildContractId
} from './helpers'
import { toBytes } from '../../utils/bytes'
import MPTree, { MPTreeBinary } from '../../utils/mptree'
import { ArgumentError, InvalidTxParamsError, SchemaNotFoundError, UnexpectedTsError } from '../../utils/errors'
import { isKeyOfObject } from '../../utils/other'

/**
 * JavaScript-based Transaction builder
 * @module @aeternity/aepp-sdk/es/tx/builder
 * @example import { calculateFee } from '@aeternity/aepp-sdk'
 */

enum ORACLE_TTL_TYPES {
  delta,
  block
}

// SERIALIZE AND DESERIALIZE PART
function deserializeField (
  value: any,
  type: string | typeof Field,
  prefix?: EncodingType | EncodingType[]
): any {
  if (value == null) return ''
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
      return encode(value, prefix as EncodingType)
    case FIELD_TYPES.stateTree:
      return encode(value, 'ss')
    case FIELD_TYPES.string:
      return value.toString()
    case FIELD_TYPES.payload:
      return encode(value, 'ba')
    case FIELD_TYPES.pointers:
      return readPointers(value)
    case FIELD_TYPES.rlpBinary:
      return unpackTx(value, { fromRlpBinary: true })
    case FIELD_TYPES.rlpBinaries:
      return value.map((v: Buffer) => unpackTx(v, { fromRlpBinary: true }))
    case FIELD_TYPES.rawBinary:
      return value
    case FIELD_TYPES.hex:
      return value.toString('hex')
    case FIELD_TYPES.offChainUpdates:
      return value.map((v: Buffer) => unpackTx(v, { fromRlpBinary: true }))
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
      if (type instanceof Object && 'deserialize' in type) return type.deserialize(value)
      return value
  }
}

function serializeField (
  value: any, type: string | typeof Field, params: any
): any {
  switch (type) {
    case FIELD_TYPES.amount:
    case FIELD_TYPES.int:
      return writeInt(value)
    case FIELD_TYPES.id:
      return writeId(value)
    case FIELD_TYPES.ids:
      return value.map(writeId)
    case FIELD_TYPES.bool:
      return Buffer.from([(value === true) ? 1 : 0])
    case FIELD_TYPES.binary:
      return decode(value)
    case FIELD_TYPES.stateTree:
      return decode(value)
    case FIELD_TYPES.hex:
      return Buffer.from(value, 'hex')
    case FIELD_TYPES.signatures:
      return value.map(Buffer.from)
    case FIELD_TYPES.payload:
      return typeof value === 'string' && value.split('_')[0] === 'ba'
        ? decode(value as EncodedData<'ba'>)
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
      if (type instanceof Object && 'serialize' in type) return type.serialize(value, params)
      return value
  }
}

function validateField (
  value: any,
  type: string | Function | typeof Field,
  prefix?: EncodingType | EncodingType[]
): string | undefined {
  // All fields are required
  if (value == null) return 'Field is required'

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
        if (prefix == null) { return `'${String(value)}' prefix doesn't exist'` }
        return `'${String(value)}' prefix doesn't match expected prefix '${prefix.toString()}'`
      }
      return
    }
    case FIELD_TYPES.ctVersion:
      if (!(Boolean(value.abiVersion) && Boolean(value.vmVersion))) {
        return 'Value must be an object with "vmVersion" and "abiVersion" fields'
      }
      return
    case FIELD_TYPES.pointers:
      if (!Array.isArray(value)) return 'Value must be of type Array'
      if (value.some((p: Pointer) => !(Boolean(p.key) && Boolean(p.id)))) {
        return 'Value must contains only object\'s like \'{key: "account_pubkey", id: "ak_lkamsflkalsdalksdlasdlasdlamd"}\''
      }
      if (value.length > 32) {
        return `Expected 32 pointers or less, got ${value.length} instead`
      }
  }
}

function transformParams (
  params: TxParamsCommon,
  schema: TxField[],
  { denomination }: {denomination?: AeAmountFormats} = {}
): any {
  params = schema
    .filter(([, t]) => t === FIELD_TYPES.amount)
    .reduce(
      (params: TxParamsCommon, [key]) => ({
        ...params,
        [key]: formatAmount(
          params[key as keyof TxParamsCommon], { denomination })
      }),
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
          acc[`${key}Type`] = Object.values(ORACLE_TTL_TYPES).indexOf(value.type)
          acc[`${key}Value`] = value.value
        }
        return acc
      },
      {}
    )
}

function getOracleRelativeTtl (params: any, txType: TxType): number {
  const ttlKeys = {
    [TX_TYPE.oracleRegister]: 'oracleTtl',
    [TX_TYPE.oracleExtend]: 'oracleTtl',
    [TX_TYPE.oracleQuery]: 'queryTtl',
    [TX_TYPE.oracleResponse]: 'responseTtl'
  } as const

  if (!isKeyOfObject(txType, ttlKeys)) return 1
  else {
    const ttlKey = ttlKeys[txType]
    if (params[`${ttlKey}Value`] > 0) return params[`${ttlKey}Value`]
    else return params[ttlKey].value
  }
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
export function calculateMinFee (
  txType: TxType,
  { params, vsn }: { params?: Object, vsn?: number }
): string {
  const multiplier = new BigNumber(1e9) // 10^9 GAS_PRICE
  if (params == null) {
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
 */
function buildFee (
  txType: TxType,
  { params, multiplier, vsn }: { params: TxParamsCommon, multiplier: BigNumber, vsn?: number }
): BigNumber {
  const { rlpEncoded: txWithOutFee } = buildTx({ ...params }, txType, { vsn })
  const txSize = txWithOutFee.length
  const txTypes = [TX_TYPE.gaMeta, TX_TYPE.payingFor] as const

  return TX_FEE_BASE_GAS(txType)
    .plus(TX_FEE_OTHER_GAS(txType, txSize, {
      relativeTtl: getOracleRelativeTtl(params, txType),
      innerTxSize: isKeyOfObject(txType, txTypes)
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
  fee: number | BigNumber | string = 0,
  txType: TxType,
  { params, showWarning = true, vsn }: {
    gasLimit?: number | string | BigNumber
    params?: TxSchema
    showWarning?: boolean
    vsn?: number
  } = {}
): number | string | BigNumber {
  if ((params == null) && showWarning) console.warn(`Can't build transaction fee, we will use DEFAULT_FEE(${DEFAULT_FEE})`)

  return fee > 0 ? fee : calculateMinFee(txType, { params, vsn })
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
  params: any, schema: TxField[], { excludeKeys = [] }: { excludeKeys: string[] }
): object {
  return Object.fromEntries(
    schema
      // TODO: allow optional keys in schema
      .filter(([key]) => !excludeKeys.includes(key) &&
        !['payload', 'nameFee', 'deposit', 'gasPrice'].includes(key))
      .map(([key, type, prefix]) => [key, validateField(params[key], type, prefix)])
      .filter(([, message]) => message)
  )
}

interface TxOptionsRaw {
  excludeKeys?: string[]
  denomination?: AeAmountFormats
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
  params: TxParamsCommon,
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
    .map(([key, fieldType]: [keyof TxSchema, string, EncodingType]) => serializeField(
      params[key], fieldType, params))
}

/**
 * Unpack binary transaction
 * @function
 * @alias module:@aeternity/aepp-sdk/es/tx/builder
 * @param binary Array with binary transaction field's
 * @param schema Transaction schema
 * @return Object with transaction field's
 */
export function unpackRawTx<Tx extends TxSchema> (
  binary: Uint8Array | NestedUint8Array,
  schema: TxField[]
): RawTxObject<Tx> {
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

export interface BuiltTx<Tx extends TxSchema, Prefix extends EncodingType> {
  tx: EncodedData<Prefix>
  rlpEncoded: Uint8Array
  binary: Uint8Array
  txObject: RawTxObject<Tx>
}

export type TxParamsBuild = TxParamsCommon & {
  denomination?: AeAmountFormats
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
export function buildTx<Prefix> (
  params: TxParamsBuild,
  type: TxType,
  { excludeKeys = [], prefix = 'tx', vsn, denomination = AE_AMOUNT_FORMATS.AETTOS }: {
    excludeKeys?: string[]
    prefix?: EncodingType
    vsn?: number
    denomination?: AeAmountFormats
  } = {}
): Prefix extends EncodingType
    ? BuiltTx<TxSchema, Prefix>
    : BuiltTx<TxSchema, 'tx'> {
  const schemas = TX_SERIALIZATION_SCHEMA[type]
  if (schemas == null) throw new UnexpectedTsError()

  vsn ??= Math.max(...Object.keys(schemas).map(a => +a))
  if (!isKeyOfObject(vsn, schemas)) throw new SchemaNotFoundError('serialization', type.toString(), vsn)

  const schema = schemas[vsn]

  const tags = Object.entries(OBJECT_ID_TX_TYPE).find(([, t]) => t === type)
  if (tags == null) { throw new UnexpectedTsError() }
  const tag = tags[0]
  const binary = buildRawTx(
    { ...params, VSN: vsn, tag },
    schema,
    { excludeKeys, denomination: params.denomination ?? denomination }
  ).filter(e => e !== undefined)

  const rlpEncoded = rlpEncode(binary)
  const tx = encode(rlpEncoded, prefix)
  return {
    tx,
    rlpEncoded,
    binary,
    txObject: unpackRawTx<TxTypeSchemas[TxType]>(binary, schema)
  } as any
}

export interface TxUnpacked<Tx extends TxSchema> {
  txType: TxType
  tx: RawTxObject<Tx>
  rlpEncoded: Uint8Array
  binary: Uint8Array | NestedUint8Array
}
/**
 * Unpack transaction hash
 * @function
 * @alias module:@aeternity/aepp-sdk/es/tx/builder
 * @param encodedTx String or RLP encoded transaction array
 * (if fromRlpBinary flag is true)
 * @param fromRlpBinary Unpack from RLP encoded transaction (default: false)
 * @returns object
 * @returns object.tx Object with transaction param's
 * @returns object.rlpEncoded rlp encoded transaction
 * @returns object.binary binary transaction
 */
export function unpackTx<TxType extends keyof TxTypeSchemas> (
  encodedTx: EncodedData<'tx'> | Uint8Array,
  { txType, fromRlpBinary = false }:
  { txType?: TxType, fromRlpBinary?: boolean } = {
    fromRlpBinary: false
  }
): TxUnpacked<TxTypeSchemas[TxType]> {
  const rlpEncoded = fromRlpBinary ? encodedTx as Uint8Array : decode(encodedTx as EncodedData<'tx'>)
  const binary = rlpDecode(rlpEncoded)
  const objId = readInt(binary[0] as Buffer) as unknown as keyof typeof TX_DESERIALIZATION_SCHEMA
  txType ??= OBJECT_ID_TX_TYPE[objId] as TxType
  const vsn = readInt(binary[1] as Buffer) as keyof typeof TX_DESERIALIZATION_SCHEMA[typeof objId]
  const schema = TX_DESERIALIZATION_SCHEMA[objId][vsn]
  if (schema == null) {
    throw new SchemaNotFoundError('deserialization', `tag ${objId}`, vsn)
  }
  return {
    txType,
    tx: unpackRawTx<TxTypeSchemas[typeof txType]>(binary, schema),
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
export function buildTxHash (rawTx: EncodedData<'tx'> | Uint8Array): string {
  const data = typeof rawTx === 'string' && rawTx.startsWith('tx_')
    ? decode(rawTx)
    : rawTx
  return encode(hash(data), 'th')
}

/**
 * Build a contract public key by contractCreateTx or gaAttach
 * @param  contractTx Transaction
 * @return Contract public key
 */
export function buildContractIdByContractTx (contractTx: EncodedData<'tx'>): EncodedData<'ct'> {
  const { txType, tx } = unpackTx(contractTx, { txType: TX_TYPE.contractCreate })
  if (![TX_TYPE.contractCreate, TX_TYPE.gaAttach].includes(txType as any)) {
    throw new ArgumentError('contractCreateTx', 'a contractCreateTx or gaAttach', txType)
  }
  return buildContractId(tx.ownerId, +tx.nonce)
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
