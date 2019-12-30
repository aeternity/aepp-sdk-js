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
import { leftPad, rightPad, toBytes } from '../../es/utils/bytes'

describe('Bytes', function () {
  it('left/right pad', async () => {
    const bytes = Buffer.from('hello')
    const padRightMoreThenLength = rightPad(7, bytes)
    const padRightLessThenLength = rightPad(4, bytes)
    const padLeftMoreThenLength = leftPad(7, bytes)
    const padLeftLessThenLength = leftPad(4, bytes)

    padRightMoreThenLength.equals(Buffer.from([...bytes, 0, 0])).should.be.equal(true)
    padRightLessThenLength.equals(bytes).should.be.equal(true)
    padLeftMoreThenLength.equals(Buffer.from([0, 0, ...bytes])).should.be.equal(true)
    padLeftLessThenLength.equals(bytes).should.be.equal(true)
  })
  it('toBytes: invalid input', () => {
    try {
      toBytes(true)
    } catch (e) {
      e.message.should.be.equal('Byte serialization not supported')
    }
  })
})
