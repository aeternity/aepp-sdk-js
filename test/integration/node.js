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

import Node from '../../src/node'
import { url, internalUrl, ignoreVersion } from './'

import { describe, it, before } from 'mocha'
import { expect } from 'chai'
import * as R from 'ramda'
import NodePool from '../../src/node-pool'

describe('Node client', function () {
  let node

  before(async function () {
    node = await Node({ url, internalUrl, ignoreVersion })
  })

  it('determines remote version', () => {
    expect(node.version).to.be.a('string')
    expect(node.revision).to.be.a('string')
  })

  it('loads operations', () => {
    ['postTransaction', 'getCurrentKeyBlock']
      .map(method => expect(node.api[method]).to.be.a('function'))
  })

  it('gets key blocks by height for the first 3 blocks', () => {
    expect(node.api.getKeyBlockByHeight).to.be.a('function')

    return Promise.all(
      R.range(1, 3).map(async i => {
        const result = await node.api.getKeyBlockByHeight(i)
        expect(result.height, i).to.equal(i)
      })
    )
  })

  it('throws clear exceptions when can\'t get transaction by hash', async () => {
    await expect(node.api.getTransactionByHash('th_test'))
      .to.be.rejectedWith('v3/transactions/th_test error: Invalid hash')
  })

  describe('Node Pool', () => {
    it('throw error on invalid node object', async () => {
      const nodes = await NodePool()
      expect(() => nodes.addNode('test', {})).to.throw(Error)
      expect(() => nodes.addNode('test', 1)).to.throw(Error)
      expect(() => nodes.addNode('test', null)).to.throw(Error)
      expect(() => nodes.addNode('test', {}))
        .to.throw('Each node instance should have api (object), consensusProtocolVersion (number), genesisHash (string) fields, got {} instead')
    })

    it('Throw error on get network without node ', async () => {
      const nodes = await NodePool()
      expect(() => nodes.getNetworkId()).to.throw('networkId is not provided')
    })

    it('Throw error on using API without node', async () => {
      const nodes = await NodePool()
      expect(() => nodes.api.someAPIfn()).to.throw('You can\'t use Node API. Node is not connected or not defined!')
    })

    it('Can change Node', async () => {
      const nodes = await NodePool({
        nodes: [
          { name: 'first', instance: await Node({ url, internalUrl, ignoreVersion }) },
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
      const nodes = await NodePool({
        nodes: [
          { name: 'first', instance: await Node({ url, internalUrl, ignoreVersion }) },
          { name: 'second', instance: node }
        ]
      })
      expect(() => nodes.selectNode('asdasd')).to.throw('Node with name asdasd not in pool')
    })

    it('Can get list of nodes', async () => {
      const nodes = await NodePool({
        nodes: [
          { name: 'first', instance: node }
        ]
      })
      const nodesList = nodes.getNodesInPool()
      nodesList.length.should.be.equal(1)
    })
  })
})
