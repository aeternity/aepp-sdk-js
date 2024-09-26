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
    {
      onNode,
      absoluteTtl,
      _isInternalBuild,
      ...options
    }: {
      onNode?: Node;
      absoluteTtl?: boolean;
      _isInternalBuild?: boolean;
    } & Omit<Parameters<typeof _getPollInterval>[1], 'onNode'>,
  ) {
    if (absoluteTtl !== true && value !== 0 && (value != null || _isInternalBuild === true)) {
      if (onNode == null) throw new ArgumentError('onNode', 'provided', onNode);
      value = (value ?? 3) + (await getHeight({ ...options, onNode, cached: true }));
    }
    return value;
  },
};
