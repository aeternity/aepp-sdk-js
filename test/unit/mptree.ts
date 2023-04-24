import '..';
import { describe, it } from 'mocha';
import { expect } from 'chai';
import { decode as rlpDecode } from 'rlp';
import type { Input } from 'rlp';
import genMPTreeField from '../../src/tx/builder/field-types/mptree';
import {
  Encoding, Encoded,
  Tag,
  unpackTx,
  MerkleTreeHashMismatchError,
  MissingNodeInTreeError,
  UnknownNodeLengthError,
} from '../../src';

const field = genMPTreeField(Encoding.AccountAddress, Tag.Account);
type MPTreeBinary = Parameters<typeof field.deserialize>[0];
const deserialize = (d: MPTreeBinary): ReturnType<typeof field.deserialize> => (
  field.deserialize(d, { unpackTx })
);
const hexToTreeBinary = (hex: string): MPTreeBinary => rlpDecode(Buffer.from(hex, 'hex') as Input) as MPTreeBinary;

describe('Merkle Patricia Tree', () => {
  const binary = hexToTreeBinary('f9013ea0d4b40fbf270d982d9c9bebc8acd6711db9a2465459f1cb67450f495e3a78f5d2f9011af850a0056232c6f764553f472dacd7bba764e4d630adce971e4437dcf07421e20d6cf3eea03e2e29b62366a6b1e363ebf174fce8e4d9ad61abdc2dde65e3f74923dcd629c48ccb0a010087038d7ea4c67ffcf850a065657db43209ef7d57acb7aaf2e2c38f8828f9d425e4bec0d7de5bfa26496c61eea03269a8e17fffe495df7b47bf0ffb94897e1060baf3192e99978d91010325b62d8ccb0a010087038d7ea4c68004f874a0d4b40fbf270d982d9c9bebc8acd6711db9a2465459f1cb67450f495e3a78f5d2f85180a065657db43209ef7d57acb7aaf2e2c38f8828f9d425e4bec0d7de5bfa26496c618080a0056232c6f764553f472dacd7bba764e4d630adce971e4437dcf07421e20d6cf3808080808080808080808080');
  const binary2 = hexToTreeBinary('f9015ea0eb9824f62f5fc5f1f205394cf9edf94e8597fc6054081af05a9b7f5924061d32f9013af850a0056232c6f764553f472dacd7bba764e4d630adce971e4437dcf07421e20d6cf3eea03e2e29b62366a6b1e363ebf174fce8e4d9ad61abdc2dde65e3f74923dcd629c48ccb0a010087038d7ea4c67ffcf850a065657db43209ef7d57acb7aaf2e2c38f8828f9d425e4bec0d7de5bfa26496c61eea03269a8e17fffe495df7b47bf0ffb94897e1060baf3192e99978d91010325b62d8ccb0a010087038d7ea4c68004f894a0eb9824f62f5fc5f1f205394cf9edf94e8597fc6054081af05a9b7f5924061d32f87180a065657db43209ef7d57acb7aaf2e2c38f8828f9d425e4bec0d7de5bfa26496c618080a0056232c6f764553f472dacd7bba764e4d630adce971e4437dcf07421e20d6cf38080808080808080808080a02275f012f78197935cca6322773642620a62f9a4af9cc8ff3245e3755245fcfc');
  const map: Record<Encoded.AccountAddress, object> = {
    ak_97L4GGbqagBAUZ93g2Qb1QU5W53yDpSgfDj5e5WVJ75wNFmBm: {
      tag: 10, version: 1, nonce: 0, balance: '1000000000000004',
    },
    ak_bS1fWNoYpChJhGS3UMGv6WvwXp55xQYmcUrPoZ9UhcBXEPMsK: {
      tag: 10, version: 1, nonce: 0, balance: '999999999999996',
    },
  };

  it('can deserialize', () => {
    const tree = deserialize(binary);
    expect(tree.isComplete).to.be.equal(true);
  });

  it('can be converted to object', () => {
    const tree = deserialize(binary);
    expect(tree.toObject()).to.be.eql(map);
  });

  it('can serialize', () => {
    const tree = deserialize(binary);
    expect(field.serialize(tree)).to.be.eql(binary);
  });

  it('can retrieve values', () => {
    const tree = deserialize(binary);
    Object.entries(map).forEach(([key, value]: [Encoded.AccountAddress, object]) => {
      expect(tree.get(key)).to.be.eql(value);
    });
  });

  it('can check is equal', () => {
    const tree = deserialize(binary);
    expect(tree.isEqual(deserialize(binary))).to.be.equal(true);
    expect(tree.isEqual(deserialize(binary2))).to.be.equal(false);
  });

  it('throws exception if payload is invalid', () => {
    const brokenValue = hexToTreeBinary('f9013ea0d4b40fbf270d982d9c9bebc8acd6711db9a2465459f1cb67450f495e3a78f5d2f9011af850a0056232c6f764553f472dacd7bba764e4d630adce971e4437dcf07421e20d6cf3eea03e2e29b62366a6b1e363ebf174fce8e4d9ad61abdc2dde65e3f74923dcd629c48ccb0a010087038d7ea4c67ffff850a065657db43209ef7d57acb7aaf2e2c38f8828f9d425e4bec0d7de5bfa26496c61eea03269a8e17fffe495df7b47bf0ffb94897e1060baf3192e99978d91010325b62d8ccb0a010087038d7ea4c68004f874a0d4b40fbf270d982d9c9bebc8acd6711db9a2465459f1cb67450f495e3a78f5d2f85180a065657db43209ef7d57acb7aaf2e2c38f8828f9d425e4bec0d7de5bfa26496c618080a0056232c6f764553f472dacd7bba764e4d630adce971e4437dcf07421e20d6cf3808080808080808080808080');
    expect(() => deserialize(brokenValue)).to.throw(MerkleTreeHashMismatchError, 'Node hash is not equal to provided one');
    const wrongRootHash = hexToTreeBinary('f9013ea0f6322076ba7e911690cf61563126879df81851ae11cd1c7423931ae77672c8dbf9011af850a0056232c6f764553f472dacd7bba764e4d630adce971e4437dcf07421e20d6cf3eea03e2e29b62366a6b1e363ebf174fce8e4d9ad61abdc2dde65e3f74923dcd629c48ccb0a010087038d7ea4c67ffcf850a065657db43209ef7d57acb7aaf2e2c38f8828f9d425e4bec0d7de5bfa26496c61eea03269a8e17fffe495df7b47bf0ffb94897e1060baf3192e99978d91010325b62d8ccb0a010087038d7ea4c68004f874a0d4b40fbf270d982d9c9bebc8acd6711db9a2465459f1cb67450f495e3a78f5d2f85180a065657db43209ef7d57acb7aaf2e2c38f8828f9d425e4bec0d7de5bfa26496c618080a0056232c6f764553f472dacd7bba764e4d630adce971e4437dcf07421e20d6cf3808080808080808080808080');
    expect(() => deserialize(wrongRootHash)).to.throw(MissingNodeInTreeError, 'Can\'t find a node by root hash');
    const wrongBranchNodeLength = hexToTreeBinary('f9013fa0f6322076ba7e911690cf61563126879df81851ae11cd1c7423931ae77672c8dbf9011bf850a0056232c6f764553f472dacd7bba764e4d630adce971e4437dcf07421e20d6cf3eea03e2e29b62366a6b1e363ebf174fce8e4d9ad61abdc2dde65e3f74923dcd629c48ccb0a010087038d7ea4c67ffcf850a065657db43209ef7d57acb7aaf2e2c38f8828f9d425e4bec0d7de5bfa26496c61eea03269a8e17fffe495df7b47bf0ffb94897e1060baf3192e99978d91010325b62d8ccb0a010087038d7ea4c68004f875a0f6322076ba7e911690cf61563126879df81851ae11cd1c7423931ae77672c8dbf85280a065657db43209ef7d57acb7aaf2e2c38f8828f9d425e4bec0d7de5bfa26496c618080a0056232c6f764553f472dacd7bba764e4d630adce971e4437dcf07421e20d6cf380808080808080808080808080');
    expect(() => deserialize(wrongBranchNodeLength)).to.throw(UnknownNodeLengthError, 'Unknown node length: 18');
    const wrongBranchNodeHash = hexToTreeBinary('f9013ea02275f012f78197935cca6322773642620a62f9a4af9cc8ff3245e3755245fcfcf9011af850a0056232c6f764553f472dacd7bba764e4d630adce971e4437dcf07421e20d6cf3eea03e2e29b62366a6b1e363ebf174fce8e4d9ad61abdc2dde65e3f74923dcd629c48ccb0a010087038d7ea4c67ffcf850a065657db43209ef7d57acb7aaf2e2c38f8828f9d425e4bec0d7de5bfa26496c61eea03269a8e17fffe495df7b47bf0ffb94897e1060baf3192e99978d91010325b62d8ccb0a010087038d7ea4c68004f874a02275f012f78197935cca6322773642620a62f9a4af9cc8ff3245e3755245fcfcf85180a065657db432ffef7d57acb7aaf2e2c38f8828f9d425e4bec0d7de5bfa26496c618080a0056232c6f764553f472dacd7bba764e4d630adce971e4437dcf07421e20d6cf3808080808080808080808080');
    expect(deserialize(wrongBranchNodeHash).isComplete).to.equal(false);
  });
});
