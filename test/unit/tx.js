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
import { salt } from '../../es/utils/crypto'
import { commitmentHash } from '../../es/tx/builder/helpers'
import { BigNumber } from 'bignumber.js'
import { toBytes } from '../../es/utils/bytes'

describe('Tx', function () {
  it('reproducible commitment hashes can be generated', async () => {
    const _salt = salt()
    const hash = await commitmentHash('foobar.aet', _salt)
    hash.should.be.a('string')
    return hash.should.be.equal(await commitmentHash('foobar.aet', _salt))
  })
  it('test from big number to bytes', async () => {
    // TODO investigate about float numbers serialization
    const data = [
      BigNumber('7841237845261982793129837487239459234675231423423453451234'),
      BigNumber('7841237845261982793129837487239459214234234534523'),
      BigNumber('7841237845261982793129837412341231231'),
      BigNumber('78412378452619'),
      BigNumber('7841237845261982793129837487239459214124563456'),
      BigNumber('7841237845261982793129837487239459214123')
    ]

    function bnFromBytes (bn) {
      const bytes = toBytes(bn, true)
      return BigNumber(bytes.toString('hex'), 16).toString(10)
    }

    data.forEach(n => {
      n.toString(10).should.be.equal(bnFromBytes(n))
    })
  })
})
