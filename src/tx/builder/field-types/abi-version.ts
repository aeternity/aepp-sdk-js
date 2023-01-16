import { Tag, ConsensusProtocolVersion, AbiVersion } from '../constants';
import { getProtocolDetails } from './ct-version';
import Node from '../../../Node';

export default {
  _getProtocolDetails(c: ConsensusProtocolVersion, tag: Tag): AbiVersion {
    const kind = Tag.ContractCallTx === tag || Tag.GaMetaTx === tag
      ? 'contract-call' : 'oracle-call';
    return getProtocolDetails(c, kind).abiVersion;
  },

  serialize(
    value: AbiVersion | undefined,
    { tag }: { tag: Tag },
    { consensusProtocolVersion = ConsensusProtocolVersion.Iris }:
    { consensusProtocolVersion?: ConsensusProtocolVersion },
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
    if (Object.keys(ConsensusProtocolVersion).length === 2) return undefined;
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
