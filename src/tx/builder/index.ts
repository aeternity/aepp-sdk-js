import { decode as rlpDecode, encode as rlpEncode } from 'rlp';
import {
  decode, encode, Encoded, Encoding,
} from '../../utils/encoder';
import { hash } from '../../utils/crypto';
import { BinaryData } from './field-types';
import {
  txSchema, TxField, TxUnpacked, TxParams, TxParamsAsync,
} from './schema';
import { Tag } from './constants';
import { buildContractId, readInt } from './helpers';
import { ArgumentError, DecodeError, SchemaNotFoundError } from '../../utils/errors';
import { isKeyOfObject } from '../../utils/other';

/**
 * JavaScript-based Transaction builder
 */

function getSchema(tag: Tag, version?: number): TxField[] {
  const schemas = txSchema[tag];
  if (schemas == null) throw new SchemaNotFoundError(`${Tag[tag]} (${tag})`, 0);
  version ??= Math.max(...Object.keys(schemas).map((a) => +a));
  if (!isKeyOfObject(version, schemas)) {
    throw new SchemaNotFoundError(`${Tag[tag]} (${tag})`, version);
  }
  return schemas[version];
}

/**
 * Build transaction hash
 * @category transaction builder
 * @param params - Object with tx params
 * @param options - options
 * @param options.prefix - Prefix of transaction
 * @returns object Base64Check transaction hash with 'tx_' prefix
 */
export function buildTx<
  E extends Encoding = Encoding.Transaction,
>(
  params: TxParams,
  {
    prefix,
  }: {
    prefix?: E;
  } = {},
): Encoded.Generic<E> {
  const schema = getSchema(params.tag, params.version);

  const binary = schema.map(([key, field]) => (
    field.serialize(
      // @ts-expect-error the type of `params[key]` can't be determined accurately
      params[key],
      {
        ...params,
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        unpackTx,
        buildTx,
        rebuildTx: (overrideParams: any) => buildTx(
          { ...params, ...overrideParams },
        ),
      },
      params,
    )
  ));

  // @ts-expect-error looks like a TypeScript edge case
  return encode(rlpEncode(binary), prefix ?? Encoding.Transaction);
}

export type BuildTxOptions <TxType extends Tag, OmitFields extends string> =
  Omit<TxParamsAsync & { tag: TxType }, 'tag' | OmitFields>;

/**
 * @category transaction builder
 */
export async function buildTxAsync(params: TxParamsAsync): Promise<Encoded.Transaction> {
  await Promise.all(
    getSchema(params.tag, params.version)
      .map(async ([key, field]) => {
        if (field.prepare == null) return;
        // @ts-expect-error the type of `params[key]` can't be determined accurately
        params[key] = await field.prepare(params[key], params, params);
      }),
  );

  // @ts-expect-error after preparation properties should be compatible with sync tx builder
  return buildTx(params);
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
): TxUnpacked & { tag: TxType } {
  const binary = rlpDecode(decode(encodedTx));
  const tag = +readInt(binary[0] as Buffer);
  const version = +readInt(binary[1] as Buffer);
  const schema = getSchema(tag, version);
  if (txType != null && txType !== tag) throw new DecodeError(`Expected transaction to have ${Tag[txType]} tag, got ${Tag[tag]} instead`);
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
