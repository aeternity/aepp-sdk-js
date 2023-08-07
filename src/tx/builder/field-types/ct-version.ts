import { ConsensusProtocolVersion, VmVersion, AbiVersion } from '../constants';
import Node from '../../../Node';

/*
 * First abi/vm by default
 * @see {@link https://github.com/aeternity/protocol/blob/71cf111/contracts/contract_vms.md#virtual-machines-on-the-æternity-blockchain}
 */
export const ProtocolToVmAbi = {
  [ConsensusProtocolVersion.Iris]: {
    'contract-create': {
      vmVersion: [VmVersion.Fate2], abiVersion: [AbiVersion.Fate],
    },
    'contract-call': {
      vmVersion: [], abiVersion: [AbiVersion.Fate, AbiVersion.Sophia],
    },
    'oracle-call': {
      vmVersion: [], abiVersion: [AbiVersion.NoAbi, AbiVersion.Fate],
    },
  },
  [ConsensusProtocolVersion.Ceres]: {
    'contract-create': {
      vmVersion: [VmVersion.Fate3], abiVersion: [AbiVersion.Fate],
    },
    'contract-call': {
      vmVersion: [], abiVersion: [AbiVersion.Fate],
    },
    'oracle-call': {
      vmVersion: [], abiVersion: [AbiVersion.NoAbi, AbiVersion.Fate],
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
    params: {},
    { consensusProtocolVersion = ConsensusProtocolVersion.Iris }:
    { consensusProtocolVersion?: ConsensusProtocolVersion },
  ): Buffer {
    value ??= getProtocolDetails(consensusProtocolVersion, 'contract-create');

    return Buffer.from([value.vmVersion, 0, value.abiVersion]);
  },

  async prepare(
    value: CtVersion | undefined,
    params: {},
    // TODO: { consensusProtocolVersion: ConsensusProtocolVersion } | { onNode: Node } | {}
    options: { consensusProtocolVersion?: ConsensusProtocolVersion; onNode?: Node },
  ): Promise<CtVersion | undefined> {
    if (value != null) return value;
    if (options.consensusProtocolVersion != null) return undefined;
    if (Object.keys(ConsensusProtocolVersion).length === 2) return undefined;
    if (options.onNode != null) {
      return getProtocolDetails(
        (await options.onNode.getNodeInfo()).consensusProtocolVersion,
        'contract-create',
      );
    }
    return undefined;
  },

  deserialize(buffer: Buffer): CtVersion {
    const [vm, , abi] = buffer;
    return { vmVersion: +vm, abiVersion: +abi };
  },
};
