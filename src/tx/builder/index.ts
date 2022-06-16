import { EncodedData, EncodingType } from './../../utils/encoder'
import BigNumber from 'bignumber.js'
import { decode as rlpDecode, encode as rlpEncode, NestedUint8Array } from 'rlp'
import { AE_AMOUNT_FORMATS, formatAmount } from '../../utils/amount-formatter'
import { hash } from '../../utils/crypto'
import { Field } from './field-types'

import {
  DEFAULT_FEE,
  FIELD_TYPES,
  RawTxObject,
  TxField,
  TxTypeSchemas,
  TxParamsCommon,
  TX_FEE_BASE_GAS,
  TX_FEE_OTHER_GAS,
  TX_SCHEMA,
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
import { ArgumentError, InvalidTxParamsError, SchemaNotFoundError, DecodeError } from '../../utils/errors'
import { isKeyOfObject } from '../../utils/other'

/**
 * JavaScript-based Transaction builder
 */

// SERIALIZE AND DESERIALIZE PART
function deserializeField (
  value: any,
  type: FIELD_TYPES | typeof Field,
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
    case FIELD_TYPES.abiVersion:
    case FIELD_TYPES.ttlType:
      return readInt(value)
    case FIELD_TYPES.shortInt:
      return +readInt(value)
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
      return unpackTx(encode(value, 'tx'))
    case FIELD_TYPES.rlpBinaries:
      return value.map((v: Buffer) => unpackTx(encode(v, 'tx')))
    case FIELD_TYPES.rawBinary:
      return value
    case FIELD_TYPES.hex:
      return value.toString('hex')
    case FIELD_TYPES.offChainUpdates:
      return value.map((v: Buffer) => unpackTx(encode(v, 'tx')))
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
  value: any, type: FIELD_TYPES | typeof Field, params: any
): any {
  switch (type) {
    case FIELD_TYPES.amount:
    case FIELD_TYPES.int:
    case FIELD_TYPES.shortInt:
    case FIELD_TYPES.abiVersion:
    case FIELD_TYPES.ttlType:
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
  type: FIELD_TYPES | typeof Field,
  prefix?: EncodingType | EncodingType[]
): string | undefined {
  // All fields are required
  if (value == null) return 'Field is required'

  // Validate type of value
  switch (type) {
    case FIELD_TYPES.amount:
    case FIELD_TYPES.int:
    case FIELD_TYPES.shortInt: {
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
  { denomination }: {denomination?: AE_AMOUNT_FORMATS} = {}
): any {
  params = schema
    .filter(([, t]) => t === FIELD_TYPES.amount)
    .reduce(
      (params: TxParamsCommon, [key]) => ({
        ...params,
        [key]: formatAmount(params[key as keyof TxParamsCommon], { denomination })
      }),
      params
    )
  return params
}

function getOracleRelativeTtl (params: any, txType: TX_TYPE): number {
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
 * @param txType - Transaction type
 * @param options - Options object
 * @param options.gasLimit
 * @param options.params - Tx params
 * @example
 * ```js
 * calculateMinFee('spendTx', { gasLimit, params })
 * ```
 */
export function calculateMinFee (
  txType: TX_TYPE,
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
 */
function buildFee (
  txType: TX_TYPE,
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
 * @param fee - fee
 * @param txType - Transaction type
 * @param options - Options object
 * @param options.gasLimit
 * @param options.params - Tx params
 */
export function calculateFee (
  fee: number | BigNumber | string = 0,
  txType: TX_TYPE,
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
 * @param params - Object with tx params
 * @param schema - Transaction schema
 * @param excludeKeys - Array of keys to exclude for validation
 * @returns Object with validation errors
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

/**
 * Unpack binary transaction
 * @param binary - Array with binary transaction field's
 * @param schema - Transaction schema
 * @returns Object with transaction field's
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

/**
 * Build transaction hash
 * @param _params - Object with tx params
 * @param type - Transaction type
 * @param options - options
 * @param options.excludeKeys - Array of keys to exclude for validation and build
 * @param options.denomination - Denomination of amounts
 * @param options.prefix - Prefix of transaction
 * @throws {@link InvalidTxParamsError}
 * @returns object
 * @returns object.tx Base64Check transaction hash with 'tx_' prefix
 * @returns object.rlpEncoded rlp encoded transaction
 * @returns object.binary binary transaction
 */
export function buildTx<TxType extends TX_TYPE, Prefix> (
  _params: Omit<TxTypeSchemas[TxType], 'tag' | 'VSN'> & { VSN?: number },
  type: TxType,
  { excludeKeys = [], prefix = 'tx', vsn, denomination = AE_AMOUNT_FORMATS.AETTOS }: {
    excludeKeys?: string[]
    prefix?: EncodingType
    vsn?: number
    denomination?: AE_AMOUNT_FORMATS
  } = {}
): BuiltTx<TxSchema, Prefix extends EncodingType ? Prefix : 'tx'> {
  const schemas = TX_SCHEMA[type]

  vsn ??= Math.max(...Object.keys(schemas).map(a => +a))
  if (!isKeyOfObject(vsn, schemas)) throw new SchemaNotFoundError('serialization', TX_TYPE[type], vsn)

  const schema = schemas[vsn] as unknown as TxField[]

  let params = _params as TxParamsCommon & { onNode: Node }
  params.VSN = vsn
  params.tag = type
  const filteredSchema = schema.filter(([key]) => !excludeKeys.includes(key))

  // Transform `amount` type fields to `aettos`
  params = transformParams(params, filteredSchema, { denomination })
  // Validation
  const valid = validateParams(params, schema, { excludeKeys })
  if (Object.keys(valid).length > 0) {
    throw new InvalidTxParamsError('Transaction build error. ' + JSON.stringify(valid))
  }

  const binary = filteredSchema
    .map(([key, fieldType]: [keyof TxSchema, FIELD_TYPES, EncodingType]) => serializeField(
      params[key], fieldType, params))
    .filter(e => e !== undefined)

  const rlpEncoded = rlpEncode(binary)
  const tx = encode(rlpEncoded, prefix)
  return {
    tx,
    rlpEncoded,
    binary,
    txObject: unpackRawTx<TxTypeSchemas[TX_TYPE]>(binary, schema)
  } as any
}

export interface TxUnpacked<Tx extends TxSchema> {
  txType: TX_TYPE
  tx: RawTxObject<Tx>
  rlpEncoded: Uint8Array
}
/**
 * Unpack transaction hash
 * @param encodedTx - Transaction to unpack
 * @param txType - Expected transaction type
 * @returns object
 * @returns object.tx Object with transaction param's
 * @returns object.txType Transaction type
 */
export function unpackTx<TxType extends TX_TYPE> (
  encodedTx: EncodedData<'tx' | 'pi'>, txType?: TxType
): TxUnpacked<TxTypeSchemas[TxType]> {
  const rlpEncoded = decode(encodedTx)
  const binary = rlpDecode(rlpEncoded)
  const objId = +readInt(binary[0] as Buffer)
  if (!isKeyOfObject(objId, TX_SCHEMA)) throw new DecodeError(`Unknown transaction tag: ${objId}`)
  if (txType != null && txType !== objId) throw new DecodeError(`Expected transaction to have ${TX_TYPE[txType]} tag, got ${TX_TYPE[objId]} instead`)
  const vsn = +readInt(binary[1] as Buffer)
  if (!isKeyOfObject(vsn, TX_SCHEMA[objId])) throw new SchemaNotFoundError('deserialization', `tag ${objId}`, vsn)
  const schema = TX_SCHEMA[objId][vsn]
  return {
    txType: objId,
    tx: unpackRawTx<TxTypeSchemas[TxType]>(binary, schema),
    rlpEncoded
  }
}

/**
 * Build a transaction hash
 * @param rawTx - base64 or rlp encoded transaction
 * @returns Transaction hash
 */
export function buildTxHash (rawTx: EncodedData<'tx'> | Uint8Array): EncodedData<'th'> {
  const data = typeof rawTx === 'string' && rawTx.startsWith('tx_')
    ? decode(rawTx)
    : rawTx
  return encode(hash(data), 'th')
}

/**
 * Build a contract public key by contractCreateTx or gaAttach
 * @param contractTx - Transaction
 * @returns Contract public key
 */
export function buildContractIdByContractTx (contractTx: EncodedData<'tx'>): EncodedData<'ct'> {
  const { txType, tx } = unpackTx<TX_TYPE.contractCreate | TX_TYPE.gaAttach>(contractTx)
  if (![TX_TYPE.contractCreate, TX_TYPE.gaAttach].includes(txType)) {
    throw new ArgumentError('contractCreateTx', 'a contractCreateTx or gaAttach', txType)
  }
  return buildContractId(tx.ownerId, +tx.nonce)
}
