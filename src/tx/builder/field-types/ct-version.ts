import { ConsensusProtocolVersion, VmVersion, AbiVersion } from '../constants';

// First abi/vm by default
export const ProtocolToVmAbi = {
  [ConsensusProtocolVersion.Iris]: {
    'contract-create': {
      vmVersion: [VmVersion.Fate2], abiVersion: [AbiVersion.Fate],
    },
    // TODO: Ensure that AEVM (Sophia?) is still available here
    'contract-call': {
      vmVersion: [], abiVersion: [AbiVersion.Fate, AbiVersion.Sophia],
    },
    'oracle-call': {
      vmVersion: [], abiVersion: [AbiVersion.NoAbi, AbiVersion.Sophia],
    },
  },
} as const;

export interface CtVersion {
  vmVersion: VmVersion;
  abiVersion: AbiVersion;
}

export function getProtocolDetails(
  protocolVersion: ConsensusProtocolVersion,
  type: 'contract-create' | 'contract-call' | 'oracle-call',
): CtVersion {
  const protocol = ProtocolToVmAbi[protocolVersion][type];
  return {
    vmVersion: protocol.vmVersion[0] ?? VmVersion.Fate2,
    abiVersion: protocol.abiVersion[0],
  };
}

export default {
  serialize(
    value: CtVersion | undefined,
    { consensusProtocolVersion = ConsensusProtocolVersion.Iris }:
    { consensusProtocolVersion: ConsensusProtocolVersion },
  ): Buffer {
    value ??= getProtocolDetails(consensusProtocolVersion, 'contract-create');

    return Buffer.from([value.vmVersion, 0, value.abiVersion]);
  },

  deserialize(buffer: Buffer): CtVersion {
    const [vm, , abi] = buffer;
    return { vmVersion: +vm, abiVersion: +abi };
  },
};
