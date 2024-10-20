import { decode, encode, Encoded, Encoding } from '../../utils/encoder.js';
import { hash } from '../../utils/crypto.js';
import { Field } from './field-types/interface.js';
import { txSchema } from './schema.js';
import { TxUnpacked, TxParams, TxParamsAsync } from './schema.generated.js';
import { Tag } from './constants.js';
import { buildContractId } from './helpers.js';
import { getSchema as getSchemaCommon, packRecord, unpackRecord } from './common.js';
import { ArgumentError } from '../../utils/errors.js';
import { packEntry, unpackEntry } from './entry/index.js';

/**
 * JavaScript-based Transaction builder
 */

export function getSchema(tag: Tag, version?: number): Array<[string, Field]> {
  return getSchemaCommon(txSchema, Tag, tag, version);
}

type TxEncoding =
  | Encoding.Transaction
  | Encoding.Poi
  | Encoding.StateTrees
  | Encoding.CallStateTree;

/**
 * Build transaction
 * @category transaction builder
 * @param params - Transaction params
 */
export function buildTx(params: TxParams): Encoded.Transaction {
  return packRecord(
    txSchema,
    Tag,
    params,
    {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      unpackTx,
      buildTx,
      rebuildTx: (overrideParams: any) => buildTx({ ...params, ...overrideParams }),
      packEntry,
    },
    Encoding.Transaction,
  );
}

export type BuildTxOptions<TxType extends Tag, OmitFields extends string> = Omit<
  TxParamsAsync & { tag: TxType },
  'tag' | OmitFields
>;

// TODO: require onNode because it is the only reason this builder is async [breaking change]
/**
 * Build transaction async (may request node for additional data)
 * @category transaction builder
 * @param params - Transaction params
 * @returns tx_-encoded transaction
 */
export async function buildTxAsync(params: TxParamsAsync): Promise<Encoded.Transaction> {
  await Promise.all(
    getSchema(params.tag, params.version).map(async ([key, field]) => {
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
  return unpackRecord(txSchema, Tag, encodedTx, txType, { unpackTx, unpackEntry }) as any;
}

/**
 * Build a transaction hash
 * @category transaction builder
 * @param rawTx - base64 or rlp encoded transaction
 * @returns Transaction hash
 */
export function buildTxHash(rawTx: Encoded.Transaction | Uint8Array): Encoded.TxHash {
  const data = typeof rawTx === 'string' && rawTx.startsWith('tx_') ? decode(rawTx) : rawTx;
  return encode(hash(data), Encoding.TxHash);
}

/**
 * Build a contract public key by contractCreateTx, gaAttach or signedTx
 * @category contract
 * @param contractTx - Transaction
 * @returns Contract public key
 */
export function buildContractIdByContractTx(
  contractTx: Encoded.Transaction,
): Encoded.ContractAddress {
  let params = unpackTx(contractTx);
  if (Tag.SignedTx === params.tag) params = params.encodedTx;
  if (Tag.ContractCreateTx !== params.tag && Tag.GaAttachTx !== params.tag) {
    throw new ArgumentError('contractTx', 'a contractCreateTx or gaAttach', params.tag);
  }
  return buildContractId(params.ownerId, params.nonce);
}
