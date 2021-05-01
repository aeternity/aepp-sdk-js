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
import { expect } from 'chai'
import BigNumber from 'bignumber.js'
import { leftPad, rightPad, toBytes, bigNumberToByteArray } from '../../src/utils/bytes'
import { isBase64, snakeToPascal, pascalToSnake } from '../../src/utils/string'

describe('Bytes', function () {
  const bytes = Buffer.from('hello')

  it('left/right pad', () => {
    rightPad(7, bytes).should.be.eql(Buffer.from([...bytes, 0, 0]))
    rightPad(4, bytes).should.be.eql(bytes)
    leftPad(7, bytes).should.be.eql(Buffer.from([0, 0, ...bytes]))
    leftPad(4, bytes).should.be.eql(bytes)
  })

  it('toBytes: converts null to empty array', () => {
    toBytes(null).should.be.eql(Buffer.from([]))
  })

  it('is base64 string', () => isBase64(bytes.toString('base64')).should.be.equal(true))

  it('is not base64 string', () => isBase64('hello').should.be.equal(false))

  const testCase = 'test_test-testTest'

  it('converts snake to pascal case', () => snakeToPascal(testCase)
    .should.be.equal('testTest-testTest'))

  it('converts pascal to snake case', () => pascalToSnake(testCase)
    .should.be.equal('test_test-test_test'))

  describe('bigNumberToByteArray', () => {
    it('converts BigNumber to Buffer', () => bigNumberToByteArray(new BigNumber('1000'))
      .readInt16BE().should.be.equal(1000))

    it('throws error if BigNumber is not integer', () =>
      expect(() => bigNumberToByteArray(new BigNumber('1.5')))
        .to.throw(/Unexpected not integer value:/))
  })
})
