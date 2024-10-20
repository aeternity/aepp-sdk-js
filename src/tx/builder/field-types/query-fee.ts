import coinAmount from './coin-amount.js';
import { Int } from '../constants.js';
import Node from '../../../Node.js';
import { Encoded } from '../../../utils/encoder.js';
import { ArgumentError } from '../../../utils/errors.js';

/**
 * Oracle query fee
 */
export default {
  ...coinAmount,

  async prepare(
    value: Int | undefined,
    params: {},
    options: { oracleId?: Encoded.OracleAddress; onNode?: Node },
  ) {
    if (value != null) return value;
    const { onNode, oracleId } = options;
    const requirement = 'provided (or provide `queryFee` instead)';
    if (onNode == null) throw new ArgumentError('onNode', requirement, onNode);
    if (oracleId == null) throw new ArgumentError('oracleId', requirement, oracleId);
    return (await onNode.getOracleByPubkey(oracleId)).queryFee.toString();
  },
};
