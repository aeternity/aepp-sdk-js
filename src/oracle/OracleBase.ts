import { decode, Encoded } from '../utils/encoder.js';
import Node from '../Node.js';

/**
 * @category oracle
 */
type OracleQueryNode = Awaited<ReturnType<Node['getOracleQueryByPubkeyAndQueryId']>>;

/**
 * @category oracle
 */
export interface OracleQuery extends OracleQueryNode {
  // TODO: type should be corrected in node api
  id: Encoded.OracleQueryId;
  decodedQuery: string;
  decodedResponse: string;
}

function decodeQuery(queryEntry: OracleQueryNode): OracleQuery {
  return {
    ...queryEntry,
    id: queryEntry.id as Encoded.OracleQueryId,
    decodedQuery: decode(queryEntry.query as Encoded.OracleQuery).toString(),
    decodedResponse: decode(queryEntry.response as Encoded.OracleResponse).toString(),
  };
}

/**
 * This class is needed because `getOracleQuery` would return different values depending on the
 * oracle type.
 * @category oracle
 */
export default class OracleBase {
  /**
   * @param address - Oracle public key
   */
  constructor(
    public readonly address: Encoded.OracleAddress,
    public options: { onNode: Node },
  ) {}

  /**
   * Get oracle entry from the node
   * @param options - Options object
   */
  async getState(options: { onNode?: Node } = {}): ReturnType<Node['getOracleByPubkey']> {
    const opt = { ...this.options, ...options };
    return opt.onNode.getOracleByPubkey(this.address);
  }

  /**
   * Get oracle queries from the node
   * @param options - Options object
   */
  async getQueries(options: { onNode?: Node } = {}): Promise<OracleQuery[]> {
    const opt = { ...this.options, ...options };
    return (await opt.onNode.getOracleQueriesByPubkey(this.address)).oracleQueries.map(decodeQuery);
  }

  /**
   * Get oracle query entry from the node
   * @param queryId - Oracle query ID
   * @param options - Options object
   */
  async getQuery(
    queryId: Encoded.OracleQueryId,
    options: { onNode?: Node } = {},
  ): Promise<OracleQuery> {
    const { onNode } = { ...this.options, ...options };
    const queryEntry = await onNode.getOracleQueryByPubkeyAndQueryId(this.address, queryId);
    return decodeQuery(queryEntry);
  }
}
