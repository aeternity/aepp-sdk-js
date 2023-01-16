import shortUInt from './short-u-int';
import Node from '../../../Node';

export default {
  ...shortUInt,

  serialize(value: number | undefined): Buffer {
    return shortUInt.serialize(value ?? 0);
  },

  async prepare(
    value: number | undefined,
    params: {},
    { onNode, absoluteTtl }: { onNode: Node; absoluteTtl?: boolean },
  ) {
    if (absoluteTtl !== true && value !== 0 && value != null) {
      value += (await onNode.getCurrentKeyBlock()).height;
    }
    return value;
  },
};
