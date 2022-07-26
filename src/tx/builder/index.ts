import { decode as rlpDecode, encode as rlpEncode, NestedUint8Array } from 'rlp';
import {
  decode, encode, Encoded, Encoding,
} from '../../utils/encoder';
import { AE_AMOUNT_FORMATS } from '../../utils/amount-formatter';
import { hash } from '../../utils/crypto';
import { Field } from './field-types';
import {
  FIELD_TYPES,
  RawTxObject,
  TX_SCHEMA,
  TxField,
  TxParamsCommon,
  TxSchema,
  TxTypeSchemas,
} from './schema';
import { Tag } from './constants';
import {
  buildContractId, buildPointers, readInt, readPointers, writeInt,
} from './helpers';
import { readId, writeId } from './address';
import { toBytes } from '../../utils/bytes';
import MPTree, { MPTreeBinary } from '../../utils/mptree';
import {
  ArgumentError,
  DecodeError,
  InvalidTxParamsError,
  SchemaNotFoundError,
} from '../../utils/errors';
import { isKeyOfObject } from '../../utils/other';
import { NamePointer } from '../../apis/node';

/**
 * JavaScript-based Transaction builder
 */

// SERIALIZE AND DESERIALIZE PART
function deserializeField(
  value: any,
  type: FIELD_TYPES | Field,
  prefix?: Encoding | Encoding[],
): any {
  if (value == null) return '';
  switch (type) {
    case FIELD_TYPES.ctVersion: {
      const [vm, , abi] = value;
      return {
        vmVersion: readInt(Buffer.from([vm])),
        abiVersion: readInt(Buffer.from([abi])),
      };
    }
    case FIELD_TYPES.abiVersion:
    case FIELD_TYPES.ttlType:
      return readInt(value);
    case FIELD_TYPES.id:
      return readId(value);
    case FIELD_TYPES.ids:
      return value.map(readId);
    case FIELD_TYPES.bool:
      return value[0] === 1;
    case FIELD_TYPES.binary:
      return encode(value, prefix as Encoding);
    case FIELD_TYPES.stateTree:
      return encode(value, Encoding.StateTrees);
    case FIELD_TYPES.string:
      return value.toString();
    case FIELD_TYPES.payload:
      return encode(value, Encoding.Bytearray);
    case FIELD_TYPES.pointers:
      return readPointers(value);
    case FIELD_TYPES.rlpBinary:
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      return unpackTx(encode(value, Encoding.Transaction));
    case FIELD_TYPES.rlpBinaries:
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      return value.map((v: Buffer) => unpackTx(encode(v, Encoding.Transaction)));
    case FIELD_TYPES.rawBinary:
      return value;
    case FIELD_TYPES.hex:
      return value.toString('hex');
    case FIELD_TYPES.offChainUpdates:
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      return value.map((v: Buffer) => unpackTx(encode(v, Encoding.Transaction)));
    case FIELD_TYPES.callStack:
      // TODO: fix this
      return [readInt(value)];
    case FIELD_TYPES.mptrees:
      return value.map((t: MPTreeBinary) => new MPTree(t));
    case FIELD_TYPES.callReturnType:
      switch (readInt(value)) {
        case '0':
          return 'ok';
        case '1':
          return 'error';
        case '2':
          return 'revert';
        default:
          return value;
      }
    case FIELD_TYPES.sophiaCodeTypeInfo:
      return value.reduce(
        (acc: object, [funHash, fnName, argType, outType]: [
          funHash: Buffer,
          fnName: string,
          argType: string,
          outType: string,
        ]) => ({
          ...acc,
          [fnName.toString()]: { funHash, argType, outType },
        }),
        {},
      );
    default:
      if (typeof type === 'number') return value;
      return type.deserialize(value);
  }
}

function serializeField(value: any, type: FIELD_TYPES | Field, params: any): any {
  switch (type) {
    case FIELD_TYPES.abiVersion:
    case FIELD_TYPES.ttlType:
      return writeInt(value);
    case FIELD_TYPES.id:
      return writeId(value);
    case FIELD_TYPES.ids:
      return value.map(writeId);
    case FIELD_TYPES.bool:
      return Buffer.from([(value === true) ? 1 : 0]);
    case FIELD_TYPES.binary:
      return decode(value);
    case FIELD_TYPES.stateTree:
      return decode(value);
    case FIELD_TYPES.hex:
      return Buffer.from(value, 'hex');
    case FIELD_TYPES.signatures:
      return value.map(Buffer.from);
    case FIELD_TYPES.payload:
      return typeof value === 'string' && value.split('_')[0] === 'ba'
        ? decode(value as Encoded.Bytearray)
        : toBytes(value);
    case FIELD_TYPES.string:
      return toBytes(value);
    case FIELD_TYPES.pointers:
      return buildPointers(value);
    case FIELD_TYPES.rlpBinary:
      return value.rlpEncoded ?? value;
    case FIELD_TYPES.mptrees:
      return value.map((t: MPTree) => t.serialize());
    case FIELD_TYPES.ctVersion:
      return Buffer.from([...toBytes(value.vmVersion), 0, ...toBytes(value.abiVersion)]);
    case FIELD_TYPES.callReturnType:
      switch (value) {
        case 'ok': return writeInt(0);
        case 'error': return writeInt(1);
        case 'revert': return writeInt(2);
        default: return value;
      }
    default:
      if (typeof type === 'number') return value;
      // @ts-expect-error will be solved after removing the whole serializeField function
      return type.serialize(value, params);
  }
}

function validateField(
  value: any,
  type: FIELD_TYPES | Field,
  prefix?: Encoding | Encoding[],
): string | undefined {
  // All fields are required
  if (value == null) return 'Field is required';

  // Validate type of value
  switch (type) {
    case FIELD_TYPES.id: {
      const prefixes = Array.isArray(prefix) ? prefix : [prefix];
      if (!prefixes.includes(value.split('_')[0])) {
        if (prefix == null) { return `'${String(value)}' prefix doesn't exist'`; }
        return `'${String(value)}' prefix doesn't match expected prefix '${prefix.toString()}'`;
      }
      return undefined;
    }
    case FIELD_TYPES.ctVersion:
      if (!(Boolean(value.abiVersion) && Boolean(value.vmVersion))) {
        return 'Value must be an object with "vmVersion" and "abiVersion" fields';
      }
      return undefined;
    case FIELD_TYPES.pointers:
      if (!Array.isArray(value)) return 'Value must be of type Array';
      if (value.some((p: NamePointer) => !(Boolean(p.key) && Boolean(p.id)))) {
        return 'Value must contains only object\'s like \'{key: "account_pubkey", id: "ak_lkamsflkalsdalksdlasdlasdlamd"}\'';
      }
      if (value.length > 32) {
        return `Expected 32 pointers or less, got ${value.length} instead`;
      }
      return undefined;
    default:
      return undefined;
  }
}

/**
 * Validate transaction params
 * @category transaction builder
 * @param params - Object with tx params
 * @param schema - Transaction schema
 * @param excludeKeys - Array of keys to exclude for validation
 * @returns Object with validation errors
 */
export function validateParams(
  params: any,
  schema: TxField[],
  { excludeKeys = [] }: { excludeKeys: string[] },
): object {
  return Object.fromEntries(
    schema
      // TODO: allow optional keys in schema
      .filter(([key]) => !excludeKeys.includes(key)
        && !['payload', 'nameFee', 'deposit', 'gasPrice', 'fee', 'gasLimit'].includes(key))
      .map(([key, type, prefix]) => [key, validateField(params[key], type, prefix)])
      .filter(([, message]) => message),
  );
}

/**
 * Unpack binary transaction
 * @category transaction builder
 * @param binary - Array with binary transaction field's
 * @param schema - Transaction schema
 * @returns Object with transaction field's
 */
export function unpackRawTx<Tx extends TxSchema>(
  binary: Uint8Array | NestedUint8Array,
  schema: TxField[],
): RawTxObject<Tx> {
  return schema
    .reduce<any>(
    (
      acc,
      [key, fieldType, prefix],
      index,
    ) => Object.assign(acc, { [key]: deserializeField(binary[index], fieldType, prefix) }),
    {},
  );
}

/**
 * @category transaction builder
 */
export interface BuiltTx<Tx extends TxSchema, Prefix extends Encoding> {
  tx: Encoded.Generic<Prefix>;
  rlpEncoded: Uint8Array;
  binary: Uint8Array;
  txObject: RawTxObject<Tx>;
}

/**
 * Build transaction hash
 * @category transaction builder
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
export function buildTx<TxType extends Tag, Prefix>(
  _params: Omit<TxTypeSchemas[TxType], 'tag' | 'VSN'> & { VSN?: number },
  type: TxType,
  {
    excludeKeys = [],
    prefix = Encoding.Transaction,
    vsn,
    denomination = AE_AMOUNT_FORMATS.AETTOS,
  }: {
    excludeKeys?: string[];
    prefix?: Encoding;
    vsn?: number;
    denomination?: AE_AMOUNT_FORMATS;
  } = {},
): BuiltTx<TxSchema, Prefix extends Encoding ? Prefix : Encoding.Transaction> {
  const schemas = TX_SCHEMA[type];

  vsn ??= Math.max(...Object.keys(schemas).map((a) => +a));
  if (!isKeyOfObject(vsn, schemas)) throw new SchemaNotFoundError('serialization', Tag[type], vsn);

  const schema = schemas[vsn] as unknown as TxField[];

  const params = _params as TxParamsCommon & { onNode: Node; denomination?: AE_AMOUNT_FORMATS };
  params.VSN = vsn;
  params.tag = type;
  params.denomination = denomination;
  const filteredSchema = schema.filter(([key]) => !excludeKeys.includes(key));

  // Validation
  const valid = validateParams(params, schema, { excludeKeys });
  if (Object.keys(valid).length > 0) {
    throw new InvalidTxParamsError(`Transaction build error. ${JSON.stringify(valid)}`);
  }

  const binary = filteredSchema
    .map(([key, fieldType]: [keyof TxSchema, FIELD_TYPES, Encoding]) => (
      serializeField(
        params[key],
        fieldType,
        {
          ...params,
          txType: type,
          rebuildTx: (overrideParams: any) => buildTx(
            { ...params, ...overrideParams },
            type,
            {
              excludeKeys, prefix: Encoding.Transaction, vsn, denomination,
            },
          ),
        },
      )
    ))
    .filter((e) => e !== undefined);

  const rlpEncoded = rlpEncode(binary);
  const tx = encode(rlpEncoded, prefix);
  return {
    tx,
    rlpEncoded,
    binary,
    txObject: unpackRawTx<TxTypeSchemas[Tag]>(binary, schema),
  } as any;
}

/**
 * @category transaction builder
 */
export interface TxUnpacked<Tx extends TxSchema> {
  txType: Tag;
  tx: RawTxObject<Tx>;
  rlpEncoded: Uint8Array;
}
/**
 * Unpack transaction hash
 * @category transaction builder
 * @param encodedTx - Transaction to unpack
 * @param txType - Expected transaction type
 * @returns object
 * @returns object.tx Object with transaction param's
 * @returns object.txType Transaction type
 */
export function unpackTx<TxType extends Tag>(
  encodedTx: Encoded.Transaction | Encoded.Poi,
  txType?: TxType,
): TxUnpacked<TxTypeSchemas[TxType]> {
  const rlpEncoded = decode(encodedTx);
  const binary = rlpDecode(rlpEncoded);
  const objId = +readInt(binary[0] as Buffer);
  if (!isKeyOfObject(objId, TX_SCHEMA)) throw new DecodeError(`Unknown transaction tag: ${objId}`);
  if (txType != null && txType !== objId) throw new DecodeError(`Expected transaction to have ${Tag[txType]} tag, got ${Tag[objId]} instead`);
  const vsn = +readInt(binary[1] as Buffer);
  if (!isKeyOfObject(vsn, TX_SCHEMA[objId])) throw new SchemaNotFoundError('deserialization', `tag ${objId}`, vsn);
  const schema = TX_SCHEMA[objId][vsn];
  return {
    txType: objId,
    tx: unpackRawTx<TxTypeSchemas[TxType]>(binary, schema),
    rlpEncoded,
  };
}

/**
 * Build a transaction hash
 * @category transaction builder
 * @param rawTx - base64 or rlp encoded transaction
 * @returns Transaction hash
 */
export function buildTxHash(rawTx: Encoded.Transaction | Uint8Array): Encoded.TxHash {
  const data = typeof rawTx === 'string' && rawTx.startsWith('tx_')
    ? decode(rawTx)
    : rawTx;
  return encode(hash(data), Encoding.TxHash);
}

/**
 * Build a contract public key by contractCreateTx or gaAttach
 * @category contract
 * @param contractTx - Transaction
 * @returns Contract public key
 */
export function buildContractIdByContractTx(
  contractTx: Encoded.Transaction,
): Encoded.ContractAddress {
  const { txType, tx } = unpackTx<Tag.ContractCreateTx | Tag.GaAttachTx>(contractTx);
  if (![Tag.ContractCreateTx, Tag.GaAttachTx].includes(txType)) {
    throw new ArgumentError('contractCreateTx', 'a contractCreateTx or gaAttach', txType);
  }
  return buildContractId(tx.ownerId, +tx.nonce);
}
