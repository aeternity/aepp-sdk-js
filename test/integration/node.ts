/*
 * ISC License (ISC)
 * Copyright (c) 2022 aeternity developers
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

import Node from '../../src/node'
import AeSdkBase from '../../src/AeSdkBase'
// @ts-expect-error
import { url, ignoreVersion } from '.'
import { describe, it, before } from 'mocha'
import { expect } from 'chai'
import { NodeNotFoundError } from '../../src/utils/errors'

describe('Node client', function () {
  // TODO should be changed once Node doesn't use stamps
  let node: InstanceType<typeof Node>

  before(async function () {
    node = new Node(url, { ignoreVersion })
  })

  it('wraps endpoints', () => {
    (['postTransaction', 'getCurrentKeyBlock'] as const)
      .map(method => expect(node[method]).to.be.a('function'))
  })

  it('gets key blocks by height for the first 3 blocks', async () => {
    expect(node.getKeyBlockByHeight).to.be.a('function')
    const blocks = await Promise.all([1, 2, 3].map(async i => await node.getKeyBlockByHeight(i)))
    expect(blocks.map(b => b.height)).to.eql([1, 2, 3])
  })

  it('throws clear exceptions when can\'t get transaction by hash', async () => {
    await expect(node.getTransactionByHash('th_test'))
      .to.be.rejectedWith('v3/transactions/th_test error: Invalid hash')
  })

  describe('Node Pool', () => {
    it('Throw error on using API without node', () => {
      const nodes = new AeSdkBase({})
      expect(() => nodes.api)
        .to.throw(NodeNotFoundError, 'You can\'t use Node API. Node is not connected or not defined!')
    })

    it('Can change Node', async () => {
      const nodes = new AeSdkBase({
        nodes: [
          { name: 'first', instance: new Node(url, { ignoreVersion }) },
          { name: 'second', instance: node }
        ]
      })
      const activeNode = await nodes.getNodeInfo()
      activeNode.name.should.be.equal('first')
      nodes.selectNode('second')
      const secondNodeInfo = await nodes.getNodeInfo()
      secondNodeInfo.name.should.be.equal('second')
    })

    it('Fail on undefined node', async () => {
      const nodes = new AeSdkBase({
        nodes: [
          { name: 'first', instance: new Node(url, { ignoreVersion }) },
          { name: 'second', instance: node }
        ]
      })
      expect(() => nodes.selectNode('asdasd')).to.throw(NodeNotFoundError, 'Node with name asdasd not in pool')
    })

    it('Can get list of nodes', async () => {
      const nodes = new AeSdkBase({
        nodes: [
          { name: 'first', instance: node }
        ]
      })
      const nodesList = await nodes.getNodesInPool()
      nodesList.length.should.be.equal(1)
    })
  })
})
