/*
 * ISC License (ISC)
 * Copyright (c) 2018 aeternity developers
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
import { rlp } from '../../es/utils/crypto'
import { serialize, deserialize, get, verify } from '../../es/utils/mptree'

describe('Merkle Patricia Tree', function () {
  const binary = Buffer.from('f9013ea0d4b40fbf270d982d9c9bebc8acd6711db9a2465459f1cb67450f495e3a78f5d2f9011af850a0056232c6f764553f472dacd7bba764e4d630adce971e4437dcf07421e20d6cf3eea03e2e29b62366a6b1e363ebf174fce8e4d9ad61abdc2dde65e3f74923dcd629c48ccb0a010087038d7ea4c67ffcf850a065657db43209ef7d57acb7aaf2e2c38f8828f9d425e4bec0d7de5bfa26496c61eea03269a8e17fffe495df7b47bf0ffb94897e1060baf3192e99978d91010325b62d8ccb0a010087038d7ea4c68004f874a0d4b40fbf270d982d9c9bebc8acd6711db9a2465459f1cb67450f495e3a78f5d2f85180a065657db43209ef7d57acb7aaf2e2c38f8828f9d425e4bec0d7de5bfa26496c618080a0056232c6f764553f472dacd7bba764e4d630adce971e4437dcf07421e20d6cf3808080808080808080808080', 'hex')
  const map = {
    '4e2e29b62366a6b1e363ebf174fce8e4d9ad61abdc2dde65e3f74923dcd629c4': 'cb0a010087038d7ea4c67ffc',
    '1269a8e17fffe495df7b47bf0ffb94897e1060baf3192e99978d91010325b62d': 'cb0a010087038d7ea4c68004'
  }

  it('can deserialize', () => {
    const tree = deserialize(rlp.decode(binary))
    tree.should.be.an('object')
    tree.rootHash.should.be.a('string')
    tree.nodes.should.be.an('object')
  })

  it('can serialize', () => {
    const serialized = rlp.encode(serialize(deserialize(rlp.decode(binary))))
    serialized.toString('hex').should.equal(binary.toString('hex'))
  })

  it('can retrieve values', () => {
    const tree = deserialize(rlp.decode(binary))
    Object.entries(map).forEach(([key, value]) => {
      get(tree, key).toString('hex').should.equal(value)
    })
  })

  it('can verify root hash', () => {
    const tree = deserialize(rlp.decode(binary))
    verify(tree).should.equal(true)
    tree.nodes['65657db43209ef7d57acb7aaf2e2c38f8828f9d425e4bec0d7de5bfa26496c61'][1][3] = 13
    verify(tree).should.equal(false)
  })
})
