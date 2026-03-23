import shortUInt from './short-u-int.js';
import Node from '../../../Node.js';
import { ArgumentError } from '../../../utils/errors.js';
import { _getPollInterval, getHeight } from '../../../chain.js';

// TODO: restore after the mainnet mining issue is solved, was used via `_isInternalBuild` flag
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const DEFAULT_INTERNAL_RELATIVE_TTL = 3;

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
    {
      onNode,
      absoluteTtl,
      ...options
    }: {
      onNode?: Node;
      absoluteTtl?: boolean;
    } & Omit<Parameters<typeof _getPollInterval>[1], 'onNode'>,
  ) {
    if (absoluteTtl !== true && value !== 0 && value != null) {
      if (onNode == null) throw new ArgumentError('onNode', 'provided', onNode);
      value += await getHeight({ ...options, onNode, cached: true });
    }
    return value;
  },
};
