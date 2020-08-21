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
import { assert, expect } from 'chai'
import * as internal from '../../es/utils/swagger'
import * as R from 'ramda'
import op from './sample-operation.json'
import def from './sample-definition.json'
import JsonBig from '../../es/utils/json-big'

describe('Swagger', function () {
  it('walks through deep structures', () => {
    const input = {
      a: 1,
      b: {
        ba: 2
      },
      c: [3, {
        ca: 4
      }]
    }

    expect(internal.traverseKeys(k => 'x' + k, input)).to.deep.equal({
      xa: 1,
      xb: {
        xba: 2
      },
      xc: [3, {
        xca: 4
      }]
    })
  })

  describe('converts case', () => {
    it('from snake to pascal', () => {
      expect(internal.snakeToPascal('foo_bar_baz')).to.equal('fooBarBaz')
      expect(internal.snakeToPascal('foo_bar_')).to.equal('fooBar_')
      expect(internal.snakeToPascal('_bar_baz')).to.equal('BarBaz')
    })

    it('from pascal to snake', () => {
      expect(internal.pascalToSnake('fooBarBaz')).to.equal('foo_bar_baz')
      expect(internal.pascalToSnake('fooBar')).to.equal('foo_bar')
      expect(internal.pascalToSnake('BarBaz')).to.equal('_bar_baz')
    })
  })

  it('expands paths', () => {
    assert.equal(internal.expandPath('/foo/{bar}/baz/{bop}', { bar: 1, bop: 2, useless: 3 }), '/foo/1/baz/2')
    assert.equal(internal.expandPath('unchanged'), 'unchanged')
  })

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
      const spec = {
        type: 'object',
        required: ['foo'],
        properties: {
          foo: { type: 'integer' },
          bar: { type: 'string' }
        }
      }
      expect(internal.conform({ foo: 5 }, spec)).to.deep.equal({ foo: 5 })
      expect(internal.conform({ foo: 5, bar: 'xxx' }, spec)).to.deep.equal({ foo: 5, bar: 'xxx' })
      expect(internal.conform({ foo: 5, baz: 'yyy' }, spec)).to.deep.equal({ foo: 5 })
      expect(() => internal.conform({ bar: 'xxx' }, spec).to.throw())
    })

    it('errors', () => {
      const spec = { type: 'shizzle' }
      expect(() => internal.conform({}, spec).to.throw())
    })
  })

  it('asserts single element collections', () => {
    expect(() => internal.assertOne([]).to.throw())
    expect(internal.assertOne([1])).to.equal(1)
    expect(() => internal.assertOne([1, 2]).to.throw())
  })

  it('maps operations', async () => {
    const [path, data] = R.head(R.toPairs(op))
    const [method, operation] = R.head(R.toPairs(data))
    const fn = internal.operation(path, method, operation, def)(this, '//v2')
    assert.equal(fn.length, 2)
  })
  it('Serialize BigNumber to JSON', () => {
    const obj = [
      'JSON Test Pattern pass1',
      { 'object with 1 member': ['array with 1 element'] },
      {},
      [],
      -42,
      true,
      false,
      null,
      {
        integer: 1234567890,
        real: -9876.543210,
        e: 0.123456789e-12,
        E: 1.234567890E+34,
        '': 23456789012E666,
        bigNumber: '2378562376872638746283764871268736871391236192461742314',
        zero: 0,
        one: 1,
        space: ' ',
        quote: '"',
        backslash: '\\',
        controls: '\b\f\n\r\t',
        slash: '/ & \\',
        alpha: 'abcdefghijklmnopqrstuvwyz',
        ALPHA: 'ABCDEFGHIJKLMNOPQRSTUVWYZ',
        digit: '0123456789',
        special: "`1~!@#$%^&*()_+-={':[,]}|;.</>?",
        hex: '\u0123\u4567\u89AB\uCDEF\uabcd\uef4A',
        true: true,
        false: false,
        null: null,
        array: [],
        object: { },
        address: '50 St. James Street',
        url: 'http://www.JSON.org/',
        comment: '// /* <!-- --',
        '# -- --> */': ' ',
        ' s p a c e d ': [1, 2, 3,

          4, 5, 6, 7],
        compact: [1, 2, 3, 4, 5, 6, 7],
        jsontext: '{"object with 1 member":["array with 1 element"]}',
        quotes: '&#34; \u0022 %22 0x22 034 &#x22;',
        "/\\\"\uCAFE\uBABE\uAB98\uFCDE\ubcda\uef4A\b\f\n\r\t`1~!@#$%^&*()_+-=[]{}|;:',./<>?": 'A key can be any string'
      },
      0.5, 98.6,
      99.44,

      1066,

      'rosebud']
    const stringified = JsonBig.stringify(obj)
    const parsed = JsonBig.parse(stringified)
    parsed[8][''] = 23456789012E666
    parsed.should.eql(obj)
  })
})
