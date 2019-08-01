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

import Node from '../../es/node'
import { configure, url, internalUrl } from './'

import { describe, it, before } from 'mocha'
import { expect } from 'chai'
import * as R from 'ramda'
import { NodePool } from '../../es/node-pool'

describe('Node client', function () {
  configure(this)

  let client

  before(async function () {
    client = await Node({ url, internalUrl })
  })

  it('determines remote version', () => {
    expect(client.version).to.be.a('string')
    expect(client.revision).to.be.a('string')
  })

  it('loads operations', async () => {
    expect(client.methods).to.include.members(['postTransaction', 'getCurrentKeyBlock'])
  })

  it('gets key blocks by height for the first 3 blocks', () => {
    expect(client.api.getKeyBlockByHeight).to.be.a('function')
    expect(client.api.getKeyBlockByHeight.length).to.equal(1)

    return Promise.all(
      R.range(1, 3).map(async i => {
        const result = await client.api.getKeyBlockByHeight(i)
        expect(result.height, i).to.equal(i)
      })
    )
  })
  describe('Node Pool', () => {
    it('init using old style (url, internalUrl)', async () => {
      const node = await NodePool({ url, internalUrl })
      const nodeInfoKeys = ['name', 'url', 'internalUrl', 'nodeNetworkId', 'version', 'consensusProtocolVersion']
      const isNodeInfo = !Object.keys(node.getNodeInfo).find(k => !nodeInfoKeys.includes(k))
      isNodeInfo.should.be.equal(true)
    })
    it('throw error on invalid node object', async () => {
      const node = await NodePool()
      expect(() => node.addNode('test', {})).to.throw(Error)
      expect(() => node.addNode('test', 1)).to.throw(Error)
      expect(() => node.addNode('test', null)).to.throw(Error)
      try {
        node.addNode('test', {})
      } catch (e) {
        e.message.should.be.equal('Invalid node instance object')
      }
    })
    it('Throw error on using API without node', async () => {
      const node = await NodePool()
      try {
        node.api.someAPIfn()
      } catch (e) {
        e.message.should.be.equal('You can\'t use Node API. Node is not connected or not defined!')
      }
    })
    it('Can change Node', async () => {
      const nodes = await NodePool({
        nodes: [
          { name: 'first', instance: await Node({ url, internalUrl}) },
          { name: 'second', instance: client }
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
          { name: 'first', instance: await Node({ url, internalUrl}) },
          { name: 'second', instance: client }
        ]
      })
      try {
        nodes.selectNode('asdasd')
      } catch (e) {
        e.message.should.be.equal('Node with name asdasd not in pool')
      }
    })
    it('Can get list of nodes', async () => {
      const nodes = await NodePool({
        nodes: [
          { name: 'first', instance: client }
        ]
      })
      const nodesList = nodes.getNodesInPool()
      nodesList.length.should.be.equal(1)
      nodesList[0].url.should.be.equal(url)
      nodesList[0].internalUrl.should.be.equal(internalUrl)
    })

  })
})
