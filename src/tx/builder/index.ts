import {
  decode, encode, Encoded, Encoding,
} from '../../utils/encoder';
import { hash } from '../../utils/crypto';
import { Field } from './field-types';
import { txSchema } from './schema';
import { TxUnpacked, TxParams, TxParamsAsync } from './schema.generated';
import { Tag } from './constants';
import { buildContractId } from './helpers';
import { getSchema as getSchemaCommon, packRecord, unpackRecord } from './common';
import { ArgumentError } from '../../utils/errors';

/**
 * JavaScript-based Transaction builder
 */

export function getSchema(tag: Tag, version?: number): Array<[string, Field]> {
  return getSchemaCommon(txSchema, Tag, tag, version);
}

type TxEncoding = Encoding.Transaction | Encoding.Poi | Encoding.StateTrees
| Encoding.CallStateTree;

/**
 * Build transaction
 * @category transaction builder
 * @param params - Transaction params
 */
export function buildTx(params: TxParams): Encoded.Transaction;
/**
 * Build node entry with a custom encoding
 * @param params - Entry params
 * @param options - Options
 * @param options.prefix - Output encoding
 */
export function buildTx<E extends TxEncoding>(
  params: TxParams,
  { prefix }: { prefix: E },
): Encoded.Generic<E>;
export function buildTx(
  params: TxParams,
  { prefix }: { prefix?: TxEncoding } = {},
): Encoded.Generic<TxEncoding> {
  return packRecord(txSchema, Tag, params, {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    unpackTx,
    buildTx,
    rebuildTx: (overrideParams: any) => buildTx(
      { ...params, ...overrideParams },
    ),
  }, prefix ?? Encoding.Transaction);
}

export type BuildTxOptions <TxType extends Tag, OmitFields extends string> =
  Omit<TxParamsAsync & { tag: TxType }, 'tag' | OmitFields>;

/**
 * Build transaction async (may request node for additional data)
 * @category transaction builder
 * @param params - Transaction params
 * @returns tx_-encoded transaction
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
 * @param encodedTx - Encoded transaction
 * @param txType - Expected transaction type
 * @returns Transaction params
 */
export function unpackTx<TxType extends Tag>(
  encodedTx: Encoded.Generic<TxEncoding>,
  txType?: TxType,
): TxUnpacked & { tag: TxType } {
  return unpackRecord(txSchema, Tag, encodedTx, txType, {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    unpackTx,
  }) as any;
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
