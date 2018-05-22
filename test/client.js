/*
 * ISC License (ISC)
 * Copyright 2018 aeternity developers
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

import { assert, expect } from 'chai'
import { internal } from '../src/client'
import Ae from '../src'
import { url, internalUrl, waitReady, TIMEOUT } from './utils'
import * as R from 'ramda'
import op from './sample-operation.json'

describe('client', function () {
  let client

  before(async function () {
    this.timeout(TIMEOUT)
    await waitReady(this)
    client = await Ae.create(url, { internal: internalUrl })
  })

  it('expands paths', () => {
    assert.equal(internal.expandPath('/foo/{bar}/baz/{bop}', { bar: 1, bop: 2, useless: 3 }), '/foo/1/baz/2')
    assert.equal(internal.expandPath('unchanged'), 'unchanged')
  }),

  it('determines remote version', () => {
    expect(client.version).to.be.a('string')
  }),
  
  describe('conforms', () => {
    it('integers', () => {
      const spec = { type: 'integer' }
      assert.equal(5, internal.conform(5, spec))
      assert.equal(5, internal.conform(5.5, spec))
      expect(() => internal.conform('5', spec).to.throw())
    })

    it('strings', () => {
      const spec = { type: 'string' }
      assert.equal('abc', internal.conform('abc', spec))
      expect(() => internal.conform(5, spec).to.throw())
    })

    it('enums', () => {
      const spec = { type: 'string', enum: ['abc', 'def'] }
      assert.equal('abc', internal.conform('abc', spec))
      expect(() => internal.conform('xyz', spec).to.throw())
    })

    it('refs', () => {
      const types = { FooBar: { type: 'string' } }
      const spec = { schema: { $ref: '#/definitions/FooBar' } }
      const invalidSpec = { schema: { $ref: 'FooBar' } }
      assert.equal('abc', internal.conform('abc', spec, types))
      expect(() => internal.conform(1, spec, types).to.throw())
      expect(() => internal.conform('abc', invalidSpec, types).to.throw())
    })

    it('objects', () => {
      const spec = { type: 'object', required: ['foo'], properties: {
        foo: { type: 'integer' },
        bar: { type: 'string' }
      }}
      expect(internal.conform({ foo: 5 }, spec)).to.deep.equal({ foo: 5 })
      expect(internal.conform({ foo: 5, bar: 'xxx' }, spec)).to.deep.equal({ foo: 5, bar: 'xxx' })
      expect(internal.conform({ foo: 5, baz: 'yyy' }, spec)).to.deep.equal({ foo: 5 })
      expect(() => internal.conform({ bar: 'xxx' }, spec).to.throw())
    })

    it('error', () => {
      const spec = { type: 'shizzle' }
      expect(() => internal.conform({}, spec).to.throw())
    })
  })

  it('loads operations', async () => {
    expect(client.methods).to.include.members(['postTx', 'getBlockByHeight'])
  })

  it('maps operations', async () => {
    const [path, data] = R.head(R.toPairs(op))
    const [method, operation] = R.head(R.toPairs(data))
    const fn = internal.operation(path, method, operation)(`${url}/v2`)
    assert.equal(fn.length, 2)
    const result = await fn(5, { tx_encoding: 'message_pack' })
    assert.ok(result)
  })

  it('gets blocks by height for the first 10 blocks', () => {
    this.timeout(TIMEOUT)
    expect(client.api.getBlockByHeight).to.be.a('function')
    expect(client.api.getBlockByHeight.length).to.equal(2)

    return Promise.all(
      R.map(async i => {
        const result = await client.api.getBlockByHeight(i)
        expect(result.height, i).to.equal(i)
      }, R.range(1, 11))
    )
  })

  it('asserts single element collections', () => {
    expect(() => internal.assertOne([]).to.throw())
    expect(internal.assertOne([1])).to.equal(1)
    expect(() => internal.assertOne([1, 2]).to.throw())
  })

  it('throws on unsupported interface', () => {
    expect(() => client.api.getPubKey()).to.throw()
  })
})
