import shortUInt from './short-u-int';
import Node from '../../../node/Direct';
import { ArgumentError } from '../../../utils/errors';

/**
 * Time to leave
 */
export default {
  ...shortUInt,

  serialize(value: number | undefined): Buffer {
    return shortUInt.serialize(value ?? 0);
  },

  async prepare(
    value: number | undefined,
    params: {},
    // TODO: { absoluteTtl: true } | { absoluteTtl: false, onNode: Node }
    { onNode, absoluteTtl }: { onNode?: Node; absoluteTtl?: boolean },
  ) {
    if (absoluteTtl !== true && value !== 0 && value != null) {
      if (onNode == null) throw new ArgumentError('onNode', 'provided', onNode);
      value += (await onNode.getCurrentKeyBlock()).height;
    }
    return value;
  },
};
