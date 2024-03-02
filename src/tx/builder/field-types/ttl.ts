import shortUInt from './short-u-int';
import Node from '../../../Node';
import { ArgumentError } from '../../../utils/errors';
import { _getPollInterval, getHeight } from '../../../chain';

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
    { onNode, absoluteTtl, ...options }: {
      onNode?: Node;
      absoluteTtl?: boolean;
    } & Parameters<typeof _getPollInterval>[1],
  ) {
    if (absoluteTtl !== true && value !== 0 && value != null) {
      if (onNode == null) throw new ArgumentError('onNode', 'provided', onNode);
      value += await getHeight({ ...options, onNode, cached: true });
    }
    return value;
  },
};
