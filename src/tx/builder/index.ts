import { decode as rlpDecode, encode as rlpEncode } from 'rlp';
import {
  decode, encode, Encoded, Encoding,
} from '../../utils/encoder';
import { AE_AMOUNT_FORMATS } from '../../utils/amount-formatter';
import { hash } from '../../utils/crypto';
import { BinaryData, Field } from './field-types';
import {
  RawTxObject, TX_SCHEMA, TxField, TxSchema, TxTypeSchemas,
} from './schema';
import { Tag } from './constants';
import { buildContractId, readInt } from './helpers';
import { ArgumentError, DecodeError, SchemaNotFoundError } from '../../utils/errors';
import { isKeyOfObject } from '../../utils/other';

/**
 * JavaScript-based Transaction builder
 */

/**
 * Build transaction hash
 * @category transaction builder
 * @param params - Object with tx params
 * @param options - options
 * @param options.denomination - Denomination of amounts
 * @param options.prefix - Prefix of transaction
 * @throws {@link InvalidTxParamsError}
 * @returns object Base64Check transaction hash with 'tx_' prefix
 */
export function buildTx<
  TxType extends Tag,
  E extends Encoding = Encoding.Transaction,
>(
  params: { tag: TxType; version?: number } & Omit<TxTypeSchemas[TxType], 'tag' | 'version'>
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
  params.version ??= Math.max(...Object.keys(schemas).map((a) => +a));
  if (!isKeyOfObject(params.version, schemas)) {
    throw new SchemaNotFoundError('serialization', Tag[params.tag], params.version);
  }
  const schema = schemas[params.version] as unknown as TxField[];

  const binary = schema.map(([key, field]: [keyof TxSchema, Field]) => (
    field.serialize(
      params[key],
      {
        ...params,
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        unpackTx,
        buildTx,
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
 * Unpack transaction encoded as string
 * @category transaction builder
 * @param encodedTx - Transaction to unpack
 * @param txType - Expected transaction type
 * @returns Object with transaction param's
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
  const schemas = TX_SCHEMA[tag];
  if (!isKeyOfObject(version, schemas)) throw new SchemaNotFoundError('deserialization', `tag ${tag}`, version);
  const schema = schemas[version] as TxField[];
  if (binary.length !== schema.length) {
    throw new ArgumentError('Transaction RLP length', schema.length, binary.length);
  }
  return schema.reduce<any>(
    (acc, [name, field], index) => {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      const deserialized = field.deserialize(binary[index] as BinaryData, { unpackTx });
      return { ...acc, [name]: deserialized };
    },
    {},
  ) as any;
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
  const params = unpackTx(contractTx);
  if (Tag.ContractCreateTx !== params.tag && Tag.GaAttachTx !== params.tag) {
    throw new ArgumentError('contractTx', 'a contractCreateTx or gaAttach', params.tag);
  }
  return buildContractId(params.ownerId, params.nonce);
}
