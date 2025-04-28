import { isAccountNotFoundError } from '../../../utils/other.js';
import shortUInt from './short-u-int.js';
import Node from '../../../Node.js';
import { ArgumentError } from '../../../utils/errors.js';
import { Enum1 as NextNonceStrategy } from '../../../apis/node/index.js';
import { Tag } from '../constants.js';

export default function genNonceField<SenderKey extends string>(
  senderKey: SenderKey,
): {
  serialize: (value: number, params: { tag: Tag }) => Buffer;
  // TODO: (value: number) => Promise<number> | (value: undefined, ...) => Promise<number>
  prepare: (
    value: number | undefined,
    params: {},
    // TODO: replace `string` with AddressEncodings
    options: { [key in SenderKey]: string } & {
      strategy?: NextNonceStrategy;
      onNode?: Node;
      _isInternalBuild?: boolean;
    },
  ) => Promise<number>;
  deserialize: (value: Buffer) => number;
  senderKey: string;
} {
  return {
    ...shortUInt,

    serialize(value: number, { tag }): Buffer {
      if (Tag.GaAttachTx === tag && value !== 1) {
        throw new ArgumentError('nonce', 'equal 1 if GaAttachTx', value);
      }
      return shortUInt.serialize(value);
    },

    async prepare(value, params, options) {
      if (value != null) return value;
      // TODO: uncomment the below line
      // if (options._isInternalBuild === true) return 0;
      const { onNode, strategy } = options;
      const senderId = options[senderKey];
      const requirement = 'provided (or provide `nonce` instead)';
      if (onNode == null) throw new ArgumentError('onNode', requirement, onNode);
      if (senderId == null) throw new ArgumentError('senderId', requirement, senderId);
      return (
        await onNode
          .getAccountNextNonce(senderId.replace(/^ok_/, 'ak_'), { strategy })
          .catch((error) => {
            if (!isAccountNotFoundError(error)) throw error;
            return { nextNonce: 1 };
          })
      ).nextNonce;
    },

    senderKey,
  };
}
