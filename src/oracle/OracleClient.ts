import { pause, Optional } from '../utils/other';
import { oracleQueryId } from '../tx/builder/helpers';
import { unpackTx, buildTxAsync, BuildTxOptions } from '../tx/builder';
import { Tag } from '../tx/builder/constants';
import { RequestTimedOutError } from '../utils/errors';
import { decode, Encoded } from '../utils/encoder';
import { _getPollInterval, getHeight, sendTransaction } from '../chain';
import Node from '../Node';
import AccountBase from '../account/Base';
import OracleBase from './OracleBase';

interface OracleClientPostQueryOptions extends
  Optional<Parameters<typeof sendTransaction>[1], 'onNode' | 'onAccount'>,
  BuildTxOptions<Tag.OracleQueryTx, 'oracleId' | 'senderId' | 'query'> {}

/**
 * @category oracle
 */
export default class OracleClient extends OracleBase {
  /**
   * @param address - Oracle public key
   * @param options - Options object
   * @param options.onAccount - Account to use
   * @param options.onNode - Node to use
   */
  constructor(
    address: Encoded.OracleAddress,
    public override options: { onAccount: AccountBase; onNode: Node } & Parameters<OracleClient['query']>[1],
  ) {
    super(address, options);
  }

  /**
   * Post query to oracle
   * @param query - Query to oracle
   * @param options - Options object
   * @param options.queryTtl - queryTtl Oracle query time to leave
   * @param options.responseTtl - queryFee Oracle query response time to leave
   * @param options.queryFee - queryFee Oracle query fee
   * @param options.fee - fee Transaction fee
   * @param options.ttl - Transaction time to leave
   * @returns Transaction details and query ID
   */
  async postQuery(
    query: string,
    options: OracleClientPostQueryOptions = {},
  ): Promise<
    Awaited<ReturnType<typeof sendTransaction>> & { queryId: Encoded.OracleQueryId }
    > {
    const opt = { ...this.options, ...options };
    const senderId = opt.onAccount.address;

    const oracleQueryTx = await buildTxAsync({
      ...opt,
      tag: Tag.OracleQueryTx,
      oracleId: this.address,
      senderId,
      query,
    });
    const { nonce } = unpackTx(oracleQueryTx, Tag.OracleQueryTx);
    return {
      ...await sendTransaction(oracleQueryTx, opt),
      queryId: oracleQueryId(senderId, nonce, this.address),
    };
  }

  /**
   * Poll for oracle response to query
   * @param queryId - Oracle Query id
   * @param options - Options object
   * @param options.interval - Poll interval
   * @returns Oracle response
   */
  async pollForResponse(
    queryId: Encoded.OracleQueryId,
    options: { interval?: number } & Parameters<typeof _getPollInterval>[1] = {},
  ): Promise<string> {
    const opt = { ...this.options, ...options };
    const interval = opt.interval ?? _getPollInterval('microblock', opt);
    let height;
    let ttl;
    let response;
    do {
      ({ response, ttl } = await opt.onNode
        .getOracleQueryByPubkeyAndQueryId(this.address, queryId));
      const responseBuffer = decode(response as Encoded.OracleResponse);
      if (responseBuffer.length > 0) return responseBuffer.toString();
      await pause(interval);
      height = await getHeight(opt);
    } while (ttl >= height);
    throw new RequestTimedOutError(height);
  }

  /**
   * Post query to oracle and wait for response
   * @param query - Query to oracle
   * @param options - Options object
   * @param options.queryTtl - queryTtl Oracle query time to leave
   * @param options.responseTtl - queryFee Oracle query response time to leave
   * @param options.queryFee - queryFee Oracle query fee
   * @param options.fee - fee Transaction fee
   * @param options.ttl - Transaction time to leave
   * @returns Oracle response
   */
  async query(
    query: string,
    options: OracleClientPostQueryOptions
    & Parameters<OracleClient['pollForResponse']>[1] = {},
  ): Promise<string> {
    const { queryId } = await this.postQuery(query, options);
    return this.pollForResponse(queryId, options);
  }
}
