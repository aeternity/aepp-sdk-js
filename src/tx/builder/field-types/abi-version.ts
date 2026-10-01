import { Tag, ConsensusProtocolVersion, AbiVersion } from '../constants.js';
import { getProtocolDetails, isProtocolIndependent } from './ct-version.js';
import Node from '../../../Node.js';

function getKind(tag: Tag): 'contract-call' | 'oracle-call' {
  return Tag.ContractCallTx === tag || Tag.GaMetaTx === tag ? 'contract-call' : 'oracle-call';
}

export default {
  _getProtocolDetails(c: ConsensusProtocolVersion, tag: Tag): AbiVersion {
    return getProtocolDetails(c, getKind(tag)).abiVersion;
  },

  serialize(
    value: AbiVersion | undefined,
    { tag }: { tag: Tag },
    {
      consensusProtocolVersion = ConsensusProtocolVersion.Ceres,
    }: { consensusProtocolVersion?: ConsensusProtocolVersion },
  ): Buffer {
    const result = value ?? this._getProtocolDetails(consensusProtocolVersion, tag);

    return Buffer.from([result]);
  },

  async prepare(
    value: AbiVersion | undefined,
    { tag }: { tag: Tag },
    // TODO: { consensusProtocolVersion: ConsensusProtocolVersion } | { onNode: Node } | {}
    options: { consensusProtocolVersion?: ConsensusProtocolVersion; onNode?: Node },
  ): Promise<AbiVersion | undefined> {
    if (value != null) return value;
    if (options.consensusProtocolVersion != null) return undefined;
    if (isProtocolIndependent(getKind(tag))) return undefined;
    if (options.onNode != null) {
      return this._getProtocolDetails(
        (await options.onNode.getNodeInfo()).consensusProtocolVersion,
        tag,
      );
    }
    return undefined;
  },

  deserialize(buffer: Buffer): AbiVersion {
    return buffer[0];
  },
};
