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
  TxSchema,
  TxTypeSchemas,
  TxTypeSchemaBy,
  TxVersionsBy,
} from './schema';
import { Tag } from './constants';
import { buildContractId, readInt } from './helpers';
import { toBytes } from '../../utils/bytes';
import {
  ArgumentError,
  DecodeError,
  InvalidTxParamsError,
  SchemaNotFoundError,
} from '../../utils/errors';
import { isKeyOfObject } from '../../utils/other';

/**
 * JavaScript-based Transaction builder
 */

// SERIALIZE AND DESERIALIZE PART
function deserializeField(
  value: any,
  type: FIELD_TYPES | Field,
): any {
  if (value == null) return '';
  switch (type) {
    case FIELD_TYPES.ctVersion: {
      const [vm, , abi] = value;
      return {
        vmVersion: +readInt(Buffer.from([vm])),
        abiVersion: +readInt(Buffer.from([abi])),
      };
    }
    case FIELD_TYPES.bool:
      return value[0] === 1;
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
    case FIELD_TYPES.callStack:
      // TODO: fix this
      return [readInt(value)];
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
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      return type.deserialize(value, { unpackTx });
  }
}

function serializeField(value: any, type: FIELD_TYPES | Field, params: any): any {
  switch (type) {
    case FIELD_TYPES.bool:
      return Buffer.from([(value === true) ? 1 : 0]);
    case FIELD_TYPES.hex:
      return Buffer.from(value, 'hex');
    case FIELD_TYPES.signatures:
      return value.map(Buffer.from);
    case FIELD_TYPES.rlpBinary:
      if (ArrayBuffer.isView(value)) return value;
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      return decode(buildTx(value));
    case FIELD_TYPES.ctVersion:
      if (value.vmVersion == null || value.vmVersion == null) {
        throw new InvalidTxParamsError('`ctVersion` must be an object with `vmVersion` and `abiVersion` fields');
      }
      return Buffer.from([...toBytes(value.vmVersion), 0, ...toBytes(value.abiVersion)]);
    default:
      if (typeof type === 'number') return value;
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      return type.serialize(value, { ...params, unpackTx, buildTx });
  }
}

/**
 * Unpack binary transaction
 * @category transaction builder
 * @param binary - Array with binary transaction field's
 * @param schema - Transaction schema
 * @returns Object with transaction field's
 */
function unpackRawTx<Tx extends TxSchema>(
  binary: Uint8Array | NestedUint8Array,
  schema: TxField[],
): RawTxObject<Tx> {
  if (binary.length !== schema.length) {
    throw new ArgumentError('Transaction RLP length', schema.length, binary.length);
  }
  return schema
    .reduce<any>(
    (
      acc,
      [key, fieldType],
      index,
    ) => Object.assign(acc, { [key]: deserializeField(binary[index], fieldType) }),
    {},
  );
}

/**
 * Build transaction hash
 * @category transaction builder
 * @param params - Object with tx params
 * @param options - options
 * @param options.denomination - Denomination of amounts
 * @param options.prefix - Prefix of transaction
 * @throws {@link InvalidTxParamsError}
 * @returns object
 * @returns object.tx Base64Check transaction hash with 'tx_' prefix
 * @returns object.rlpEncoded rlp encoded transaction
 * @returns object.binary binary transaction
 */
export function buildTx<
  TxType extends Tag,
  E extends Encoding = Encoding.Transaction,
  Version extends TxVersionsBy<TxType> = TxVersionsBy<TxType>,
>(
  params: { tag: TxType; version?: Version } & Omit<TxTypeSchemaBy<TxType, Version>, 'tag' | 'version'>
  // TODO: get it from gas-limit.ts somehow
  & (TxType extends Tag.ContractCreateTx | Tag.ContractCallTx
  | Tag.ChannelOffChainUpdateCallContract | Tag.GaAttachTx | Tag.GaMetaTx
    ? { gasMax?: number } : {}),
  {
    prefix,
    denomination = AE_AMOUNT_FORMATS.AETTOS,
  }: {
    prefix?: E;
    denomination?: AE_AMOUNT_FORMATS;
  } = {},
): Encoded.Generic<E> {
  const schemas = TX_SCHEMA[params.tag];
  params.version ??= Math.max(...Object.keys(schemas).map((a) => +a)) as NonNullable<Version>;
  if (!isKeyOfObject(params.version, schemas)) {
    throw new SchemaNotFoundError('serialization', Tag[params.tag], params.version);
  }
  const schema = schemas[params.version] as unknown as TxField[];

  const binary = schema.map(([key, fieldType]: [keyof TxSchema, FIELD_TYPES | Field]) => (
    serializeField(
      params[key],
      fieldType,
      {
        ...params,
        denomination,
        rebuildTx: (overrideParams: any) => buildTx(
          { ...params, ...overrideParams },
          { denomination },
        ),
      },
    )
  ));

  // @ts-expect-error looks like a TypeScript edge case
  return encode(rlpEncode(binary), prefix ?? Encoding.Transaction);
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
): RawTxObject<TxTypeSchemas[TxType]> {
  const binary = rlpDecode(decode(encodedTx));
  const tag = +readInt(binary[0] as Buffer);
  if (!isKeyOfObject(tag, TX_SCHEMA)) throw new DecodeError(`Unknown transaction tag: ${tag}`);
  if (txType != null && txType !== tag) throw new DecodeError(`Expected transaction to have ${Tag[txType]} tag, got ${Tag[tag]} instead`);
  const version = +readInt(binary[1] as Buffer);
  if (!isKeyOfObject(version, TX_SCHEMA[tag])) throw new SchemaNotFoundError('deserialization', `tag ${tag}`, version);
  const schema = TX_SCHEMA[tag][version];
  return unpackRawTx<TxTypeSchemas[TxType]>(binary, schema);
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
  const { tag, ownerId, nonce } = unpackTx<Tag.ContractCreateTx | Tag.GaAttachTx>(contractTx);
  if (![Tag.ContractCreateTx, Tag.GaAttachTx].includes(tag)) {
    throw new ArgumentError('contractCreateTx', 'a contractCreateTx or gaAttach', tag);
  }
  return buildContractId(ownerId, +nonce);
}
