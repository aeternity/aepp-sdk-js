/**
 * Oracle methods - routines to interact with the æternity oracle system
 *
 * The high-level description of the oracle system is
 * https://github.com/aeternity/protocol/blob/master/ORACLE.md in the protocol
 * repository.
 */

import { mapObject, pause } from './utils/other';
import { oracleQueryId } from './tx/builder/helpers';
import { unpackTx, buildTxAsync, BuildTxOptions } from './tx/builder';
import { Tag } from './tx/builder/constants';
import { RequestTimedOutError } from './utils/errors';
import {
  decode, encode, Encoded, Encoding,
} from './utils/encoder';
import { _getPollInterval, getHeight } from './chain';
import { sendTransaction, SendTransactionOptions } from './send-transaction';
import Node from './Node';
import AccountBase from './account/Base';

type OracleQueries = Awaited<ReturnType<Node['getOracleQueriesByPubkey']>>['oracleQueries'];

/**
 * Poll for oracle queries
 * @category oracle
 * @param oracleId - Oracle public key
 * @param onQuery - OnQuery callback
 * @param options - Options object
 * @param options.interval - Poll interval(default: 5000)
 * @param options.onNode - Node to use
 * @returns Callback to stop polling function
 */
export function pollForQueries(
  oracleId: Encoded.OracleAddress,
  onQuery: (query: OracleQueries[number]) => void,
  { interval, onNode, ...options }: { interval?: number; onNode: Node }
  & Parameters<typeof _getPollInterval>[1],
): () => void {
  interval ??= _getPollInterval('microblock', options);
  const knownQueryIds = new Set();
  const checkNewQueries = async (): Promise<void> => {
    const queries = ((await onNode.getOracleQueriesByPubkey(oracleId)).oracleQueries ?? [])
      .filter(({ id }) => !knownQueryIds.has(id));
    queries.forEach((query) => {
      knownQueryIds.add(query.id);
      onQuery(query);
    });
  };

  let stopped = false;

  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  (async () => {
    while (!stopped) { // eslint-disable-line no-unmodified-loop-condition
      // TODO: allow to handle this error somehow
      await checkNewQueries().catch(console.error);
      await pause(interval);
    }
  })();
  return () => { stopped = true; };
}

/**
 * Poll for oracle query response
 * @category oracle
 * @param oracleId - Oracle public key
 * @param queryId - Oracle Query id
 * @param options - Options object
 * @param options.interval - Poll interval
 * @param options.onNode - Node to use
 * @returns OracleQuery object
 */
export async function pollForQueryResponse(
  oracleId: Encoded.OracleAddress,
  queryId: Encoded.OracleQueryId,
  { interval, onNode, ...options }:
  { interval?: number; onNode: Node } & Parameters<typeof _getPollInterval>[1],
): Promise<string> {
  interval ??= _getPollInterval('microblock', options);
  let height;
  let ttl;
  let response;
  do {
    ({ response, ttl } = await onNode.getOracleQueryByPubkeyAndQueryId(oracleId, queryId));
    const responseBuffer = decode(response as Encoded.OracleResponse);
    if (responseBuffer.length > 0) return responseBuffer.toString();
    await pause(interval);
    height = await getHeight({ ...options, onNode, cached: true });
  } while (ttl >= height);
  throw new RequestTimedOutError(height);
}

/**
 * Constructor for OracleQuery Object (helper object for using OracleQuery)
 * @category oracle
 * @param oracleId - Oracle public key
 * @param queryId - Oracle Query id
 * @param options - Options
 * @returns OracleQuery object
 */
export async function getQueryObject(
  oracleId: Encoded.OracleAddress,
  queryId: Encoded.OracleQueryId,
  options: RespondToQueryOptions & Parameters<typeof pollForQueryResponse>[2],
): Promise<GetQueryObjectReturnType> {
  const record = await options.onNode.getOracleQueryByPubkeyAndQueryId(oracleId, queryId);
  return {
    ...record,
    decodedQuery: decode(record.query as Encoded.OracleQueryId).toString(),
    decodedResponse: decode(record.response as Encoded.OracleResponse).toString(),
    respond: async (response, opt) => (
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      respondToQuery(queryId, response, { ...options, ...opt })
    ),
    pollForResponse: async (opt) => pollForQueryResponse(oracleId, queryId, { ...options, ...opt }),
  };
}

interface GetQueryObjectReturnType extends Awaited<ReturnType<Node['getOracleQueryByPubkeyAndQueryId']>> {
  decodedQuery: string;
  decodedResponse: string;
  respond: (response: string, options?: Parameters<typeof respondToQuery>[2]) =>
  ReturnType<typeof respondToQuery>;
  pollForResponse: (options?: Parameters<typeof pollForQueryResponse>[2]) =>
  ReturnType<typeof pollForQueryResponse>;
}

/**
 * Post query to oracle
 * @category oracle
 * @param oracleId - Oracle public key
 * @param query - Oracle query object
 * @param options - Options object
 * @returns Query object
 */
export async function postQueryToOracle(
  oracleId: Encoded.OracleAddress,
  query: string,
  options: PostQueryToOracleOptions,
): Promise<
  Awaited<ReturnType<typeof sendTransaction>> & Awaited<ReturnType<typeof getQueryObject>>
  > {
  const senderId = options.onAccount.address;

  const oracleQueryTx = await buildTxAsync({
    ...options,
    tag: Tag.OracleQueryTx,
    oracleId,
    senderId,
    query,
  });
  const { nonce } = unpackTx(oracleQueryTx, Tag.OracleQueryTx);
  const queryId = oracleQueryId(senderId, nonce, oracleId);
  return {
    ...await sendTransaction(oracleQueryTx, options),
    ...await getQueryObject(oracleId, queryId, options),
  };
}

type PostQueryToOracleOptionsType = Parameters<typeof sendTransaction>[1]
& Parameters<typeof getQueryObject>[2]
& BuildTxOptions<Tag.OracleQueryTx, 'oracleId' | 'senderId' | 'query'>;
interface PostQueryToOracleOptions extends PostQueryToOracleOptionsType {}

/**
 * Extend oracle ttl
 * @category oracle
 * @param options - Options object
 * @returns Oracle object
 */
export async function extendOracleTtl(options: ExtendOracleTtlOptions): Promise<
Awaited<ReturnType<typeof sendTransaction>> & Awaited<ReturnType<typeof getOracleObject>>
> {
  const oracleId = encode(decode(options.onAccount.address), Encoding.OracleAddress);
  const oracleExtendTx = await buildTxAsync({
    ...options,
    tag: Tag.OracleExtendTx,
    oracleId,
  });
  return {
    ...await sendTransaction(oracleExtendTx, options),
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    ...await getOracleObject(oracleId, options),
  };
}

type ExtendOracleTtlOptionsType = SendTransactionOptions & Parameters<typeof getOracleObject>[1]
& BuildTxOptions<Tag.OracleExtendTx, 'callerId' | 'oracleId'>;
interface ExtendOracleTtlOptions extends ExtendOracleTtlOptionsType {}

/**
 * Extend oracle ttl
 * @category oracle
 * @param queryId - Oracle query id
 * @param response - Oracle query response
 * @param options - Options object
 * @returns Oracle object
 */
export async function respondToQuery(
  queryId: Encoded.OracleQueryId,
  response: string,
  options: RespondToQueryOptions,
): Promise<
  Awaited<ReturnType<typeof sendTransaction>> & Awaited<ReturnType<typeof getOracleObject>>
  > {
  const oracleId = encode(decode(options.onAccount.address), Encoding.OracleAddress);
  const oracleRespondTx = await buildTxAsync({
    ...options,
    tag: Tag.OracleResponseTx,
    oracleId,
    queryId,
    response,
  });
  return {
    ...await sendTransaction(oracleRespondTx, options),
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    ...await getOracleObject(oracleId, options),
  };
}

type RespondToQueryOptionsType = SendTransactionOptions & Parameters<typeof getOracleObject>[1]
& BuildTxOptions<Tag.OracleResponseTx, 'callerId' | 'oracleId' | 'queryId' | 'response'>;
interface RespondToQueryOptions extends RespondToQueryOptionsType {}

/**
 * Constructor for Oracle Object (helper object for using Oracle)
 * @category oracle
 * @param oracleId - Oracle public key
 * @param options - Options
 * @returns Oracle object
 */
export async function getOracleObject(
  oracleId: Encoded.OracleAddress,
  options: { onNode: Node; onAccount: AccountBase },
): Promise<GetOracleObjectReturnType> {
  return {
    ...await options.onNode.getOracleByPubkey(oracleId),
    queries: (await options.onNode.getOracleQueriesByPubkey(oracleId)).oracleQueries,
    ...mapObject<Function, Function>(
      {
        pollQueries: pollForQueries,
        postQuery: postQueryToOracle,
        respondToQuery,
        extendOracle: extendOracleTtl,
        getQuery: getQueryObject,
      },
      ([name, handler]) => [
        name,
        (...args: any) => {
          const lastArg = args[args.length - 1];
          if (lastArg != null && typeof lastArg === 'object' && lastArg.constructor === Object) {
            Object.assign(lastArg, { ...options, ...lastArg });
          } else args.push(options);
          return handler(
            ...['extendOracle', 'respondToQuery'].includes(name) ? [] : [oracleId],
            ...args,
          );
        },
      ],
    ),
  } as any;
}

interface GetOracleObjectReturnType extends Awaited<ReturnType<Node['getOracleByPubkey']>> {
  id: Encoded.OracleAddress;
  queries: OracleQueries;
  // TODO: replace getOracleObject with a class
  pollQueries: (cb: Parameters<typeof pollForQueries>[1]) => ReturnType<typeof pollForQueries>;
  postQuery: Function;
  respondToQuery: Function;
  extendOracle: Function;
  getQuery: Function;
}

/**
 * Register oracle
 * @category oracle
 * @param queryFormat - Format of query
 * @param responseFormat - Format of query response
 * @param options - Options
 * @returns Oracle object
 */
export async function registerOracle(
  queryFormat: string,
  responseFormat: string,
  options: RegisterOracleOptions,
): Promise<
  Awaited<ReturnType<typeof sendTransaction>> & Awaited<ReturnType<typeof getOracleObject>>
  > {
  const accountId = options.onAccount.address;
  const oracleRegisterTx = await buildTxAsync({
    ...options,
    tag: Tag.OracleRegisterTx,
    accountId,
    queryFormat,
    responseFormat,
  });
  return {
    ...await sendTransaction(oracleRegisterTx, options),
    ...await getOracleObject(encode(decode(accountId), Encoding.OracleAddress), options),
  };
}

type RegisterOracleOptionsType = SendTransactionOptions & Parameters<typeof getOracleObject>[1]
& BuildTxOptions<Tag.OracleRegisterTx, 'accountId' | 'queryFormat' | 'responseFormat'>;
interface RegisterOracleOptions extends RegisterOracleOptionsType {}
