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

// @ts-expect-error
import Node from '../../src/node'
// @ts-expect-error
import { url, ignoreVersion } from '.'
import { describe, it, before } from 'mocha'
import { expect } from 'chai'
import NodePool from '../../src/node-pool'
import { NodeNotFoundError } from '../../src/utils/errors'

describe('Node client', function () {
  let node: InstanceType<typeof Node>

  before(async function () {
    node = await Node({ url, ignoreVersion })
  })

  it('determines remote version', () => {
    expect(node.version).to.be.a('string')
    expect(node.revision).to.be.a('string')
  })

  it('wraps endpoints', () => {
    ['postTransaction', 'getCurrentKeyBlock']
      .map(method => expect(node.api[method]).to.be.a('function'))
  })

  it('gets key blocks by height for the first 3 blocks', async () => {
    expect(node.api.getKeyBlockByHeight).to.be.a('function')
    const blocks = await Promise.all([1, 2, 3].map(i => node.api.getKeyBlockByHeight(i)))
    expect(blocks.map(b => b.height)).to.eql([1, 2, 3])
  })

  it('throws clear exceptions when can\'t get transaction by hash', async () => {
    await expect(node.api.getTransactionByHash('th_test'))
      .to.be.rejectedWith('v3/transactions/th_test error: Invalid hash')
  })

  describe('Node Pool', () => {
    it('Throw error on using API without node', () => {
      const nodes = NodePool()
      expect(() => nodes.api.someAPIfn()).to.throw(NodeNotFoundError, 'You can\'t use Node API. Node is not connected or not defined!')
    })

    it('Can change Node', async () => {
      const nodes = NodePool({
        nodes: [
          { name: 'first', instance: await Node({ url, ignoreVersion }) },
          { name: 'second', instance: node }
        ]
      })
      const activeNode = nodes.getNodeInfo()
      activeNode.name.should.be.equal('first')
      nodes.selectNode('second')
      const secondNodeInfo = nodes.getNodeInfo()
      secondNodeInfo.name.should.be.equal('second')
    })

    it('Fail on undefined node', async () => {
      const nodes = NodePool({
        nodes: [
          { name: 'first', instance: await Node({ url, ignoreVersion }) },
          { name: 'second', instance: node }
        ]
      })
      expect(() => nodes.selectNode('asdasd')).to.throw(NodeNotFoundError, 'Node with name asdasd not in pool')
    })

    it('Can get list of nodes', () => {
      const nodes = NodePool({
        nodes: [
          { name: 'first', instance: node }
        ]
      })
      const nodesList = nodes.getNodesInPool()
      nodesList.length.should.be.equal(1)
    })
  })
})
