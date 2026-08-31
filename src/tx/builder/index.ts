import { decode, encode, Encoded, Encoding } from '../../utils/encoder.js';
import { hash } from '../../utils/crypto.js';
import { Field, serializeAsIsParam } from './field-types/interface.js';
import { txSchema } from './schema.js';
import { TxUnpacked, TxParams, TxParamsAsync } from './schema.generated.js';
import { Tag } from './constants.js';
import { buildContractId } from './helpers.js';
import { getSchema as getSchemaCommon, packRecord, unpackRecord } from './common.js';
import { ArgumentError } from '../../utils/errors.js';
import { packEntry, unpackEntry } from './entry/index.js';
import {
  checkParametersUsable,
  getCachedProtocolParameters,
  ProtocolParameters,
  ProtocolParametersOption,
} from './protocol-parameters.js';
import { unwrapProxyIfPossible } from '../../utils/wrap-proxy.js';
import type Node from '../../Node.js';

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
  // as trusted as `fee` is, see `checkParametersUsable`
  const { protocolParameters } = params as ProtocolParametersOption;
  if (protocolParameters != null) checkParametersUsable(protocolParameters);
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

/**
 * Serializes a transaction that already exists — the result of an `unpackTx` — back to its
 * `tx_`-encoded form.
 *
 * Use it instead of `buildTx` for a round trip. The values of such a transaction are fixed, and
 * belong to the protocol parameters of the node it was built for: a node running a lower minimum
 * gas price than the SDK release, a hyperchain or a devnet, produces a transaction that plain
 * `buildTx` would refuse to serialize again because its fee is below the minimum this process
 * computes. Nothing about it can be changed by re-serializing it, so nothing about it is checked.
 * @category transaction builder
 * @param params - Unpacked transaction, as returned by `unpackTx`
 */
export function rebuildUnpackedTx(params: TxUnpacked): Encoded.Transaction {
  return buildTx({ ...params, [serializeAsIsParam]: true } as unknown as TxParams);
}

export type BuildTxOptions<TxType extends Tag, OmitFields extends string> = Omit<
  TxParamsAsync & { tag: TxType },
  'tag' | OmitFields
>;

// the fields the protocol parameters price
const parametrizedFields = ['fee', 'gasPrice', 'gasLimit'];

/**
 * The parameters are needed to compute a priced value the caller didn't provide, and to check one
 * it did against what node accepts. A build that provides every priced field of its type, and
 * nests no transaction that still has to be built, serializes to the same bytes with or without
 * them — requesting them would turn a build that needs no node into one that waits for it, as it
 * would for a caller that passes `fee` exactly to avoid the round trip.
 */
function needsProtocolParameters(schema: Array<[string, Field]>, params: TxParamsAsync): boolean {
  return schema.some(([key, field]) => {
    const value = (params as unknown as Record<string, unknown>)[key];
    if (parametrizedFields.includes(key)) return value == null;
    // a nested transaction that is neither built (`tx_`) nor serialized (a buffer) yet is built
    // here, and priced by these parameters in turn
    if (field.nestedTransaction !== true) return false;
    if (value == null || typeof value === 'string' || ArrayBuffer.isView(value)) return false;
    // it is built here, but that doesn't mean anything in it is priced — the `SignedTx` wrapping
    // an already serialized transaction that `AccountGeneralized` nests in its `GaMetaTx` has no
    // priced field of its own
    const nested = value as TxParamsAsync;
    let nestedSchema;
    try {
      nestedSchema = getSchema(nested.tag, nested.version);
    } catch {
      // an unknown tag or version fails later in `buildTx` with a better message than here
      return true;
    }
    return needsProtocolParameters(nestedSchema, nested);
  });
}

// TODO: require onNode because it is the only reason this builder is async [breaking change]
/**
 * Build transaction async (may request node for additional data)
 * @category transaction builder
 * @param params - Transaction params
 * @returns tx_-encoded transaction
 */
export async function buildTxAsync(params: TxParamsAsync): Promise<Encoded.Transaction> {
  // the caller may build another transaction out of the same object, and `prepare` writing the
  // value it computed back would make the next build reuse them — the same nonce above all, and a
  // `fee` that makes it skip the request for the parameters that priced this one
  const paramsCopy = { ...params };
  const { onNode } = paramsCopy as { onNode?: Node };
  const target = paramsCopy as { protocolParameters?: ProtocolParameters };
  const schema = getSchema(paramsCopy.tag, paramsCopy.version);
  // `onNode` of an sdk instance is a proxy that is not `null` even when no node is selected, and
  // dereferencing it throws — a transaction that needs no node is still buildable in that case
  const node = onNode != null ? unwrapProxyIfPossible(onNode) : undefined;
  // started before the `prepare` calls below so that it runs in parallel with them: they read the
  // parameters, but get this very request from the cache it registers synchronously. Below the
  // `Promise.all` it would make `prepare` the originator and serialize the two requests
  const parametersPromise =
    node != null && target.protocolParameters == null && needsProtocolParameters(schema, paramsCopy)
      ? getCachedProtocolParameters(node)
      : undefined;
  // it is awaited after the `prepare` calls below, don't report it as an unhandled rejection if
  // one of them throws first
  parametersPromise?.catch(() => {});

  await Promise.all(
    schema.map(async ([key, field]) => {
      if (field.prepare == null) return;
      // @ts-expect-error the type of `paramsCopy[key]` can't be determined accurately
      paramsCopy[key] = await field.prepare(paramsCopy[key], paramsCopy, paramsCopy);
    }),
  );

  const protocolParameters = target.protocolParameters ?? (await parametersPromise);

  // @ts-expect-error after preparation properties should be compatible with sync tx builder
  return buildTx({ ...paramsCopy, ...(protocolParameters != null && { protocolParameters }) });
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
