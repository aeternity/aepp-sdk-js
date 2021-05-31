/*
 * ISC License (ISC)
 * Copyright (c) 2021 aeternity developers
 *
 *  Permission to use, copy, modify, and/or distribute this software for any
 *  purpose with or without fee is hereby granted, provided that the above
 *  copyright notice and this permission notice appear in all copies.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
 *  REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
 *  AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 *  INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
 *  LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
 *  OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
 *  PERFORMANCE OF THIS SOFTWARE.
 */

import '../'
import { describe, it } from 'mocha'
import { expect } from 'chai'
import { decode as rlpDecode } from 'rlp'
import type { Input } from 'rlp'
import MPTree from '../../src/utils/mptree'
import type { MPTreeBinary } from '../../src/utils/mptree'

const hexToTreeBinary = (hex: string): MPTreeBinary => {
  return rlpDecode(Buffer.from(hex, 'hex') as Input) as MPTreeBinary
}

describe('Merkle Patricia Tree', function () {
  const binary = hexToTreeBinary('f9013ea0d4b40fbf270d982d9c9bebc8acd6711db9a2465459f1cb67450f495e3a78f5d2f9011af850a0056232c6f764553f472dacd7bba764e4d630adce971e4437dcf07421e20d6cf3eea03e2e29b62366a6b1e363ebf174fce8e4d9ad61abdc2dde65e3f74923dcd629c48ccb0a010087038d7ea4c67ffcf850a065657db43209ef7d57acb7aaf2e2c38f8828f9d425e4bec0d7de5bfa26496c61eea03269a8e17fffe495df7b47bf0ffb94897e1060baf3192e99978d91010325b62d8ccb0a010087038d7ea4c68004f874a0d4b40fbf270d982d9c9bebc8acd6711db9a2465459f1cb67450f495e3a78f5d2f85180a065657db43209ef7d57acb7aaf2e2c38f8828f9d425e4bec0d7de5bfa26496c618080a0056232c6f764553f472dacd7bba764e4d630adce971e4437dcf07421e20d6cf3808080808080808080808080')
  const binary2 = hexToTreeBinary('f9015ea0eb9824f62f5fc5f1f205394cf9edf94e8597fc6054081af05a9b7f5924061d32f9013af850a0056232c6f764553f472dacd7bba764e4d630adce971e4437dcf07421e20d6cf3eea03e2e29b62366a6b1e363ebf174fce8e4d9ad61abdc2dde65e3f74923dcd629c48ccb0a010087038d7ea4c67ffcf850a065657db43209ef7d57acb7aaf2e2c38f8828f9d425e4bec0d7de5bfa26496c61eea03269a8e17fffe495df7b47bf0ffb94897e1060baf3192e99978d91010325b62d8ccb0a010087038d7ea4c68004f894a0eb9824f62f5fc5f1f205394cf9edf94e8597fc6054081af05a9b7f5924061d32f87180a065657db43209ef7d57acb7aaf2e2c38f8828f9d425e4bec0d7de5bfa26496c618080a0056232c6f764553f472dacd7bba764e4d630adce971e4437dcf07421e20d6cf38080808080808080808080a02275f012f78197935cca6322773642620a62f9a4af9cc8ff3245e3755245fcfc')
  const map = {
    '4e2e29b62366a6b1e363ebf174fce8e4d9ad61abdc2dde65e3f74923dcd629c4': 'cb0a010087038d7ea4c67ffc',
    '1269a8e17fffe495df7b47bf0ffb94897e1060baf3192e99978d91010325b62d': 'cb0a010087038d7ea4c68004'
  }

  it('can deserialize', () => {
    expect(() => new MPTree(binary)).to.not.throw()
  })

  it('can serialize', () => {
    const serialized = new MPTree(binary).serialize()
    expect(serialized).to.be.eql(binary)
  })

  it('can retrieve values', () => {
    const tree = new MPTree(binary)
    Object.entries(map).forEach(([key, value]) => {
      expect(tree.get(key)?.toString('hex')).to.be.equal(value)
    })
  })

  it('can check is equal', () => {
    const tree = new MPTree(binary)
    expect(tree.isEqual(new MPTree(binary))).to.be.equal(true)
    expect(tree.isEqual(new MPTree(binary2))).to.be.equal(false)
  })

  it('throws exception if payload is invalid', () => {
    const brokenValue = hexToTreeBinary('f9013ea0d4b40fbf270d982d9c9bebc8acd6711db9a2465459f1cb67450f495e3a78f5d2f9011af850a0056232c6f764553f472dacd7bba764e4d630adce971e4437dcf07421e20d6cf3eea03e2e29b62366a6b1e363ebf174fce8e4d9ad61abdc2dde65e3f74923dcd629c48ccb0a010087038d7ea4c67ffff850a065657db43209ef7d57acb7aaf2e2c38f8828f9d425e4bec0d7de5bfa26496c61eea03269a8e17fffe495df7b47bf0ffb94897e1060baf3192e99978d91010325b62d8ccb0a010087038d7ea4c68004f874a0d4b40fbf270d982d9c9bebc8acd6711db9a2465459f1cb67450f495e3a78f5d2f85180a065657db43209ef7d57acb7aaf2e2c38f8828f9d425e4bec0d7de5bfa26496c618080a0056232c6f764553f472dacd7bba764e4d630adce971e4437dcf07421e20d6cf3808080808080808080808080')
    expect(() => new MPTree(brokenValue)).to.throw('Node hash is not equal to provided one')
    const wrongRootHash = hexToTreeBinary('f9013ea0f6322076ba7e911690cf61563126879df81851ae11cd1c7423931ae77672c8dbf9011af850a0056232c6f764553f472dacd7bba764e4d630adce971e4437dcf07421e20d6cf3eea03e2e29b62366a6b1e363ebf174fce8e4d9ad61abdc2dde65e3f74923dcd629c48ccb0a010087038d7ea4c67ffcf850a065657db43209ef7d57acb7aaf2e2c38f8828f9d425e4bec0d7de5bfa26496c61eea03269a8e17fffe495df7b47bf0ffb94897e1060baf3192e99978d91010325b62d8ccb0a010087038d7ea4c68004f874a0d4b40fbf270d982d9c9bebc8acd6711db9a2465459f1cb67450f495e3a78f5d2f85180a065657db43209ef7d57acb7aaf2e2c38f8828f9d425e4bec0d7de5bfa26496c618080a0056232c6f764553f472dacd7bba764e4d630adce971e4437dcf07421e20d6cf3808080808080808080808080')
    expect(() => new MPTree(wrongRootHash)).to.throw('Can\'t find a node by root hash')
    const wrongBranchNodeLength = hexToTreeBinary('f9013fa0f6322076ba7e911690cf61563126879df81851ae11cd1c7423931ae77672c8dbf9011bf850a0056232c6f764553f472dacd7bba764e4d630adce971e4437dcf07421e20d6cf3eea03e2e29b62366a6b1e363ebf174fce8e4d9ad61abdc2dde65e3f74923dcd629c48ccb0a010087038d7ea4c67ffcf850a065657db43209ef7d57acb7aaf2e2c38f8828f9d425e4bec0d7de5bfa26496c61eea03269a8e17fffe495df7b47bf0ffb94897e1060baf3192e99978d91010325b62d8ccb0a010087038d7ea4c68004f875a0f6322076ba7e911690cf61563126879df81851ae11cd1c7423931ae77672c8dbf85280a065657db43209ef7d57acb7aaf2e2c38f8828f9d425e4bec0d7de5bfa26496c618080a0056232c6f764553f472dacd7bba764e4d630adce971e4437dcf07421e20d6cf380808080808080808080808080')
    expect(() => new MPTree(wrongBranchNodeLength)).to.throw('Unknown node length: 18')
    const wrongBranchNodeHash = hexToTreeBinary('f9013ea02275f012f78197935cca6322773642620a62f9a4af9cc8ff3245e3755245fcfcf9011af850a0056232c6f764553f472dacd7bba764e4d630adce971e4437dcf07421e20d6cf3eea03e2e29b62366a6b1e363ebf174fce8e4d9ad61abdc2dde65e3f74923dcd629c48ccb0a010087038d7ea4c67ffcf850a065657db43209ef7d57acb7aaf2e2c38f8828f9d425e4bec0d7de5bfa26496c61eea03269a8e17fffe495df7b47bf0ffb94897e1060baf3192e99978d91010325b62d8ccb0a010087038d7ea4c68004f874a02275f012f78197935cca6322773642620a62f9a4af9cc8ff3245e3755245fcfcf85180a065657db432ffef7d57acb7aaf2e2c38f8828f9d425e4bec0d7de5bfa26496c618080a0056232c6f764553f472dacd7bba764e4d630adce971e4437dcf07421e20d6cf3808080808080808080808080')
    expect(() => new MPTree(wrongBranchNodeHash)).to.throw('Can\'t find a node by hash in branch node')
  })
})
