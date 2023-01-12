import { Tag, ConsensusProtocolVersion, AbiVersion } from '../constants';
import { getProtocolDetails } from './ct-version';

export default {
  serialize(
    value: AbiVersion | undefined,
    { tag, consensusProtocolVersion = ConsensusProtocolVersion.Iris }:
    { tag: Tag; consensusProtocolVersion: ConsensusProtocolVersion },
  ): Buffer {
    const result = value ?? getProtocolDetails(
      consensusProtocolVersion,
      Tag.ContractCallTx === tag || Tag.GaMetaTx === tag ? 'contract-call' : 'oracle-call',
    ).abiVersion;

    return Buffer.from([result]);
  },

  deserialize(buffer: Buffer): AbiVersion {
    return buffer[0];
  },
};
